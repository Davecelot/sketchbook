#!/bin/bash
# Retest 2, the Claude step: a fresh project from the tarball, a team-owned .claude/ already there, then a real headless
# Claude Code session asked to install the staged layer, with the approvals granted as narrow permission rules.
S=$SANDBOX
T=$S/scripts/t.sh
REPO=$1
export LOGS=$REPO/docs/research/cli-distribution-retest-2/logs-claude
X=$S/sbx3
TGZ=$X/sketchbook-0.1.0.tgz
SB="npm run -s sketchbook --"
P=$X/a-claude
rm -rf "$P"; mkdir -p "$P"
TAILN=6 $T K01-init "$P" "npm exec --yes --package=$TGZ -- sketchbook init --engine file:$TGZ --start blank 2>&1 | grep -E 'One step left|Open Claude Code|approve|Sketchbook installed' "
# The team already had a Claude setup: one hook of their own, one command of their own, and a permission.
TAILN=4 $T K02-team-claude-setup "$P" "mkdir -p .claude/commands && printf '%s\n' '{' '  \"permissions\": { \"allow\": [\"Bash(npm run lint)\"] },' '  \"hooks\": { \"PreToolUse\": [ { \"matcher\": \"Bash\", \"hooks\": [ { \"type\": \"command\", \"command\": \"echo team-hook\" } ] } ] }' '}' > .claude/settings.json && printf -- '---\ndescription: Deploy the app (team command)\n---\nRun the deploy.\n' > .claude/commands/deploy.md && find .claude -type f | sort"
TAILN=60 $T K03-claude-installs "$P" "claude -p 'Install the Claude layer from move-to-.claude/ (follow move-to-.claude/INSTALL.md).' --allowedTools 'Read' 'Glob' 'Grep' 'Write(.claude/**)' 'Edit(.claude/**)' 'Bash(mkdir -p .claude:*)' 'Bash(cp:*)' 'Bash(ls:*)' 'Bash(diff:*)' 'Bash(find:*)' 'Bash(npm run sketchbook:*)' 'Bash(rm -rf move-to-.claude)' 2>&1 | tail -60"
TAILN=30 $T K04-after "$P" "echo 'files in .claude:'; find .claude -type f | sed 's#/[^/]*\$##' | sort | uniq -c; test -e move-to-.claude && echo 'move-to-.claude still here' || echo 'move-to-.claude removed'; node -e 'const s=require(\"./.claude/settings.json\");console.log(\"team permission kept:\",JSON.stringify(s.permissions));for(const [e,g] of Object.entries(s.hooks))console.log(e+\":\",g.flatMap(x=>x.hooks.map(h=>h.command.replace(/.*\\//,\"\"))).join(\", \"))'; test -f .claude/commands/deploy.md && echo 'team command kept: deploy.md'; $SB check --only H1 | tail -2; $SB doctor | grep -E 'Claude layer|Commit gate'"
echo CASE-CLAUDE-DONE
