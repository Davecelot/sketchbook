#!/bin/bash
# usage: st.sh <dir> — what changed in the project since its commit (tracked files modified/deleted, plus untracked count by top folder).
cd "$1" || exit 1
echo "tracked files changed:"; git status --porcelain --untracked-files=no | sed 's/^/  /'
echo "untracked (new) files by top-level path:"; git status --porcelain --untracked-files=all | grep '^??' | awk '{print $2}' | awk -F/ '{print $1 (NF>1 ? "/" $2 : "")}' | sort | uniq -c | sed 's/^/  /'
