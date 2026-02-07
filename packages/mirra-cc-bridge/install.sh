#!/bin/bash

# Mirra Claude Code Bridge Installer
# Usage: curl -fsSL https://mirra.app/install-cc-bridge.sh | bash

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

# Check for npm
check_npm() {
  if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is required but not installed.${NC}"
    exit 1
  fi
  echo -e "${GREEN}✓${NC} npm $(npm -v) detected"
}

# Check for Claude Code
check_claude() {
  if ! command -v claude &> /dev/null; then
    echo -e "${YELLOW}Warning: Claude Code CLI not found.${NC}"
    echo "  Install from: https://docs.anthropic.com/claude-code"
    echo ""
  else
    echo -e "${GREEN}✓${NC} Claude Code detected"
  fi
}

# Install the package
install_package() {
  echo ""
  echo -e "${CYAN}Installing @anthropic/mirra-cc-bridge...${NC}"
  npm install -g @anthropic/mirra-cc-bridge

  if ! command -v mirra-cc-bridge &> /dev/null; then
    echo -e "${RED}Error: Installation failed. mirra-cc-bridge not found in PATH.${NC}"
    exit 1
  fi

  echo -e "${GREEN}✓${NC} Package installed"
}

# Configure the bridge
configure() {
  echo ""
  echo -e "${BOLD}Configuration${NC}"
  echo ""

  # Prompt for API key
  read -p "Enter your Mirra API key: " MIRRA_API_KEY

  if [ -z "$MIRRA_API_KEY" ]; then
    echo -e "${RED}Error: API key is required.${NC}"
    exit 1
  fi

  # Prompt for working directory
  DEFAULT_WORK_DIR=$(pwd)
  read -p "Default working directory [$DEFAULT_WORK_DIR]: " WORK_DIR
  WORK_DIR=${WORK_DIR:-$DEFAULT_WORK_DIR}

  # Create config directory
  mkdir -p ~/.mirra
  chmod 700 ~/.mirra

  # Save config
  cat > ~/.mirra/cc-bridge.json << EOF
{
  "apiKey": "$MIRRA_API_KEY",
  "defaultWorkDir": "$WORK_DIR"
}
EOF
  chmod 600 ~/.mirra/cc-bridge.json

  echo -e "${GREEN}✓${NC} Configuration saved to ~/.mirra/cc-bridge.json"
}

# Setup Claude Code hooks
setup_hooks() {
  echo ""
  echo -e "${CYAN}Setting up Claude Code hooks...${NC}"

  mirra-cc-bridge setup-hooks

  echo -e "${GREEN}✓${NC} Hooks configured"
}

# Register PC as resource (required for mobile → PC commands)
register_pc() {
  echo ""
  echo -e "${BOLD}PC Registration${NC}"
  echo ""
  echo "To control Claude Code from your mobile app, your PC needs to be"
  echo "registered as a Mirra resource with a public tunnel URL."
  echo ""
  echo -e "${YELLOW}You'll need a tunnel running. In another terminal:${NC}"
  echo "  ngrok http 3847"
  echo ""
  read -p "Do you have a tunnel URL ready? (y/n) [n]: " READY

  if [[ "$READY" == "y" || "$READY" == "Y" ]]; then
    mirra-cc-bridge register
  else
    echo ""
    echo -e "${YELLOW}⚠ Skipping registration for now.${NC}"
    echo ""
    echo "Without registration, you can still see Claude Code output in your"
    echo "mobile app, but you won't be able to send commands from mobile."
    echo ""
    echo "To complete setup later:"
    echo "  1. Start a tunnel: ngrok http 3847"
    echo "  2. Run: mirra-cc-bridge register"
  fi
}

# Print completion message
finish() {
  echo ""
  echo -e "${BOLD}════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}✓ Mirra Claude Code Bridge installed!${NC}"
  echo -e "${BOLD}════════════════════════════════════════════════${NC}"
  echo ""
  echo -e "${BOLD}To start coding from your mobile app:${NC}"
  echo ""
  echo "  1. Start a tunnel (in a separate terminal):"
  echo "     ${CYAN}ngrok http 3847${NC}"
  echo ""
  echo "  2. Register your PC (if not done during install):"
  echo "     ${CYAN}mirra-cc-bridge register${NC}"
  echo ""
  echo "  3. Start the bridge service:"
  echo "     ${CYAN}mirra-cc-bridge start${NC}"
  echo ""
  echo "  4. Open Mirra on your phone and start coding!"
  echo ""
  echo -e "${BOLD}Commands:${NC}"
  echo "  mirra-cc-bridge start     Start the bridge service"
  echo "  mirra-cc-bridge status    Check status"
  echo "  mirra-cc-bridge register  Register this PC"
  echo ""
  echo -e "${CYAN}Happy coding from anywhere! 🚀${NC}"
  echo ""
}

# Main installation flow
main() {
  check_node
  check_npm
  check_claude

  install_package
  configure
  setup_hooks
  register_pc
  finish
}

main
