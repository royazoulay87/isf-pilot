#!/bin/zsh
# Copy the three app folders from the pilot build location into this repo, commit, push (GitHub Pages serves main /).
set -e
SRC="/Users/royazoulay/Desktop/isf 2026/Pilot_2026-09-25"
cd "$(dirname "$0")"
# usage: ./deploy.sh [task ...]   (tasks: scenarios cyberstatus cyberball; default = all that have an index.html)
# source folders: scenarios -> Pilot_2026-09-25/scenarios ; cyberstatus -> Pilot_2026-09-25/cyberstatus ;
#                 cyberball  -> the folder named in cyberball/SOURCE (a fix folder with the ThrowCatch build) + our index.html
TASKS=("$@"); [ $# -eq 0 ] && TASKS=(scenarios cyberstatus cyberball)
for t in "${TASKS[@]}"; do
  if [ "$t" = "cyberball" ]; then
    src="$(cat cyberball/SOURCE 2>/dev/null)"
    if [ -n "$src" ] && [ -d "$src" ]; then
      rsync -a --exclude '*.md' --exclude '*.py' --exclude 'data*' --exclude 'test_runs' --exclude '.DS_Store' "$src/" "./cyberball/"; echo "synced cyberball from $src"
    else echo "skip cyberball (cyberball/SOURCE missing)"; fi
  elif [ -f "$SRC/$t/index.html" ]; then
    rsync -a --delete --exclude '.git' --exclude 'node_modules' --exclude '*.md' --exclude '*.py' --exclude 'data*' --exclude 'test_runs' --exclude '.claude_launch_note.txt' --exclude 'TEXTS_FOR_APPROVAL*' --exclude '.DS_Store' "$SRC/$t/" "./$t/"
    echo "synced $t"
  else
    echo "skip $t (no index.html yet)"
  fi
done
git add -A
git commit -m "${COMMIT_MSG:-deploy $(date +%Y-%m-%d_%H:%M)}" || true
git push -u origin main
