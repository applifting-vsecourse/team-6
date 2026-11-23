#!/usr/bin/env bash
# Creates .venv and installs the test requirements. On Windows, setup.bat does the same.
set -euo pipefail
cd "$(dirname "$0")/.."

python3 -m venv .venv
.venv/bin/pip install -r tests_selenium/requirements.txt
