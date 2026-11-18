#!/bin/bash
# Case A, final: repack, then a fresh empty folder through the tarball with the real install, then every in-project gate.
S=$SANDBOX
T=$S/scripts/t.sh
REPO=$1
export LOGS=$REPO/docs/research/cli-distribution-retest/logs
rm -f $S/sbx2/sketchbook-0.1.0.tgz
TAILN=3 $T A28-repack $REPO "npm pack --ignore-scripts --pack-destination $S/sbx2 2>&1 | grep -E 'total files|package size'"
F=$S/sbx2/a-final3; rm -rf $F; mkdir -p $F
TAILN=4 $T A29-init-final $F "npm exec --yes --package=$S/sbx2/sketchbook-0.1.0.tgz -- sketchbook init --json > ../a-final3-init.json 2>/dev/null; node $S/scripts/errs.mjs < ../a-final3-init.json; node -e 'const j=require(\"../a-final3-init.json\");console.log(JSON.stringify(j.warnings))'"
TAILN=3 $T A30-check $F "npm run -s sketchbook -- check --json | node $S/scripts/errs.mjs"
TAILN=3 $T A31-typecheck $F "npm run typecheck 2>&1 | tail -2"
TAILN=3 $T A32-test-component-button $F "SKETCHBOOK_PORT=6189 npm run test:component -- tests/button 2>&1 | grep -E 'passed|failed|flaky' | tail -3"
TAILN=6 $T A33-test-harness $F "npm run test:harness 2>&1 | grep -E '^ℹ (tests|pass|fail|skipped)|^✖' | head -8"
echo FINAL-A-DONE
