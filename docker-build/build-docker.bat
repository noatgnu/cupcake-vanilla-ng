@echo off
REM Cupcake Vanilla Docker Build Script for Windows
REM Builds the complete Electron application using Docker

setlocal enabledelayedexpansion

REM Configuration
set DOCKER_IMAGE=cupcake-vanilla-builder
set BUILD_TARGET=%1
set OUTPUT_DIR=..\docker-dist

REM Default to linux if no target specified
if "%BUILD_TARGET%"=="" set BUILD_TARGET=linux

REM Colors not available in Windows batch, using simple text
echo [INFO] Starting Cupcake Vanilla Docker Build Process...

REM Validate build target
if "%BUILD_TARGET%"=="win" goto valid_target
if "%BUILD_TARGET%"=="mac" goto valid_target
if "%BUILD_TARGET%"=="linux" goto valid_target
if "%BUILD_TARGET%"=="all" goto valid_target
if "%BUILD_TARGET%"=="-h" goto show_help
if "%BUILD_TARGET%"=="--help" goto show_help

echo [ERROR] Invalid build target: %BUILD_TARGET%
echo [INFO] Valid targets: win, mac, linux, all
exit /b 1

:show_help
echo Cupcake Vanilla Docker Build Script for Windows
echo.
echo Usage: %0 [BUILD_TARGET]
echo.
echo BUILD_TARGET:
echo   linux    Build Linux AppImage (default)
echo   win      Build Windows executable
echo   mac      Build macOS application
echo   all      Build for all platforms
echo.
echo Environment Variables:
echo   BACKEND_REPO_URL    Git repository URL for the backend (required)
echo   BACKEND_BRANCH      Git branch to use (default: main)
echo.
echo Examples:
echo   %0 linux
echo   %0 win
echo   set BACKEND_REPO_URL=https://github.com/org/backend.git ^&^& %0 all
echo.
echo Note: Run this script from the docker-build\ directory
echo.
exit /b 0

:valid_target
echo [INFO] Building for target: %BUILD_TARGET%

REM Check if backend repo URL is provided
if "%BACKEND_REPO_URL%"=="" (
    echo [ERROR] BACKEND_REPO_URL environment variable is required
    echo [INFO] Example: set BACKEND_REPO_URL=https://github.com/your-org/cupcake-backend.git ^&^& %0 linux
    exit /b 1
)

if "%BACKEND_BRANCH%"=="" set BACKEND_BRANCH=main

echo [INFO] Backend Repository: %BACKEND_REPO_URL%
echo [INFO] Backend Branch: %BACKEND_BRANCH%

REM Clean previous build
if exist "%OUTPUT_DIR%" (
    echo [INFO] Cleaning previous build output...
    rmdir /s /q "%OUTPUT_DIR%"
)
mkdir "%OUTPUT_DIR%"

REM Build Docker image (context is parent directory)
echo [INFO] Building Docker image...
docker build -t %DOCKER_IMAGE% -f Dockerfile.build ..\

if %errorlevel% neq 0 (
    echo [ERROR] Failed to build Docker image
    exit /b 1
)
echo [SUCCESS] Docker image built successfully

REM Get absolute path for volume mounting
for %%i in ("%OUTPUT_DIR%") do set "ABS_OUTPUT_DIR=%%~fi"

REM Run the build process
echo [INFO] Starting build process in Docker container...
docker run --rm -v "%ABS_OUTPUT_DIR%:/app/dist-output" -e BUILD_TARGET=%BUILD_TARGET% -e BACKEND_REPO_URL=%BACKEND_REPO_URL% -e BACKEND_BRANCH=%BACKEND_BRANCH% %DOCKER_IMAGE%

if %errorlevel% neq 0 (
    echo [ERROR] Build failed!
    exit /b 1
)

echo [SUCCESS] Build completed successfully!
echo [INFO] Build artifacts available in: %ABS_OUTPUT_DIR%

REM Show build summary
if exist "%OUTPUT_DIR%\build-info.json" (
    echo.
    echo [INFO] Build Information:
    type "%OUTPUT_DIR%\build-info.json"
)

echo.
echo [INFO] Generated files:
dir "%OUTPUT_DIR%" /B

echo [SUCCESS] Cupcake Vanilla build completed successfully!
