#!/bin/bash
# Retest 2, cases B (an existing app adopts the design system) and C (a clone). Needs case A's tarball in sbx3.
S=$SANDBOX
T=$S/scripts/t.sh
REPO=$1
export LOGS=$REPO/docs/research/cli-distribution-retest-2/logs
X=$S/sbx3
TGZ=$X/sketchbook-0.1.0.tgz
SBX="npm exec --yes --package=$TGZ -- sketchbook"
SB="npm run -s sketchbook --"
B=$X/b-used
$S/scripts/make-used.sh "$B"
TAILN=4 $T B01-init-at-root "$B" "$SBX init --json | node -e 'let s=\"\";process.stdin.on(\"data\",d=>s+=d).on(\"end\",()=>{const j=JSON.parse(s);console.log(j.ok, j.errors[0].msg);console.log(\"fix:\", j.errors[0].fix)})'"
TAILN=4 $T B02-root-untouched "$B" "$S/scripts/st.sh $B"
TAILN=24 $T B03-adopt "$B" "$SBX init --adopt --start from-codebase --from 'src/styles/*.css' --engine file:$TGZ 2>&1 | grep -vE '^(npm warn|added|  [0-9]+ packages|Downloading|\\|)|^  (Skills|Slash|Rules|Hooks|Checks|CLI|Project|Outside)' | tail -24"
TAILN=14 $T B04-app-changes "$B" "$S/scripts/st.sh $B | head -6; git -C $B --no-pager diff -- package.json"
D=$B/design-system
TAILN=3 $T B05-check "$D" "$SB check --json | node $S/scripts/errs.mjs"
TAILN=12 $T B06-doctor "$D" "$SB doctor"
TAILN=3 $T B07-app-script "$B" "npm run -s design-system:check 2>&1 | tail -2"
TAILN=3 $T B08-app-hooks-untouched "$B" "$S/scripts/hk.sh $B"
TAILN=9 $T B09-tokens-import-no-from "$D" "$SB tokens import ../src/styles/app.css | tail -8"
TAILN=3 $T B10-audit-css-body-size "$D" "$SB audit-css ../src/styles/app.css | tail -2"
C=$X/c-clone
TAILN=3 $T C01-clone "$X" "$S/scripts/cl.sh $REPO $C"
TAILN=3 $T C02-init-blank "$C" "node harness/cli.mjs init --start blank --yes --detach-catalog --json | node $S/scripts/errs.mjs"
TAILN=3 $T C03-check "$C" "node harness/cli.mjs check --json | node $S/scripts/errs.mjs"
TAILN=3 $T C04-add-button "$C" "node harness/cli.mjs add button | tail -2"
TAILN=3 $T C05-repair-in-clone "$C" "node harness/cli.mjs init | head -2"
echo CASE-BC-DONE
