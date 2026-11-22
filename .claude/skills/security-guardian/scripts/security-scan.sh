#!/bin/bash
# Advisory only: always exits 0. Not wired into any git hook.
# Usage: bash .agents/skills/security-guardian/scripts/security-scan.sh [--branch]
#   (no flag)  -> scope = staged files (pre-commit style)
#   --branch   -> scope = current branch vs. the default branch (pre-push/PR style)

set -uo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
cd "$REPO_ROOT" || exit 0

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

MODE="staged"
if [ "${1:-}" = "--branch" ]; then
  MODE="branch"
fi

OUT_DIR="$(mktemp -d "${TMPDIR:-/tmp}/security-guardian.XXXXXX")"

echo ""
echo -e "${BLUE}+------------------------------------------------+${NC}"
echo -e "${BLUE}|  Security Guardian -- Advisory Scan             |${NC}"
echo -e "${BLUE}+------------------------------------------------+${NC}"
echo ""

if [ "$MODE" = "branch" ]; then
  BASE="$(git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null | sed 's@^origin/@@')"
  BASE="${BASE:-main}"
  CHANGED_FILES=$(git diff --name-only --diff-filter=AM "$BASE"...HEAD 2>/dev/null || echo "")
  DIFF_CMD=(git diff -U0 "$BASE"...HEAD)
  echo "Mode: branch (vs. $BASE)"
else
  CHANGED_FILES=$(git diff --cached --name-only --diff-filter=ACMR 2>/dev/null || echo "")
  DIFF_CMD=(git diff --cached -U0)
  echo "Mode: staged"
fi

echo "Files in scope: $(echo "$CHANGED_FILES" | grep -c "." || true)"
echo "Tool output: $OUT_DIR"
echo ""

FLAGGED=0

# --- Gate 1: Secret scan ---
echo "Gate 1: Secret scan"
if command -v gitleaks >/dev/null 2>&1; then
  if gitleaks detect --no-banner --source . --redact --exit-code 1 >"$OUT_DIR/gitleaks.txt" 2>&1; then
    echo -e "  ${GREEN}gitleaks: no findings${NC}"
  else
    echo -e "  ${RED}gitleaks: findings detected -- see $OUT_DIR/gitleaks.txt${NC}"
    FLAGGED=1
  fi
else
  echo -e "  ${YELLOW}gitleaks not installed -- falling back to grep pattern scan${NC}"
fi

# Print only the matched key name, never the value.
PATTERN_HITS=$("${DIFF_CMD[@]}" 2>/dev/null | grep -nEio '(api[_-]?key|secret|token|password|private[_-]?key|BEGIN (RSA|EC|OPENSSH) PRIVATE KEY)\s*[:=]\s*["'"'"']?[A-Za-z0-9/+_=-]{12,}' | sed -E 's/^([0-9]+:[^:=]*)[[:space:]]*[:=].*$/\1 = <redacted>/' || true)
if [ -n "$PATTERN_HITS" ]; then
  echo -e "  ${RED}grep fallback: possible secret-shaped strings in diff (diff line : key)${NC}"
  echo "$PATTERN_HITS" | sed 's/^/    /'
  FLAGGED=1
else
  echo -e "  ${GREEN}grep fallback: no secret-shaped strings in diff${NC}"
fi
echo ""

# --- Gate 2: JS dependency audit ---
JS_DEPS_CHANGED=$(echo "$CHANGED_FILES" | grep -E "(^|/)(package\.json|package-lock\.json)$" || true)
echo "Gate 2: JS dependency audit"
if [ -n "$JS_DEPS_CHANGED" ]; then
  if command -v npm >/dev/null 2>&1; then
    if npm audit --audit-level=high >"$OUT_DIR/npm-audit.txt" 2>&1; then
      echo -e "  ${GREEN}npm audit: no high/critical advisories${NC}"
    else
      echo -e "  ${RED}npm audit: high/critical advisories found -- see $OUT_DIR/npm-audit.txt${NC}"
      FLAGGED=1
    fi
  else
    echo -e "  ${YELLOW}npm not on PATH -- skipped${NC}"
  fi
else
  echo -e "  ${GREEN}no package.json/package-lock.json changes -- skipped${NC}"
fi
echo ""

# --- Gate 3: Lockfile integrity ---
echo "Gate 3: Lockfile integrity"
if [ -n "$JS_DEPS_CHANGED" ] && command -v npm >/dev/null 2>&1; then
  if npm ci --dry-run >"$OUT_DIR/npm-ci.txt" 2>&1; then
    echo -e "  ${GREEN}package-lock.json is in sync with package.json${NC}"
  else
    echo -e "  ${RED}package-lock.json is OUT OF SYNC -- installs would not be reproducible${NC}"
    FLAGGED=1
  fi
else
  echo -e "  ${GREEN}no relevant changes -- skipped${NC}"
fi
echo ""

# --- Gate 4: Sensitive/CI-config file review ---
SENSITIVE=$(echo "$CHANGED_FILES" | grep -E '(^|/)\.env|(^|/)\.npmrc$|\.pem$|\.key$|(^|/)\.(agents|claude|codex|gemini|opencode|cursor|windsurf|trae|kiro|aiassistant)/|(^|/)opencode\.jsonc?$|(^|/)(AGENTS|GEMINI|CLAUDE)\.md$|(^|/)\.github/(workflows/|hooks/|copilot-instructions\.md$)|^\.gitlab-ci\.yml$|(^|/)Dockerfile$|^\.githooks/' || true)
echo "Gate 4: Sensitive/CI-config files touched"
if [ -n "$SENSITIVE" ]; then
  echo -e "  ${YELLOW}Manual review recommended for:${NC}"
  echo "$SENSITIVE" | sed 's/^/    /'
else
  echo -e "  ${GREEN}none${NC}"
fi
echo ""

echo -e "${BLUE}--------------------------------------------------${NC}"
if [ "$FLAGGED" -eq 1 ]; then
  echo -e "${YELLOW}Verdict: REVIEW NEEDED -- see flagged gates above${NC}"
else
  echo -e "${GREEN}Verdict: GO -- no blocking findings${NC}"
fi
echo -e "${BLUE}This scan is advisory only. It does not block commit/push.${NC}"
echo ""

exit 0
