#!/usr/bin/env bash
set -e

# Always operate relative to this script's own location, not the caller's cwd.
cd "$(dirname "$0")"

echo "Setting up lecture-material environment..."

if [ ! -d ".venv" ]; then
    python3 -m venv .venv
    echo "Created .venv"
fi
.venv/bin/pip install --upgrade pip --quiet
.venv/bin/pip install -r requirements.txt --quiet
echo "Python packages installed"

echo ""
echo "Done! To activate the Python environment:"
echo "  source .venv/bin/activate"
