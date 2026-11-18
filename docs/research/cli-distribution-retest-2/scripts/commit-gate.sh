#!/bin/bash
# usage: commit-gate.sh <project> — first commit (checks pass, allowed), then a broken contract (checks fail, blocked).
cd "$1" || exit 1
G="git -c user.name=t -c user.email=t@example.com"
echo "core.hooksPath=$(git config core.hooksPath)"
git add -A >/dev/null && $G commit -qm "initial" && echo "initial commit: allowed ($(git rev-parse --short HEAD))" || echo "initial commit: BLOCKED"
cp spec/components/badge/contract.json /tmp/sketchbook-badge.$$
printf '{ "name": "Badge", "status": "beta" }\n' > spec/components/badge/contract.json
git add -A >/dev/null
if $G commit -qm "broken contract" >/tmp/sketchbook-commit.$$ 2>&1; then echo "broken commit: ALLOWED (gate not working)"; else echo "broken commit: blocked"; grep -m3 -E "FAIL|Commit blocked" /tmp/sketchbook-commit.$$; fi
cp /tmp/sketchbook-badge.$$ spec/components/badge/contract.json && git add -A >/dev/null && git status --short | head -3
rm -f /tmp/sketchbook-badge.$$ /tmp/sketchbook-commit.$$
