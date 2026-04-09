@echo off
setlocal enabledelayedexpansion

echo Building cupcake-core library...
call npx ng build @noatgnu/cupcake-core
if %errorlevel% neq 0 (
    echo cupcake-core build failed
    exit /b 1
)
echo cupcake-core built successfully

echo Building cupcake-vanilla library...
call npx ng build @noatgnu/cupcake-vanilla
if %errorlevel% neq 0 (
    echo cupcake-vanilla build failed
    exit /b 1
)
echo cupcake-vanilla built successfully

echo Building cupcake-macaron library...
call npx ng build @noatgnu/cupcake-macaron
if %errorlevel% neq 0 (
    echo cupcake-macaron build failed
    exit /b 1
)
echo cupcake-macaron built successfully

echo Building cupcake-mint-chocolate library...
call npx ng build @noatgnu/cupcake-mint-chocolate
if %errorlevel% neq 0 (
    echo cupcake-mint-chocolate build failed
    exit /b 1
)
echo cupcake-mint-chocolate built successfully

echo Building cupcake-red-velvet library...
call npx ng build @noatgnu/cupcake-red-velvet
if %errorlevel% neq 0 (
    echo cupcake-red-velvet build failed
    exit /b 1
)
echo cupcake-red-velvet built successfully

echo Building cupcake-salted-caramel library...
call npx ng build @noatgnu/cupcake-salted-caramel
if %errorlevel% neq 0 (
    echo cupcake-salted-caramel build failed
    exit /b 1
)
echo cupcake-salted-caramel built successfully

echo All libraries built successfully!
exit /b 0
