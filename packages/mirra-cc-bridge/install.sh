#!/bin/bash

# Mirra Claude Code Bridge - Plugin Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/Oz-Networks/mirra-sdk/main/packages/mirra-cc-bridge/install.sh | bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BOLD}"
echo "╔═══════════════════════════════════════════════╗"
echo "║   Mirra Claude Code Bridge Installer          ║"
echo "╚═══════════════════════════════════════════════╝"
echo -e "${NC}"

# Check for Node.js
check_node() {
  if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is required but not installed.${NC}"
    echo ""
    echo "Install Node.js from: https://nodejs.org"
    echo "Or use a version manager like nvm:"
    echo "  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    exit 1
  fi

  NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
  if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Error: Node.js 18+ is required. You have $(node -v)${NC}"
    exit 1
  fi

  echo -e "${GREEN}✓${NC} Node.js $(node -v) detected"
}

# Check for Claude Code
check_claude() {
  if ! command -v claude &> /dev/null; then
    echo -e "${RED}Error: Claude Code CLI is required but not found.${NC}"
    echo "  Install from: https://docs.anthropic.com/claude-code"
    exit 1
  fi
  echo -e "${GREEN}✓${NC} Claude Code detected"
}

# Clone, build, and install the plugin
install_plugin() {
  echo ""
  echo -e "${CYAN}Downloading mirra-cc-bridge...${NC}"

  TEMP_DIR=$(mktemp -d)
  trap "rm -rf $TEMP_DIR" EXIT

  git clone --depth 1 https://github.com/Oz-Networks/mirra-sdk.git "$TEMP_DIR/mirra-sdk"
  cd "$TEMP_DIR/mirra-sdk/packages/mirra-cc-bridge"

  echo -e "${CYAN}Installing dependencies...${NC}"
  npm install --ignore-scripts 2>/dev/null

  echo -e "${CYAN}Building plugin...${NC}"
  node build.mjs

  echo -e "${CYAN}Installing Claude Code plugin...${NC}"
  claude plugin install .

  echo -e "${GREEN}✓${NC} Plugin installed"
}

# Print completion message
finish() {
  echo ""
  echo -e "${BOLD}════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}✓ Mirra Claude Code Bridge installed!${NC}"
  echo -e "${BOLD}════════════════════════════════════════════════${NC}"
  echo ""
  echo -e "${BOLD}Next steps (inside Claude Code):${NC}"
  echo ""
  echo "  1. Configure the bridge:"
  echo "     ${CYAN}/mirra-cc-bridge:configure${NC}"
  echo ""
  echo "  2. Start the bridge:"
  echo "     ${CYAN}/mirra-cc-bridge:start${NC}"
  echo ""
  echo "  3. Open Mirra on your phone and start coding!"
  echo ""
}

# Main installation flow
main() {
  check_node
  check_claude
  install_plugin
  finish
}

main
