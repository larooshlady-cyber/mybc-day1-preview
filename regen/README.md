# MYBC Week 1 — Regenerate a post's image (local, Claude CLI + Magnific MCP)

Every post's image can be re-rolled locally. No website button, no API key — it runs
through **Claude CLI** with the **Magnific MCP** connected (the same setup used to build these).

## The manifest
`posts.json` stores, for each of the 18 posts:
- `id`, `day`, `slot`, `offer`
- `file` — the image it writes (e.g. `img/deposit2.png`)
- `refs` — which uploaded references to attach (logo, ui, and the 6 Originals thumbnails)
- `prompt` — the exact prompt used

The `refs` block at the top maps names → Magnific creation identifiers (already uploaded):
logo, ui, dice_duel, mines, limbo, tower_legend, hilo, rock_paper_scissors.

## See what a post will generate
```bash
./regen/show.sh                # list every post id
./regen/show.sh deposit2       # print that post's model, refs and prompt
```

## Regenerate (in Claude CLI, this folder)
Open Claude in `~/Desktop/MYBC_Day1` and just say, e.g.:

> regenerate **deposit2**

Claude will:
1. read `regen/posts.json`, find the post,
2. call Magnific `images_generate` with the stored `model`, `aspectRatio`, `resolution`,
   `prompt`, and the resolved `refs`,
3. download the result and **overwrite** the post's `file` (e.g. `img/deposit2.png`),
4. (optional) `git add/commit/push` so the live page updates in ~1 min.

Variations you can ask for:
- "regenerate **drop** — make the FR badge bigger"  (tweak the prompt for one run)
- "regenerate **deposit2** x3 and let me pick"        (count = 3)
- "regenerate all **deposit** variants"               (deposit, deposit2, deposit3, deposit4)

## Notes
- If the Magnific references ever expire/change, re-upload and update the `refs` ids at the
  top of `posts.json` (logo + ui + the 6 AceQueen Originals thumbnails).
- Originals-heavy posts (drop, drop2, variety, variety2, trust) reference the real AceQueen
  game thumbnails so Mines = FIFA ball, Limbo = 500x/1000x, etc.
