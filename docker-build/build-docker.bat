@echo off
setlocal enabledelayedexpansion

set DOCKER_IMAGE=cupcake-vanilla-builder
set BUILD_TARGET=%1
set OUTPUT_DIR=..\docker-dist

if "%BUILD_TARGET%"=="" set BUILD_TARGET=linux

if "%BUILD_TARGET%"=="win" goto valid_target
if "%BUILD_TARGET%"=="mac" goto valid_target
if "%BUILD_TARGET%"=="linux" goto valid_target
if "%BUILD_TARGET%"=="all" goto valid_target
if "%BUILD_TARGET%"=="-h" goto show_help
if "%BUILD_TARGET%"=="--help" goto show_help

echo [ERROR] Invalid build target: %BUILD_TARGET%
exit /b 1

:show_help
echo Usage: %0 [BUILD_TARGET]
echo BUILD_TARGET: linux (default), win, mac, all
echo Environment: BACKEND_REPO_URL (required), BACKEND_BRANCH (default: main)
exit /b 0

:valid_target
if "%BACKEND_REPO_URL%"=="" (
    echo [ERROR] BACKEND_REPO_URL environment variable is required
    exit /b 1
)

echo [INFO] Building for target: %BUILD_TARGET%

if exist "%OUTPUT_DIR%" rmdir /s /q "%OUTPUT_DIR%"
mkdir "%OUTPUT_DIR%"

echo [INFO] Building Docker image...
docker build -t %DOCKER_IMAGE% -f Dockerfile.build ..
if errorlevel 1 (
    echo [ERROR] Failed to build Docker image
    exit /b 1
)

echo [INFO] Starting build process...
docker run --rm -v "%cd%\..\docker-dist:/app/dist-output" -e BUILD_TARGET=%BUILD_TARGET% -e BACKEND_REPO_URL=%BACKEND_REPO_URL% -e BACKEND_BRANCH=%BACKEND_BRANCH% %DOCKER_IMAGE%

if errorlevel 1 (
    echo [ERROR] Build failed!
    exit /b 1
) else (
    echo [SUCCESS] Build completed successfully!
)
