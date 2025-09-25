#!/bin/bash

set -e

echo "Starting Cupcake Vanilla Docker Build Process..."

echo "Step 1: Cloning backend repository..."
BACKEND_REPO_URL=${BACKEND_REPO_URL:-"https://github.com/noatgnu/cupcake_vanilla.git"}
BACKEND_BRANCH=${BACKEND_BRANCH:-"master"}

if [ ! -d "electron-app/backend" ]; then
    echo "Cloning backend from ${BACKEND_REPO_URL} (branch: ${BACKEND_BRANCH})"
    git clone --branch ${BACKEND_BRANCH} ${BACKEND_REPO_URL} electron-app/backend
else
    echo "Backend directory exists, pulling latest changes..."
    cd electron-app/backend
    git pull origin ${BACKEND_BRANCH}
    cd ../..
fi

echo "Step 2: Installing dependencies..."
npm ci
cd electron-app
npm ci
cd ..

echo "Step 3: Building Angular libraries and application..."
npm run build:libs
npm run build

echo "Step 4: Building Electron application..."
cd electron-app
npm run compile

BUILD_TARGET=${BUILD_TARGET:-"linux"}
case ${BUILD_TARGET} in
    "win")
        npm run build:win
        ;;
    "mac")
        npm run build:mac
        ;;
    "linux")
        npm run build:linux
        ;;
    "all")
        npm run build:win
        npm run build:mac
        npm run build:linux
        ;;
    *)
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
