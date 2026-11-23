#!/bin/bash
# usage: setup-arms.sh <engine.tgz> <dest-root> <prefix> [start=blank]  -> <dest-root>/<prefix>-a0, -a2, -a3 (a1 reuses a3)
set -e
TGZ="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"; D=$2; P=$3
for arm in a0 a2 a3; do
  if [ -e "$D/$P-$arm" ]; then echo "Template already exists: $D/$P-$arm" >&2; exit 1; fi
done
mkdir -p "$D/$P-a0" "$D/$P-a2"
echo '{"private":true,"type":"module"}' > "$D/$P-a0/package.json"
(cd "$D/$P-a2" && npm exec --yes --package="$TGZ" -- sketchbook init --engine "file:$TGZ" --start "${4:-blank}" --yes)
if [ "$(uname -s)" = Darwin ]; then cp -Rc "$D/$P-a2" "$D/$P-a3"; else cp -a "$D/$P-a2" "$D/$P-a3"; fi
cd "$D/$P-a3"
./node_modules/.bin/sketchbook init --agent claude
mkdir -p .claude
cp -R move-to-.claude/skills move-to-.claude/commands move-to-.claude/rules move-to-.claude/hooks .claude/
cp move-to-.claude/settings.json .claude/settings.json
rm -rf move-to-.claude
echo "ready: $P-a0 $P-a2 $P-a3"
