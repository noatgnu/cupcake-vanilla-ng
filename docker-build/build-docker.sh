#!/bin/bash

# Cupcake Vanilla Docker Build Script
# Builds the complete Electron application using Docker

set -e

# Configuration
DOCKER_IMAGE="cupcake-vanilla-builder"
BUILD_TARGET=${1:-"linux"}  # Default to linux, can be: win, mac, linux, all
BACKEND_REPO_URL=${BACKEND_REPO_URL:-""}
BACKEND_BRANCH=${BACKEND_BRANCH:-"main"}
OUTPUT_DIR="../docker-dist"  # Output to parent directory

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

show_help() {
    echo "Cupcake Vanilla Docker Build Script"
    echo ""
    echo "Usage: $0 [BUILD_TARGET] [OPTIONS]"
    echo ""
    echo "BUILD_TARGET:"
    echo "  linux    Build Linux AppImage (default)"
    echo "  win      Build Windows executable"
    echo "  mac      Build macOS application"
    echo "  all      Build for all platforms"
    echo ""
    echo "Environment Variables:"
    echo "  BACKEND_REPO_URL    Git repository URL for the backend (required)"
    echo "  BACKEND_BRANCH      Git branch to use (default: main)"
    echo ""
    echo "Examples:"
    echo "  $0 linux                           # Build for Linux"
    echo "  $0 win                            # Build for Windows"
    echo "  BACKEND_REPO_URL=https://github.com/org/backend.git $0 all"
    echo ""
    echo "Note: Run this script from the docker-build/ directory"
    echo ""
}

# Check if help is requested
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
    exit 0
fi

# Validate build target
case ${BUILD_TARGET} in
    "win"|"mac"|"linux"|"all")
        log_info "Building for target: ${BUILD_TARGET}"
        ;;
    *)
        log_error "Invalid build target: ${BUILD_TARGET}"
        log_info "Valid targets: win, mac, linux, all"
        exit 1
        ;;
esac

# Check if backend repo URL is provided
if [ -z "$BACKEND_REPO_URL" ]; then
    log_error "BACKEND_REPO_URL environment variable is required"
    log_info "Example: BACKEND_REPO_URL=https://github.com/your-org/cupcake-backend.git $0 linux"
    exit 1
fi

log_info "Starting Cupcake Vanilla Docker Build Process..."
log_info "Backend Repository: ${BACKEND_REPO_URL}"
log_info "Backend Branch: ${BACKEND_BRANCH}"
log_info "Build Target: ${BUILD_TARGET}"

# Clean previous build
if [ -d "$OUTPUT_DIR" ]; then
    log_info "Cleaning previous build output..."
    rm -rf "$OUTPUT_DIR"
fi
mkdir -p "$OUTPUT_DIR"

# Build Docker image (context is parent directory)
log_info "Building Docker image..."
docker build -t ${DOCKER_IMAGE} -f Dockerfile.build ../

if [ $? -eq 0 ]; then
    log_success "Docker image built successfully"
else
    log_error "Failed to build Docker image"
    exit 1
fi

# Run the build process
log_info "Starting build process in Docker container..."
docker run \
    --rm \
    -v "$(cd .. && pwd)/docker-dist:/app/dist-output" \
    -e BUILD_TARGET="${BUILD_TARGET}" \
    -e BACKEND_REPO_URL="${BACKEND_REPO_URL}" \
    -e BACKEND_BRANCH="${BACKEND_BRANCH}" \
    ${DOCKER_IMAGE}

if [ $? -eq 0 ]; then
    log_success "Build completed successfully!"
    log_info "Build artifacts available in: $(cd .. && pwd)/docker-dist/"

    # Show build summary
    if [ -f "${OUTPUT_DIR}/build-info.json" ]; then
        echo ""
        log_info "Build Information:"
        cat "${OUTPUT_DIR}/build-info.json" | jq . 2>/dev/null || cat "${OUTPUT_DIR}/build-info.json"
    fi

    # List output files
    echo ""
    log_info "Generated files:"
    ls -la "${OUTPUT_DIR}/"

else
    log_error "Build failed!"
    exit 1
fi

log_success "🎉 Cupcake Vanilla build completed successfully!"
