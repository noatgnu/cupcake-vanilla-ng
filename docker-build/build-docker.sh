#!/bin/bash

set -e

DOCKER_IMAGE="cupcake-vanilla-builder"
BUILD_TARGET=${1:-"linux"}
OUTPUT_DIR="../docker-dist"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}$1${NC}"; }
log_success() { echo -e "${GREEN}$1${NC}"; }
log_warning() { echo -e "${YELLOW}$1${NC}"; }
log_error() { echo -e "${RED}$1${NC}"; }

show_help() {
    echo "Usage: $0 [BUILD_TARGET]"
    echo "BUILD_TARGET: linux (default), win, mac, all"
}

if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
    exit 0
fi

case ${BUILD_TARGET} in
    "win"|"mac"|"linux"|"all") ;;
    *)
        log_error "Invalid build target: ${BUILD_TARGET}"
        exit 1
        ;;
esac

log_info "Building for target: ${BUILD_TARGET}"

if [ -d "$OUTPUT_DIR" ]; then
    rm -rf "$OUTPUT_DIR"
fi
mkdir -p "$OUTPUT_DIR"

log_info "Building Docker image..."
docker build -t ${DOCKER_IMAGE} -f Dockerfile.build ../

if [ $? -ne 0 ]; then
    log_error "Failed to build Docker image"
    exit 1
fi

log_info "Starting build process..."
docker run \
    --rm \
    -v "$(cd .. && pwd)/docker-dist:/app/dist-output" \
    -e BUILD_TARGET="${BUILD_TARGET}" \
    ${DOCKER_IMAGE}

if [ $? -eq 0 ]; then
    log_success "Build completed successfully!"
    if [ -f "${OUTPUT_DIR}/build-info.json" ]; then
        cat "${OUTPUT_DIR}/build-info.json" | jq . 2>/dev/null || cat "${OUTPUT_DIR}/build-info.json"
    fi
else
    log_error "Build failed!"
    exit 1
fi
