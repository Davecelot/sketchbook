#!/bin/bash
# usage: setup-arms.sh <engine.tgz> <dest-root> <prefix> [start=blank]  -> <dest-root>/<prefix>-a0, -a2, -a3 (a1 reuses a3)
set -e
TGZ=$1; D=$2; P=$3
rm -rf "$D/$P-a0" "$D/$P-a2" "$D/$P-a3"; mkdir -p "$D/$P-a0" "$D/$P-a3"
echo '{"private":true,"type":"module"}' > "$D/$P-a0/package.json"
(cd "$D/$P-a3" && npm exec --yes --package="$TGZ" -- sketchbook init --engine "file:$TGZ" --start "${4:-blank}" >/dev/null 2>&1)
cp -Rc "$D/$P-a3" "$D/$P-a2"
rm -rf "$D/$P-a2/move-to-.claude" "$D/$P-a2/CLAUDE.md"
cd "$D/$P-a3"
mkdir -p .claude
cp -R move-to-.claude/skills move-to-.claude/commands move-to-.claude/rules move-to-.claude/hooks .claude/
cp move-to-.claude/settings.json .claude/settings.json
rm -rf move-to-.claude
echo "ready: $P-a0 $P-a2 $P-a3"
