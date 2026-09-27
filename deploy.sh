#!/bin/zsh
# Copy the three app folders from the pilot build location into this repo, commit, push (GitHub Pages serves main /).
set -e
SRC="/Users/royazoulay/Desktop/isf 2026/Pilot_2026-09-25"
cd "$(dirname "$0")"
for t in scenarios cyberstatus cyberball; do
  if [ -f "$SRC/$t/index.html" ]; then
    rsync -a --delete --exclude '.git' --exclude 'node_modules' --exclude '*.md' --exclude '*.py' --exclude 'data*' "$SRC/$t/" "./$t/"
    echo "synced $t"
  else
    echo "skip $t (no index.html yet)"
  fi
done
git add -A
git commit -m "${1:-deploy $(date +%Y-%m-%d_%H:%M)}" || true
git push -u origin main
