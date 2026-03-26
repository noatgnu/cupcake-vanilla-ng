#!/bin/bash

# Run Angular tests with Puppeteer's Chromium
# Usage: ./scripts/run-tests.sh [project] [additional-args]
# Example: ./scripts/run-tests.sh @noatgnu/cupcake-vanilla --watch=false
# Example: ./scripts/run-tests.sh @noatgnu/cupcake-core

PROJECT=${1:-@noatgnu/cupcake-vanilla}
shift

export CHROME_BIN=$(node -e "console.log(require('puppeteer').executablePath())")

if [ -z "$CHROME_BIN" ] || [ ! -f "$CHROME_BIN" ]; then
    echo "Error: Puppeteer Chrome not found. Installing..."
    npm install puppeteer --save-dev
    export CHROME_BIN=$(node -e "console.log(require('puppeteer').executablePath())")
fi

echo "Using Chrome: $CHROME_BIN"
echo "Running tests for: $PROJECT"
echo "Additional args: $@"

npx ng test "$PROJECT" --browsers=ChromeHeadless --watch=false --progress=false "$@"
