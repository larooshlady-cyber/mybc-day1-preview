#!/usr/bin/env node
/*
 * MYBC local Regen server — true one-click image regeneration.
 * Serves this folder AND exposes POST /api/regen {id}, which runs `claude -p`
 * headless (it has the Magnific MCP) to regenerate that post's image and overwrite it.
 *
 * Run:   node regen-server.js     then open  http://localhost:8787
 * Needs: the `claude` CLI on PATH with the Magnific MCP available in /Users/georgematiashvili
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8787;
const ROOT = __dirname;                                   // .../MYBC_Day1
const HOME = '/Users/georgematiashvili';                  // dir where Magnific MCP is configured
const MANIFEST = path.join(ROOT, 'regen', 'posts.json');

const MIME = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.json':'application/json','.mp4':'video/mp4','.svg':'image/svg+xml'};

function loadManifest(){ return JSON.parse(fs.readFileSync(MANIFEST,'utf8')); }

function buildInstruction(m, post){
  const refs = post.refs.map(r => `{"type":"image","identifier":"${m.refs[r]}"}`).join(', ');
  const outPath = path.join(ROOT, post.file);
  return [
    'Regenerate ONE MYBC marketing image using the Magnific MCP. Do exactly these steps and nothing else:',
    '',
    '1. Call the tool mcp__magnific__images_generate with these arguments:',
    `   mode: "${m.model}"`,
    `   aspectRatio: "${m.aspectRatio}"`,
    `   resolution: "${m.resolution}"`,
    '   count: 1',
    `   references: [${refs}]`,
    '   prompt (use verbatim, between the <<< >>> markers):',
    `   <<<${post.prompt}>>>`,
    '',
    '2. Take the returned creation identifier and call mcp__magnific__creations_wait on it (repeat until status is "completed"). Read results.url (the full-resolution PNG URL).',
    '',
    `3. Run a bash command to download and OVERWRITE the file:  curl -s "<results.url>" -o "${outPath}"`,
    '',
    `4. Verify "${outPath}" exists and is larger than 100000 bytes, then reply with exactly: DONE`,
    '',
    'Do not ask questions. Do not edit any other file. Do not commit or push.'
  ].join('\n');
}

function regen(id){
  return new Promise((resolve)=>{
    let m, post;
    try { m = loadManifest(); post = m.posts.find(p=>p.id===id); }
    catch(e){ return resolve({ok:false, error:'manifest read failed: '+e.message}); }
    if(!post) return resolve({ok:false, error:'unknown id: '+id});

    const instruction = buildInstruction(m, post);
    const child = spawn('claude', ['-p','--dangerously-skip-permissions'], {cwd: HOME, env: process.env});
    let out='', err='';
    const killer = setTimeout(()=>{ try{child.kill('SIGKILL');}catch(_){} }, 6*60*1000);
    child.stdout.on('data',d=>out+=d);
    child.stderr.on('data',d=>err+=d);
    child.on('error',e=>{ clearTimeout(killer); resolve({ok:false, error:'spawn failed: '+e.message}); });
    child.on('close',code=>{
      clearTimeout(killer);
      const file = path.join(ROOT, post.file);
      let okFile=false; try{ okFile = fs.statSync(file).size>100000; }catch(_){}
      if(okFile) resolve({ok:true, file:post.file, ts:Date.now()});
      else resolve({ok:false, error:'generation did not produce a file (exit '+code+')', log:(out+err).slice(-1200)});
    });
    child.stdin.write(instruction); child.stdin.end();
    console.log(`[regen] ${id} -> ${post.file} (running claude…)`);
  });
}

const server = http.createServer((req,res)=>{
  const u = new URL(req.url, `http://localhost:${PORT}`);
  if(u.pathname==='/api/health'){ res.writeHead(200,{'content-type':'application/json'}); return res.end('{"ok":true}'); }
  if(u.pathname==='/api/regen' && req.method==='POST'){
    let body=''; req.on('data',c=>body+=c); req.on('end', async ()=>{
      let id; try{ id=JSON.parse(body).id; }catch(_){}
      console.log('[regen] request:', id);
      const r = await regen(id);
      console.log('[regen] result:', r.ok? 'OK '+r.file : 'FAIL '+r.error);
      res.writeHead(r.ok?200:500,{'content-type':'application/json'}); res.end(JSON.stringify(r));
    });
    return;
  }
  // static
  let p = decodeURIComponent(u.pathname); if(p==='/') p='/index.html';
  const file = path.join(ROOT, p);
  if(!file.startsWith(ROOT)){ res.writeHead(403); return res.end('forbidden'); }
  fs.readFile(file,(e,data)=>{
    if(e){ res.writeHead(404); return res.end('not found'); }
    res.writeHead(200,{'content-type':MIME[path.extname(file)]||'application/octet-stream','cache-control':'no-cache'});
    res.end(data);
  });
});

server.listen(PORT,'127.0.0.1',()=>{
  console.log(`\n  MYBC Regen server running →  http://localhost:${PORT}`);
  console.log(`  Open that URL, then click "↻ Regen" on any post. (Ctrl+C to stop)\n`);
});
