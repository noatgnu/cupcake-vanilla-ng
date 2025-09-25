#!/bin/bash
# Convenience script to run Docker build from project root
# This forwards all arguments to the actual build script in docker-build/

cd "$(dirname "$0")/docker-build"
exec ./build-docker.sh "$@"
