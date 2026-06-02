#!/bin/bash

git add -A

# si rien à commit → stop
git diff --cached --quiet && echo "Rien à commit" && exit 0

DATE=$(date '+%Y-%m-%d')
HEURE=$(date '+%H:%M:%S')

git commit -m "Commit '$DATE' - '$HEURE'"
git push
