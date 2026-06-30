#!/usr/bin/env bash
# Show the exact Magnific generation for one (or all) Week-1 post(s).
# Usage:
#   ./regen/show.sh                 # list all post ids
#   ./regen/show.sh deposit2        # show one post's model, refs (resolved) + prompt
DIR="$(cd "$(dirname "$0")" && pwd)"
JSON="$DIR/posts.json"
ID="$1"

python3 - "$JSON" "$ID" <<'PY'
import json,sys
data=json.load(open(sys.argv[1]))
pid=sys.argv[2] if len(sys.argv)>2 else ""
refs=data["refs"]; posts=data["posts"]
if not pid:
    print("Week 1 posts (id — day / slot — offer):\n")
    for p in posts:
        print(f"  {p['id']:<14} {p['day']:<12} {p['slot']:<5} {p['offer']}")
    print("\nRun:  ./regen/show.sh <id>")
    sys.exit(0)
p=next((x for x in posts if x['id']==pid),None)
if not p:
    print(f"No post id '{pid}'. Run with no args to list ids."); sys.exit(1)
print(f"id:        {p['id']}")
print(f"schedule:  {p['day']} · {p['slot']} · {p['offer']}")
print(f"file:      {p['file']}")
print(f"model:     {data['model']}   aspect: {data['aspectRatio']}   resolution: {data['resolution']}")
print( "refs:      " + ", ".join(f"{r}={refs[r]}" for r in p['refs']))
print( "\nprompt:\n")
print(p['prompt'])
PY
