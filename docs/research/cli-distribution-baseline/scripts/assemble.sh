#!/bin/bash
# usage: assemble.sh <project> <source-repo>
# The hand-copied skeleton case A proved necessary on top of `upgrade` before `init` can run (no CLI command provides it).
P=$1; SRC=$2; cd "$P" || exit 1
copy() { for f in "$@"; do mkdir -p "$(dirname "$f")"; cp -R "$SRC/$f" "$f"; echo "copied: $f"; done; }
copy harness.config.json brand.config.json spec/registry.json spec/tokens/contrast.json spec/schemas spec/decisions/DECISIONS.md \
     src/styles src/mixins src/controllers src/stories
mkdir -p spec/tokens/semantic && cp "$SRC"/harness/templates/semantic/*.json spec/tokens/semantic/ && cp "$SRC/harness/templates/brand-links.json" spec/tokens/ && echo "copied: semantic + brand-links templates"
[ -e node_modules ] || ln -s $REPO_NODE_MODULES node_modules
node harness/generators/foundation.mjs
