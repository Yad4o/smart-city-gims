#!/usr/bin/env bash
set -e

if ! command -v python3.11 &>/dev/null; then
  echo "Python 3.11 is required. Install it and re-run."
  exit 1
fi

python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
echo ""
echo "Setup complete. Run: source ./activate"
