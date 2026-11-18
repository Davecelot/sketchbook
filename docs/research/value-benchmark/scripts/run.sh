#!/bin/bash
# usage: run.sh <task: author|ui|probe> <arm: a0|a1|a2|a3> <model> <rep>
# env: BENCH (work root with tpl/), REPO (this checkout), PROMPT (probe only)
set -u
TASK=$1; ARM=$2; MODEL=$3; REP=$4
: "${BENCH:?}"; : "${REPO:?}"
V=$REPO/docs/research/value-benchmark
TPL=$BENCH/tpl/$([ "$TASK" = probe ] && echo ui || echo "$TASK")-$([ "$ARM" = a1 ] || [ "$ARM" = n ] && echo a3 || echo "$ARM")
RUN=$BENCH/runs/$TASK-$ARM-$MODEL-r$REP
rm -rf "$RUN"; mkdir -p "$BENCH/runs"; cp -Rc "$TPL" "$RUN"
if [ "$TASK" = probe ]; then P="${PROMPT:-Reply with the single word OK.}"; else P=$(cat "$V/prompts/$TASK.md"); fi
{ [ "$ARM" = a2 ] || [ "$ARM" = n ]; } && P="$(cat "$V/prompts/a2-note.md")

$P"
DENY=()
if [ "$ARM" = a1 ]; then
  DENY=(--disallowedTools 'Bash(npm run sketchbook:*)' 'Bash(npx sketchbook:*)' 'Bash(npm exec:*)' 'Bash(npm run check:*)' 'Bash(node node_modules/sketchbook:*)' 'Bash(node_modules/.bin/sketchbook:*)' 'Bash(./node_modules/.bin/sketchbook:*)')
fi
cd "$RUN" || exit 1
START=$(date +%s)
timeout 1500 claude -p "$P" --model "$MODEL" --effort medium --output-format stream-json --verbose \
  --setting-sources project,local --strict-mcp-config --no-session-persistence --permission-mode acceptEdits --max-budget-usd 6 \
  --allowedTools 'Bash(npm:*)' 'Bash(npx:*)' 'Bash(node:*)' 'Bash(ls:*)' 'Bash(cat:*)' 'Bash(grep:*)' 'Bash(rg:*)' 'Bash(find:*)' 'Bash(mkdir:*)' 'Bash(cp:*)' 'Bash(mv:*)' 'Bash(head:*)' 'Bash(tail:*)' 'Bash(wc:*)' 'Bash(diff:*)' 'Bash(sed:*)' 'Bash(echo:*)' 'Bash(test:*)' 'Bash(git:*)' 'Bash(pwd)' \
  ${DENY[@]+"${DENY[@]}"} > "$RUN.jsonl" 2> "$RUN.err"
echo "exit $? wall $(( $(date +%s) - START ))s" > "$RUN.meta"
cat "$RUN.meta"
