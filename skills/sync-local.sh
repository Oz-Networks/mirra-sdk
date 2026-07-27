#!/bin/bash
#
# Install the skills in THIS checkout into ~/.claude/skills.
#
# install.sh pulls from the published Oz-Networks/mirra-sdk repo, which lags
# this monorepo by however long it has been since the last SDK push. That lag
# is not cosmetic: an agent following a stale mirra-ledger writes cards against
# a deprecated API and silently wipes live data (it happened — a card published
# with the old `defaultBody` ritual replaced seven structured lines). This
# script closes that window for anyone working in the monorepo.
#
#   ./generated-skills/sync-local.sh          # install
#   ./generated-skills/sync-local.sh --check  # report drift, change nothing
#
# Run `npm run generate:llm-api` (from apps/server) first if you have edited an
# adapter or anything under tools/llm-api-generator/static-skills/.

set -e

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; DIM='\033[2m'; BOLD='\033[1m'; NC='\033[0m'

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST="$HOME/.claude/skills"
CHECK_ONLY=false
[ "$1" = "--check" ] && CHECK_ONLY=true

mkdir -p "$DEST"

installed=0
drifted=0
unchanged=0

for skill_dir in "$SRC"/mirra/ "$SRC"/mirra-*/; do
  [ -d "$skill_dir" ] || continue
  [ -f "$skill_dir/SKILL.md" ] || continue
  name=$(basename "$skill_dir")

  if [ -d "$DEST/$name" ] && diff -rq "$skill_dir" "$DEST/$name" >/dev/null 2>&1; then
    unchanged=$((unchanged + 1))
    continue
  fi

  if [ "$CHECK_ONLY" = true ]; then
    echo -e "  ${YELLOW}~${NC} ${name} ${DIM}(differs from this checkout)${NC}"
    drifted=$((drifted + 1))
    continue
  fi

  rm -rf "${DEST:?}/$name"
  cp -r "$skill_dir" "$DEST/$name"
  echo -e "  ${GREEN}✓${NC} ${name}"
  installed=$((installed + 1))
done

echo ""
if [ "$CHECK_ONLY" = true ]; then
  if [ "$drifted" -eq 0 ]; then
    echo -e "${GREEN}Installed skills match this checkout${NC} ${DIM}(${unchanged} skills)${NC}"
  else
    echo -e "${YELLOW}${drifted} skill(s) differ from this checkout.${NC} Run ${BOLD}./generated-skills/sync-local.sh${NC} to update."
    exit 1
  fi
else
  echo -e "${GREEN}Synced ${installed} skill(s)${NC} ${DIM}(${unchanged} already current)${NC}"
fi
