#!/bin/bash
# Test script to simulate what sendInput does
# Usage: ./test-resume.sh <session-id> <input>

CLAUDE_PATH=$(which claude)
SESSION_ID="${1:-ac20ea0d}"
INPUT="${2:-test message}"
WORKING_DIR="${3:-$(pwd)}"

echo "=== Resume Test ==="
echo "CLAUDE_PATH: $CLAUDE_PATH"
echo "SESSION_ID: $SESSION_ID"
echo "INPUT: $INPUT"
echo "WORKING_DIR: $WORKING_DIR"
echo ""
echo "Command: $CLAUDE_PATH -p --output-format json --resume $SESSION_ID \"$INPUT\""
echo ""
echo "=== Running... ==="

cd "$WORKING_DIR"
"$CLAUDE_PATH" -p --output-format json --resume "$SESSION_ID" "$INPUT" 2>&1

echo ""
echo "=== Exit code: $? ==="
