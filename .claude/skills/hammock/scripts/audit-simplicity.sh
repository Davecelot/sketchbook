#!/bin/bash
# hammock advisory audit
# Advisory-only: always exits 0. Greps for common over-engineering smells
# in the Web Components sources. Adapted from ponytail's ponytail-audit
# command (https://github.com/DietrichGebert/ponytail).
#
# Usage: bash .agents/skills/hammock/scripts/audit-simplicity.sh [--diff]
#   (no flag)  -> scope = src/components
#   --diff     -> committed and local changes in this project's src/components

set -uo pipefail

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

MODE="repo"
if [ "${1:-}" = "--diff" ]; then
  MODE="diff"
fi

echo ""
echo -e "${BLUE}+------------------------------------------------+${NC}"
echo -e "${BLUE}|  Hammock -- Simplicity Audit                    |${NC}"
echo -e "${BLUE}+------------------------------------------------+${NC}"
echo ""
echo "Mode: $MODE"
echo "Scope: hand-written component implementation in src/components (not the CLI)"
echo ""

list_files() {
  if [ "$MODE" != "diff" ]; then
    find src/components -type f \( -name '*.tsx' -o -name '*.ts' \) -print0 2>/dev/null
    return
  fi
  local base
  base=$(git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null || true)
  base=$(git merge-base "${base:-main}" HEAD 2>/dev/null || git rev-parse HEAD 2>/dev/null || true)
  if [ -n "$base" ]; then
    git diff --relative --name-only -z --diff-filter=ACMR "$base" -- src/components
  fi
  git ls-files --others --exclude-standard -z -- src/components
}

FILES=()
while IFS= read -r -d '' file; do
  case "$file" in
    *.stories.ts|*.stories.tsx|*.styles.ts|*.d.ts) continue ;;
    src/components/*.ts|src/components/*.tsx) ;;
    *) continue ;;
  esac
  [ -f "$file" ] && FILES+=("$file")
done < <(list_files)

if [ "${#FILES[@]}" -eq 0 ]; then
  echo -e "${GREEN}No matching files in scope.${NC}"
  exit 0
fi

echo "Files in scope: ${#FILES[@]}"
echo ""

# --- Smell 1: TODO/FIXME left in place ---
echo "Smell 1: deferred work markers"
HITS=$(grep -nHE 'TODO|FIXME' "${FILES[@]}" 2>/dev/null || true)
if [ -n "$HITS" ]; then
  echo -e "  ${YELLOW}found -- review whether these are stale or should be in docs/simplicity-debt.md:${NC}"
  echo "$HITS" | sed 's/^/    /'
else
  echo -e "  ${GREEN}none${NC}"
fi
echo ""

# --- Smell 2: no filename reference in the source tree ---
echo "Smell 2: exported modules with no filename reference elsewhere in src/"
for f in "${FILES[@]}"; do
  NAME=$(basename "$f" | sed -E 's/\.tsx?$//')
  EXPORT_COUNT=$(grep -cE "^export (default )?(function|const|class) " "$f" 2>/dev/null)
  if [ "$EXPORT_COUNT" -gt 0 ]; then
    CALLERS=$(grep -rlF "$NAME" src 2>/dev/null | grep -Fxv "$f" | wc -l | tr -d '[:space:]')
    if [ -z "$CALLERS" ] || [ "$CALLERS" -eq 0 ] 2>/dev/null; then
      echo -e "  ${YELLOW}$f${NC} -- no other source file mentions its filename (check public and implicit usage)"
    fi
  fi
done
echo ""

# --- Smell 3: deep nesting (proxy for speculative config/prop-drilling) ---
echo "Smell 3: deeply nested blocks (>4 levels, proxy for speculative branching)"
DEEP=$(grep -nHE "^(     ){4}|^$(printf '\t\t\t\t\t')" "${FILES[@]}" 2>/dev/null || true)
if [ -n "$DEEP" ]; then
  echo -e "  ${YELLOW}found -- worth a second look:${NC}"
  echo "$DEEP" | sed 's/^/    /' | head -20
else
  echo -e "  ${GREEN}none${NC}"
fi
echo ""

echo -e "${BLUE}--------------------------------------------------${NC}"
echo -e "${BLUE}This audit is advisory only and heuristic-based -- confirm findings manually.${NC}"
echo -e "${BLUE}See the Hammock skill for the decision ladder these smells map to.${NC}"
echo ""

exit 0
