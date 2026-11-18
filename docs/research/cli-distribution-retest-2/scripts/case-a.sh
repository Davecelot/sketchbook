#!/bin/bash
# Retest 2, case A: an empty folder, the CLI from the packed tarball, the real install, Claude installs the staged layer.
S=$SANDBOX
T=$S/scripts/t.sh
REPO=$1
export LOGS=$REPO/docs/research/cli-distribution-retest-2/logs
X=$S/sbx3
rm -rf "$X"; mkdir -p "$X"
TAILN=3 $T 00-pack "$REPO" "npm pack --ignore-scripts --pack-destination $X 2>&1 | grep -E 'total files|package size'"
TGZ=$X/sketchbook-0.1.0.tgz
SBX="npm exec --yes --package=$TGZ -- sketchbook"
SB="npm run -s sketchbook --"
SUM="node -e 'let s=\"\";process.stdin.on(\"data\",d=>s+=d).on(\"end\",()=>{const j=JSON.parse(s);console.log(\"ok\",j.ok,\"errors\",j.errors.length,\"warnings\",j.warnings.length,\"changed\",j.changed.length);for(const w of j.warnings)console.log(\" warning:\",w.msg||w);if(j.next)console.log(\" next:\",j.next)})'"
A=$X/a-empty; mkdir -p "$A"
TAILN=4 $T A01-status-outside "$A" "$SBX status"
TAILN=6 $T A02-init-dry-run "$A" "$SBX init --engine file:$TGZ --dry-run --json | $SUM; echo \"entries in folder: \$(ls -A | wc -l | tr -d ' ')\""
TAILN=40 $T A03-init "$A" "$SBX init --engine file:$TGZ 2>&1 | grep -vE '^(npm warn|added|  [0-9]+ packages|Downloading|\\|)' | tail -40"
TAILN=8 $T A04-layout "$A" "ls -A | tr '\n' ' '; echo; for d in harness scripts .claude; do test -e \$d && echo \"\$d PRESENT\" || echo \"no \$d/\"; done; readlink node_modules/.bin/sketchbook; ls -l .githooks/pre-commit | cut -c1-10; node -e 'const p=require(\"./package.json\");console.log(\"devDependency:\",JSON.stringify(p.devDependencies.sketchbook),\"imports:\",JSON.stringify(p.imports),\"check script:\",p.scripts.check)'"
TAILN=7 $T A05-status "$A" "$SB status"
TAILN=12 $T A06-doctor "$A" "$SB doctor"
TAILN=6 $T A07-check "$A" "$SB check --json | node $S/scripts/errs.mjs; $SB check | grep -A2 '^pass  H1'"
TAILN=3 $T A08-remove-badge "$A" "$SB remove badge | tail -2"
TAILN=3 $T A09-add-badge "$A" "$SB add badge | tail -2"
TAILN=3 $T A10-kits-add "$A" "$SB kits add sign-in | tail -2"
TAILN=3 $T A11-tokens-preset "$A" "$SB tokens preset spacing grid-8 --dry-run | tail -2"
TAILN=4 $T A12-explain "$A" "$SB explain color.primary | head -4"
TAILN=3 $T A13-generate "$A" "$SB generate | tail -1"
# Run 1 (logs-run1/A14): a headless Claude Code read INSTALL.md, stopped before writing into the protected .claude/
# (no one to approve), and listed these exact commands. Here they run as the person's approved step (simulated, not Claude).
TAILN=12 $T A14-approved-install-commands "$A" "echo 'Simulated approved step: the commands Claude listed in run 1 (logs-run1/A14).'; mkdir -p .claude && cp -R move-to-.claude/skills move-to-.claude/commands move-to-.claude/rules move-to-.claude/hooks move-to-.claude/settings.json .claude/ && $SB check --only H1 | tail -2 && $SB doctor | grep 'Claude layer' && rm -rf move-to-.claude && echo 'move-to-.claude removed'"
TAILN=12 $T A15-after-install "$A" "ls .claude | tr '\n' ' '; echo; test -e move-to-.claude && echo 'move-to-.claude still here' || echo 'move-to-.claude removed'; node -e 'const s=require(\"./.claude/settings.json\");console.log(\"hook events:\",Object.keys(s.hooks).join(\", \"))'; $SB check --only H1 | tail -2; $SB doctor | grep -E 'Claude layer|Commit gate'"
TAILN=8 $T A16-commit-gate "$A" "bash $S/scripts/commit-gate.sh $A"
TAILN=3 $T A17-typecheck "$A" "npm run typecheck 2>&1 | tail -2"
TAILN=3 $T A18-test-component "$A" "SKETCHBOOK_PORT=6191 npm run test:component -- tests/button tests/foundations 2>&1 | grep -E 'passed|failed|flaky|Error' | tail -3"
TAILN=6 $T A19-test-harness-selftest "$A" "npm run test:harness 2>&1 | grep -E '^ℹ (tests|pass|fail|skipped)|^✖' | head -8"
TAILN=12 $T A20-repair "$A" "rm .githooks/pre-commit .claude/rules/test-first.md playwright/helpers/a11y.ts; $SB init | head -8; for f in .githooks/pre-commit .claude/rules/test-first.md playwright/helpers/a11y.ts; do test -f \$f && echo \"back: \$f\"; done"
TAILN=6 $T A21-upgrade "$A" "$SB upgrade --dry-run"
F=$X/a-fail; mkdir -p "$F"
TAILN=5 $T A22-atomic-failure "$F" "$SBX init --engine file:$TGZ --start pick --components not-a-thing --no-install 2>&1 | tail -2; echo \"entries in folder: \$(ls -A | wc -l | tr -d ' ')\"; echo \"stages left beside it: \$(ls -A .. | grep -c '^.sketchbook-init-')\""
echo CASE-A-DONE
