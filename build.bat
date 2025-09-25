@echo off
REM Convenience script to run Docker build from project root
REM This forwards all arguments to the actual build script in docker-build/

cd /d "%~dp0docker-build"
call build-docker.bat %*
