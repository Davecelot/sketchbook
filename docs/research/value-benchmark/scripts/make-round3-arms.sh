#!/bin/bash
# usage: make-round3-arms.sh <root>   needs <root>/tpl/{author,ui}-{a2,a3}
#   f = project files only (no CLI, no Claude layer, no CLAUDE.md)   = a2 with the CLI removed
#   h = files + harness (no CLI)                                      = a3 with the CLI removed
#   qa-a2 = files + CLI for the QA task (copy of ui-a2 plus the seeded page)
set -e
R=$1; T=$R/tpl
V=$(cd "$(dirname "$0")/.." && pwd)
copy() {
  if [ -e "$2" ]; then echo "Template already exists: $2" >&2; exit 1; fi
  if [ "$(uname -s)" = Darwin ]; then cp -Rc "$1" "$2"; else cp -a "$1" "$2"; fi
}
strip_cli() {
  rm -f "$1/node_modules/.bin/sketchbook"
  for engine in "$1/node_modules/@usesketchbook/cli" "$1/node_modules/sketchbook"; do
    rm -rf "$engine/harness/cli.mjs" "$engine/harness/cli"
  done
  if (cd "$1" && npm_config_offline=true npm run -s sketchbook -- help >/dev/null 2>&1); then echo "CLI still runs in $1" >&2; exit 1; fi
}
for arm in a2 a3; do
  copy "$T/ui-$arm" "$T/qa-$arm"
  mkdir -p "$T/qa-$arm/out"
  if [ -d "$T/qa-$arm/node_modules/@usesketchbook/cli" ]; then
    sed 's|node_modules/sketchbook/|node_modules/@usesketchbook/cli/|g' "$V/qa/settings.html" > "$T/qa-$arm/out/settings.html"
  else
    cp "$V/qa/settings.html" "$T/qa-$arm/out/"
  fi
done
for task in author ui qa; do
  copy "$T/$task-a2" "$T/$task-f"; strip_cli "$T/$task-f"
  copy "$T/$task-a3" "$T/$task-h"; strip_cli "$T/$task-h"
  echo "ready: $task-f $task-h"
done
