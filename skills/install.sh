#!/bin/bash
#
# Mirra skills installer — MIGRATION SHIM.
#
# Mirra skills used to be 40-odd loose directories copied into ~/.claude/skills by
# this script. Updating them meant re-running it by hand, which nobody did, so
# everyone ran whatever the skills looked like on the day they installed.
#
# They are now a Claude Code plugin, which Claude Code keeps current on its own.
# This file stays at its published URL because that URL is in READMEs, docs, and
# people's notes — it now performs the migration instead of the old install.
#
#   curl -fsSL https://raw.githubusercontent.com/Oz-Networks/mirra-sdk/main/skills/install.sh | bash
#   curl -fsSL .../install.sh | bash -s -- --uninstall   # remove the old loose skills, install nothing
#
# Synced from the monorepo (tools/llm-api-generator/legacy-install.sh) — edit it there.

set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'
BOLD='\033[1m'; DIM='\033[2m'; NC='\033[0m'

SKILLS_DIR="$HOME/.claude/skills"
MARKETPLACE="Oz-Networks/mirra-sdk"
PLUGIN="mirra"

# ── Remove the pre-plugin loose skills ─────────────────────────────────

REMOVED=0

remove_legacy_skills() {
  REMOVED=0
  # The old layout: a bare `mirra` index skill plus `mirra-*` siblings. Skip any
  # directory holding a plugin manifest — that is the new layout installed from a
  # checkout (mirra@skills-dir), not a leftover. Globbing rather than `find`,
  # because ~/.claude/skills is often a symlink and find will not follow one.
  for dir in "$SKILLS_DIR"/mirra/ "$SKILLS_DIR"/mirra-*/; do
    [ -d "$dir" ] || continue
    [ -f "${dir}.claude-plugin/plugin.json" ] && continue
    rm -rf "$dir"
    echo -e "  ${RED}✗${NC} Removed $(basename "$dir") ${DIM}(pre-plugin)${NC}"
    REMOVED=$((REMOVED + 1))
  done
}

uninstall() {
  echo -e "${BOLD}Removing the pre-plugin Mirra skills...${NC}"
  echo ""
  remove_legacy_skills
  local count=$REMOVED
  echo ""
  if [ "$count" -eq 0 ]; then
    echo -e "  ${DIM}None found.${NC}"
  else
    echo -e "${GREEN}Removed ${count} skill(s).${NC}"
  fi
  echo ""
  echo -e "To remove the plugin as well: ${BOLD}claude plugin uninstall ${PLUGIN}@${PLUGIN}${NC}"
}

# ── Migrate ────────────────────────────────────────────────────────────

install() {
  echo -e "${BOLD}"
  echo "  Mirra for Claude Code"
  echo -e "${NC}"
  echo -e "Mirra skills are now a ${BOLD}plugin${NC}, so they update themselves."
  echo ""

  if ! command -v claude >/dev/null 2>&1; then
    echo -e "${YELLOW}The \`claude\` CLI is not on your PATH${NC}, so this script cannot install the plugin."
    echo ""
    echo -e "Run these inside Claude Code instead:"
    echo -e "  ${CYAN}/plugin marketplace add ${MARKETPLACE}${NC}"
    echo -e "  ${CYAN}/plugin install ${PLUGIN}@${PLUGIN}${NC}"
    echo ""
    echo -e "Then remove the old loose skills: ${DIM}curl -fsSL <this url> | bash -s -- --uninstall${NC}"
    exit 0
  fi

  echo -e "${CYAN}Clearing the old loose skills...${NC}"
  remove_legacy_skills
  [ "$REMOVED" -eq 0 ] && echo -e "  ${DIM}None found.${NC}"
  echo ""

  echo -e "${CYAN}Installing the plugin...${NC}"
  claude plugin marketplace add "$MARKETPLACE" 2>/dev/null || \
    claude plugin marketplace update "$PLUGIN" 2>/dev/null || true
  claude plugin install "${PLUGIN}@${PLUGIN}"

  echo ""
  echo -e "${GREEN}Done.${NC} Skills are namespaced now — ${CYAN}/${PLUGIN}:ledger${NC}, ${CYAN}/${PLUGIN}:google-gmail${NC},"
  echo -e "and so on. Type ${CYAN}/${PLUGIN}:${NC} in Claude Code to see them all."
  echo ""
  echo -e "${DIM}Claude Code refreshes the marketplace at session start, so this is the last${NC}"
  echo -e "${DIM}time you need to run anything to get new skills.${NC}"
}

# ── Main ───────────────────────────────────────────────────────────────

if [ "$1" = "--uninstall" ] || [ "$1" = "-u" ]; then
  uninstall
else
  install
fi
