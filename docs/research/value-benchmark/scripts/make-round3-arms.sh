#!/bin/bash
# usage: make-round3-arms.sh <root>   needs <root>/tpl/{author,ui}-{a2,a3} and qa-a3 from round 2
#   f = project files only (no CLI, no Claude layer, no CLAUDE.md)   = a2 with the CLI removed
#   h = files + harness (no CLI)                                      = a3 with the CLI removed
#   qa-a2 = files + CLI for the QA task (copy of ui-a2 plus the seeded page)
set -e
R=$1; T=$R/tpl
V=$(cd "$(dirname "$0")/.." && pwd)
strip_cli() {
  rm -f "$1/node_modules/.bin/sketchbook"
  rm -rf "$1/node_modules/sketchbook/harness/cli.mjs" "$1/node_modules/sketchbook/harness/cli"
  if (cd "$1" && npm run -s sketchbook -- help >/dev/null 2>&1); then echo "CLI still runs in $1" >&2; exit 1; fi
}
rm -rf "$T/qa-a2"; cp -Rc "$T/ui-a2" "$T/qa-a2"; mkdir -p "$T/qa-a2/out"; cp "$V/qa/settings.html" "$T/qa-a2/out/"
for task in author ui qa; do
  rm -rf "$T/$task-f" "$T/$task-h"
  cp -Rc "$T/$task-a2" "$T/$task-f"; strip_cli "$T/$task-f"
  cp -Rc "$T/$task-a3" "$T/$task-h"; strip_cli "$T/$task-h"
  echo "ready: $task-f $task-h"
done
