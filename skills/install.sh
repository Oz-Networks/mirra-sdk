#!/bin/bash

# Mirra Skills Installer for Claude Code
# Usage: curl -fsSL https://raw.githubusercontent.com/Oz-Networks/mirra-sdk/main/skills/install.sh | bash
# Uninstall: curl -fsSL https://raw.githubusercontent.com/Oz-Networks/mirra-sdk/main/skills/install.sh | bash -s -- --uninstall

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

SKILLS_DIR="$HOME/.claude/skills"
REPO="Oz-Networks/mirra-sdk"
BRANCH="main"
SKILLS_PATH="skills"  # Path within the repo where skills live

# ── Uninstall ──────────────────────────────────────────────────────────

uninstall() {
  echo -e "${BOLD}Removing Mirra skills from Claude Code...${NC}"
  echo ""

  local count=0
  for dir in "$SKILLS_DIR"/mirra-*/; do
    [ -d "$dir" ] || continue
    local name=$(basename "$dir")
    rm -rf "$dir"
    echo -e "  ${RED}✗${NC} Removed ${name}"
    count=$((count + 1))
  done

  if [ "$count" -eq 0 ]; then
    echo -e "  ${DIM}No Mirra skills found.${NC}"
  else
    echo ""
    echo -e "${GREEN}Removed ${count} Mirra skill(s).${NC}"
  fi
}

# ── Install ────────────────────────────────────────────────────────────

install() {
  echo -e "${BOLD}"
  echo "  Mirra Skills Installer"
  echo -e "${NC}"

  # Ensure skills directory exists
  mkdir -p "$SKILLS_DIR"

  # Download repo tarball and extract skills
  echo -e "${CYAN}Downloading skills from GitHub...${NC}"

  TEMP_DIR=$(mktemp -d)
  trap "rm -rf $TEMP_DIR" EXIT

  curl -fsSL "https://github.com/${REPO}/archive/refs/heads/${BRANCH}.tar.gz" \
    -o "$TEMP_DIR/repo.tar.gz"

  tar -xzf "$TEMP_DIR/repo.tar.gz" -C "$TEMP_DIR"

  # The extracted directory is named mirra-sdk-{branch}
  EXTRACTED_DIR="$TEMP_DIR/mirra-sdk-${BRANCH}/${SKILLS_PATH}"

  if [ ! -d "$EXTRACTED_DIR" ]; then
    echo -e "${RED}Error: Skills directory not found in repository.${NC}"
    echo "Expected path: ${SKILLS_PATH}/"
    exit 1
  fi

  # Copy each mirra-* skill directory
  local count=0
  local updated=0

  for skill_dir in "$EXTRACTED_DIR"/mirra-*/; do
    [ -d "$skill_dir" ] || continue
    local name=$(basename "$skill_dir")

    # Check if SKILL.md exists in the source
    if [ ! -f "$skill_dir/SKILL.md" ]; then
      continue
    fi

    local dest="$SKILLS_DIR/$name"
    local status="installed"

    if [ -d "$dest" ]; then
      status="updated"
      updated=$((updated + 1))
    fi

    # Copy (overwrite if exists)
    rm -rf "$dest"
    cp -r "$skill_dir" "$dest"

    echo -e "  ${GREEN}✓${NC} ${name} ${DIM}(${status})${NC}"
    count=$((count + 1))
  done

  echo ""
  if [ "$updated" -gt 0 ]; then
    echo -e "${GREEN}Installed ${count} skills (${updated} updated).${NC}"
  else
    echo -e "${GREEN}Installed ${count} skills.${NC}"
  fi

  echo ""
  echo -e "${BOLD}Usage in Claude Code:${NC}"
  echo -e "  Type ${CYAN}/mirra-${NC} to see all available skills"
  echo ""
  echo -e "${BOLD}Examples:${NC}"
  echo -e "  ${DIM}/mirra-google-gmail${NC}  Send emails via Mirra"
  echo -e "  ${DIM}/mirra-memory${NC}        Manage Mirra memories"
  echo -e "  ${DIM}/mirra-telegram${NC}      Search Telegram messages"
  echo ""
  echo -e "${DIM}Re-run this command anytime to update to the latest skills.${NC}"
}

# ── Main ───────────────────────────────────────────────────────────────

if [ "$1" = "--uninstall" ] || [ "$1" = "-u" ]; then
  uninstall
else
  install
fi
