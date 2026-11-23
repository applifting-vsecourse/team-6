#!/usr/bin/env bash
# Runs the Selenium suite, or only the tests you name.
#
#   tests_selenium/run.sh [--ios] [test name ...] [pytest options ...]
#
#   pnpm test:selenium                                  everything (web)
#   pnpm test:selenium mascot video                     tests whose name contains "mascot" or "video"
#   pnpm test:selenium test_10_landing_page.py          one file
#   pnpm test:ios sheet_rides                           one iOS test
#   pnpm test:ios sheet_rides chat -x                   two iOS tests, stop at the first failure
#
# A name is any part of a test's name, class or file. A path (with / or ::, or ending in .py)
# is run as given. Everything from the first option starting with "-" goes to pytest unchanged.
set -euo pipefail
cd "$(dirname "$0")/.."

pytest_args=()
names=()
paths=()

if [ "${1:-}" = "--ios" ]; then
  pytest_args+=(-m ios --ios)
  shift
fi

while [ $# -gt 0 ] && [ "${1#-}" = "$1" ]; do
  case "$1" in
    */* | *::* | *.py)
      if [ -e "$1" ] || [ -e "${1%%::*}" ]; then
        paths+=("$1")
      else
        paths+=("tests_selenium/tests/$1")
      fi
      ;;
    *) names+=("$1") ;;
  esac
  shift
done

if [ ${#names[@]} -gt 0 ]; then
  expression="${names[0]}"
  for name in "${names[@]:1}"; do
    expression="$expression or $name"
  done
  pytest_args+=(-k "$expression")
fi

if [ ${#paths[@]} -eq 0 ]; then
  paths=(tests_selenium)
fi

exec .venv/bin/pytest "${paths[@]}" ${pytest_args[@]+"${pytest_args[@]}"} "$@"
