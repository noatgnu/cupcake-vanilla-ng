@echo off
setlocal enabledelayedexpansion

:: Run Angular tests with Puppeteer's Chromium
:: Usage: scripts\run-tests.bat [project] [additional-args]

set PROJECT=%1
if "%PROJECT%"=="" set PROJECT=@noatgnu/cupcake-vanilla

:: Shift doesn't work well with %* for additional args, so we use a different approach
set ARGS=
for /f "tokens=1,* delims= " %%a in ("%*") do set ARGS=%%b

:: Find Chrome executable path via node/puppeteer
for /f "tokens=*" %%i in ('node -e "try { console.log(require('puppeteer').executablePath()); } catch(e) { console.log(''); }"') do set CHROME_BIN=%%i

if "%CHROME_BIN%"=="" (
    echo Error: Puppeteer Chrome not found. Installing...
    call npm install puppeteer --save-dev
    for /f "tokens=*" %%i in ('node -e "console.log(require('puppeteer').executablePath())"') do set CHROME_BIN=%%i
)

if not exist "%CHROME_BIN%" (
    echo Error: Chrome binary not found at %CHROME_BIN%
    exit /b 1
)

echo Using Chrome: %CHROME_BIN%
echo Running tests for: %PROJECT%
echo Additional args: %ARGS%

:: Set environment variable for Karma/Chrome
set CHROME_BIN=%CHROME_BIN%

call npx ng test %PROJECT% --browsers=ChromeHeadless --watch=false --progress=false %ARGS%
exit /b %errorlevel%
