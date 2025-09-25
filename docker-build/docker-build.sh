#!/bin/bash

# Docker-based build script for Cupcake Vanilla Electron Application
# This script handles the complete build process inside a Docker container

set -e  # Exit on any error

echo "🚀 Starting Cupcake Vanilla Docker Build Process..."

# Step 1: Clone the backend repository
echo "📦 Step 1: Cloning backend repository..."
BACKEND_REPO_URL=${BACKEND_REPO_URL:-"https://github.com/your-org/cupcake-backend.git"}
BACKEND_BRANCH=${BACKEND_BRANCH:-"main"}

if [ ! -d "electron-app/backend" ]; then
    echo "Cloning backend from ${BACKEND_REPO_URL} (branch: ${BACKEND_BRANCH})"
    git clone --branch ${BACKEND_BRANCH} ${BACKEND_REPO_URL} electron-app/backend
else
    echo "Backend directory exists, pulling latest changes..."
    cd electron-app/backend
    git pull origin ${BACKEND_BRANCH}
    cd ../..
fi

# Step 2: Install all dependencies
echo "📚 Step 2: Installing dependencies..."
echo "Installing root project dependencies..."
npm ci

echo "Installing electron app dependencies..."
cd electron-app
npm ci
cd ..

# Step 3: Build Angular libraries and application
echo "🏗️ Step 3: Building Angular libraries and application..."
echo "Building cupcake libraries..."
npm run build:libs

echo "Building Angular application..."
npm run build

# Step 4: Prepare backend for distribution
echo "🐍 Step 4: Preparing Python backend..."
cd electron-app/backend

# Install Python dependencies with Poetry
if [ -f "pyproject.toml" ]; then
    echo "Installing Python dependencies with Poetry..."
    poetry config virtualenvs.create false
    poetry install --only=main --no-dev
else
    echo "No pyproject.toml found, trying requirements.txt..."
    if [ -f "requirements.txt" ]; then
        pip3 install -r requirements.txt
    else
        echo "⚠️ No Python dependency file found (pyproject.toml or requirements.txt)"
    fi
fi

cd ../..

# Step 5: Build Electron application
echo "⚡ Step 5: Building Electron application..."
cd electron-app

# Compile TypeScript and copy assets
echo "Compiling TypeScript and assets..."
npm run compile

# Build backend distribution
echo "Building backend distribution..."
npm run build:backend

# Step 6: Build Electron distributables
echo "📦 Step 6: Creating Electron distributables..."

BUILD_TARGET=${BUILD_TARGET:-"linux"}
case ${BUILD_TARGET} in
    "win")
        echo "Building Windows executable..."
        npm run build:win
        ;;
    "mac")
        echo "Building macOS application..."
        npm run build:mac
        ;;
    "linux")
        echo "Building Linux AppImage..."
        npm run build:linux
        ;;
    "all")
        echo "Building for all platforms..."
        npm run build:win
        npm run build:mac
        npm run build:linux
        ;;
    *)
        echo "Building for Linux (default)..."
        npm run build:linux
        ;;
esac

cd ..

# Step 7: Collect build artifacts
echo "📁 Step 7: Collecting build artifacts..."
mkdir -p /app/dist-output

# Copy electron distributables
if [ -d "electron-app/dist" ]; then
    echo "Copying Electron distributables..."
    cp -r electron-app/dist/* /app/dist-output/
fi

# Copy Angular build
if [ -d "dist" ]; then
    echo "Copying Angular build..."
    mkdir -p /app/dist-output/web
    cp -r dist/* /app/dist-output/web/
fi

# Create build info
echo "Creating build information..."
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

echo "✅ Build completed successfully!"
echo "📂 Build artifacts available in: /app/dist-output"
echo ""
echo "🏁 Build Summary:"
echo "  - Angular app: Built and ready"
echo "  - Python backend: Packaged for distribution"
echo "  - Electron app: Built for ${BUILD_TARGET}"
echo "  - All artifacts: Available in dist-output/"
