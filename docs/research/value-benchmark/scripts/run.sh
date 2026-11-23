#!/bin/bash
# usage: run.sh <task: author|ui|qa|probe> <arm: a0|a1|a2|a3|f|h|n> <model> <rep>
# env: BENCH (work root with tpl/), REPO (this checkout), PROMPT (probe only), BENCH_BUDGET_USD (default 1)
set -eu
TASK=$1; ARM=$2; MODEL=$3; REP=$4
: "${BENCH:?}"; : "${REPO:?}"
BENCH=$(cd "$BENCH" && pwd)
V=$REPO/docs/research/value-benchmark
case "$TASK" in author|ui|qa|probe) ;; *) exit 2;; esac
case "$ARM" in a0|a1|a2|a3|f|h|n) ;; *) exit 2;; esac
[[ "$MODEL" =~ ^[A-Za-z0-9_.-]+$ && "$REP" =~ ^[0-9]+$ ]] || exit 2
TEMPLATE_TASK=$TASK; TEMPLATE_ARM=$ARM
if [ "$TASK" = probe ]; then TEMPLATE_TASK=ui; fi
if [ "$ARM" = a1 ] || [ "$ARM" = n ]; then TEMPLATE_ARM=a3; fi
TPL=$BENCH/tpl/$TEMPLATE_TASK-$TEMPLATE_ARM
RUN=$BENCH/runs/$TASK-$ARM-$MODEL-r$REP
mkdir -p "$BENCH/runs"
mkdir "$RUN" # refuse an existing trial; never erase its output
if [ "$(uname -s)" = Darwin ]; then cp -Rc "$TPL/." "$RUN/"; else cp -a "$TPL/." "$RUN/"; fi
if [ "$TASK" = probe ]; then P="${PROMPT:-Reply with the single word OK.}"; else P=$(cat "$V/prompts/$TASK.md"); fi
if [ "$TASK" = ui ]; then
  for engine in "$RUN/node_modules/@usesketchbook/cli" "$RUN/node_modules/sketchbook"; do
    if [ -f "$engine/dist/sketchbook.js" ] && [ -f "$RUN/generated/css/tokens.css" ]; then
      mkdir -p "$RUN/out"
      cp "$engine/dist/sketchbook.js" "$RUN/out/sketchbook.js"
      cp "$RUN/generated/css/tokens.css" "$RUN/out/tokens.css"
      P="$P

For installed Sketchbook projects, the benchmark has already put the local browser bundle and tokens alongside the requested page: reference ./sketchbook.js with a classic script and ./tokens.css with a stylesheet link in settings.html. Use these local assets rather than building or fetching a bundle. The benchmark will open the completed page in Chromium."
      break
    fi
  done
fi
if [ "$ARM" = n ]; then P="$(cat "$V/prompts/a2-note.md")

$P"; fi
DENY=()
if [ "$ARM" = a1 ]; then
  DENY=(--disallowedTools 'Bash(npm run sketchbook:*)' 'Bash(npm run -s sketchbook:*)' 'Bash(npx sketchbook:*)' 'Bash(npx --no-install sketchbook:*)' 'Bash(npm exec:*)' 'Bash(npm run check:*)' 'Bash(node node_modules/sketchbook:*)' 'Bash(node node_modules/@usesketchbook/cli:*)' 'Bash(node_modules/.bin/sketchbook:*)' 'Bash(./node_modules/.bin/sketchbook:*)')
fi
cd "$RUN" || exit 1
START=$(date +%s)
rc=0
npm_config_offline=true npm_config_cache="$BENCH/run-cache" timeout "${BENCH_TIMEOUT_SECONDS:-300}" claude -p "$P" --model "$MODEL" --effort medium --output-format stream-json --verbose \
  --setting-sources project --strict-mcp-config --no-session-persistence --permission-mode acceptEdits --max-budget-usd "${BENCH_BUDGET_USD:-1}" \
  --tools Read Write Edit Glob Grep Bash Skill \
  --allowedTools 'Bash(npm run:*)' 'Bash(npx sketchbook:*)' 'Bash(npx --no-install sketchbook:*)' 'Bash(node_modules/.bin/sketchbook:*)' 'Bash(./node_modules/.bin/sketchbook:*)' 'Bash(node node_modules/.bin/sketchbook:*)' 'Bash(ls:*)' 'Bash(cat:*)' 'Bash(grep:*)' 'Bash(rg:*)' 'Bash(find:*)' 'Bash(mkdir:*)' 'Bash(cp:*)' 'Bash(head:*)' 'Bash(tail:*)' 'Bash(wc:*)' 'Bash(diff:*)' 'Bash(sed -n:*)' 'Bash(echo:*)' 'Bash(test:*)' 'Bash(git status:*)' 'Bash(git diff:*)' 'Bash(pwd)' \
  ${DENY[@]+"${DENY[@]}"} > "$RUN.jsonl" 2> "$RUN.err" || rc=$?
echo "exit $rc wall $(( $(date +%s) - START ))s" > "$RUN.meta"
cat "$RUN.meta"
exit "$rc"
