#!/bin/bash

set -e

echo "Starting Cupcake Vanilla Docker Build Process..."

echo "Step 1: Installing dependencies..."
npm ci
cd electron-app
npm ci
cd ..

echo "Step 2: Building Angular libraries and application..."
npm run build:libs
npm run build

echo "Step 3: Building Electron application..."
cd electron-app
npm run compile

BUILD_TARGET=${BUILD_TARGET:-"linux"}

# Check if we're running in a container and adjust target accordingly
if [ -f /.dockerenv ] || [ "${CONTAINER:-false}" = "true" ]; then
    echo "Running in container, defaulting to Linux build unless Wine is available for Windows builds..."
    if [ "${BUILD_TARGET}" = "win" ] && ! command -v wine >/dev/null 2>&1; then
        echo "Warning: Wine not available for Windows build, switching to Linux build"
        BUILD_TARGET="linux"
    fi
fi

case ${BUILD_TARGET} in
    "win")
        echo "Building for Windows..."
        npm run build:win
        ;;
    "mac")
        echo "Building for macOS..."
        npm run build:mac
        ;;
    "linux")
        echo "Building for Linux..."
        npm run build:linux
        ;;
    "all")
        echo "Building for all platforms..."
        npm run build:linux
        # Only build Windows if Wine is available
        if command -v wine >/dev/null 2>&1; then
            npm run build:win
        else
            echo "Skipping Windows build - Wine not available"
        fi
        # Skip macOS build in container (requires macOS host)
        echo "Skipping macOS build - requires macOS host"
        ;;
    *)
        echo "Building for Linux (default)..."
        npm run build:linux
        ;;
esac

cd ..

echo "Collecting build artifacts..."
mkdir -p /app/dist-output

if [ -d "electron-app/dist" ]; then
    cp -r electron-app/dist/* /app/dist-output/
fi

if [ -d "dist" ]; then
    mkdir -p /app/dist-output/web
    cp -r dist/* /app/dist-output/web/
fi

cat > /app/dist-output/build-info.json << EOF
{
    "buildTime": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "target": "${BUILD_TARGET}",
    "nodeVersion": "$(node --version)",
    "npmVersion": "$(npm --version)",
    "electronVersion": "$(cd electron-app && npm list electron --depth=0 2>/dev/null | grep electron@ | sed 's/.*electron@//' | sed 's/ .*//')",
    "angularVersion": "$(npm list @angular/core --depth=0 2>/dev/null | grep @angular/core@ | sed 's/.*@angular\/core@//' | sed 's/ .*//')"
}
EOF

echo "Build completed successfully!"
