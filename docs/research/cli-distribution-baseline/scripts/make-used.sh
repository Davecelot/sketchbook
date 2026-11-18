#!/bin/bash
# usage: make-used.sh <dir> — a small existing product repo, committed, so git status shows what the CLI touches.
D=$1; rm -rf "$D"; mkdir -p "$D/src/styles" "$D/.claude/commands" "$D/docs"; cd "$D" || exit 1
cat > package.json <<'EOF'
{ "name": "acme-app", "version": "1.4.0", "private": true, "type": "module",
  "scripts": { "dev": "vite", "test": "vitest" },
  "dependencies": { "react": "^18.3.1" } }
EOF
cat > src/index.ts <<'EOF'
export { App } from './app';
EOF
echo "export const App = () => null;" > src/app.ts
cat > src/styles/app.css <<'EOF'
:root { --brand: #1d4ed8; --brand-dark: #1e40af; --ink: #111827; --muted: #6b7280; --paper: #ffffff; }
body { font-family: Inter, sans-serif; font-size: 16px; color: #111827; background: #ffffff; }
.card { padding: 16px; margin: 8px 0; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,.12); }
.btn { padding: 8px 16px; border-radius: 6px; background: #1d4ed8; color: #fff; font-size: 14px; }
.btn:hover { background: #1e40af; }
.title { font-size: 24px; margin-bottom: 24px; }
.small { font-size: 12px; color: #6b7280; padding: 4px; }
.danger { color: #dc2626; border: 1px solid #dc2626; border-radius: 4px; }
EOF
cat > .claude/settings.json <<'EOF'
{ "hooks": { "PreToolUse": [ { "matcher": "Bash", "hooks": [ { "type": "command", "command": "echo team-own-hook" } ] } ] } }
EOF
printf -- '---\ndescription: Deploy the app (team command)\n---\nRun the deploy.\n' > .claude/commands/deploy.md
printf '# Acme app\n\nTeam instructions: use pnpm, never push to main.\n' > CLAUDE.md
printf '# Architecture\n\nOur own docs.\n' > docs/architecture.md
echo '{ "compilerOptions": { "strict": true, "jsx": "react-jsx" } }' > tsconfig.json
printf 'node_modules\n' > .gitignore
git init -q && git add -A && git -c user.name=t -c user.email=t@example.com commit -qm "acme app" && echo "used project ready: $(git ls-files | wc -l | tr -d ' ') files committed"
