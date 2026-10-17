#!/usr/bin/env bash
# =============================================================================
# FloodGuard AI — Local Development Server Launcher (Linux / macOS)
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"

echo "Starting FloodGuard AI Development Server..."
export PYTHONPATH="$BACKEND_DIR:$PYTHONPATH"
cd "$BACKEND_DIR"

exec uvicorn main:app --host 127.0.0.1 --port 8000 --reload
