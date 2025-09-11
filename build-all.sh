#!/bin/bash

echo "Building cupcake-core library..."
ng build @cupcake/core

if [ $? -eq 0 ]; then
    echo "cupcake-core built successfully"
else
    echo "cupcake-core build failed"
    exit 1
fi

echo "Building cupcake-vanilla library..."
ng build @cupcake/vanilla
if [ $? -eq 0 ]; then
    echo "cupcake-vanilla built successfully"
else
    echo "cupcake-vanilla build failed"
    exit 1
fi

echo "Building cupcake-macaron library..."
ng build @cupcake/macaron
if [ $? -eq 0 ]; then
    echo "cupcake-macaron built successfully"
else
    echo "cupcake-macaron build failed"
    exit 1
fi

echo "Building cupcake-mint-chocolate library..."
ng build @cupcake/mint-chocolate
if [ $? -eq 0 ]; then
    echo "cupcake-mint-chocolate built successfully"
else
    echo "cupcake-mint-chocolate build failed"
    exit 1
fi

echo "Building cupcake-red-velvet library..."
ng build @cupcake/red-velvet
if [ $? -eq 0 ]; then
    echo "cupcake-red-velvet built successfully"
else
    echo "cupcake-red-velvet build failed"
    exit 1
fi

echo "Building cupcake-salted-caramel library..."
ng build @cupcake/salted-caramel
if [ $? -eq 0 ]; then
    echo "cupcake-salted-caramel built successfully"
else
    echo "cupcake-salted-caramel build failed"
    exit 1
fi


echo ""
echo "🏗Building main application..."
ng build

if [ $? -eq 0 ]; then
    echo "All builds completed successfully!"
    echo ""
    echo "Libraries built to:"
    echo "   - dist/cupcake-core"
    echo ""
    echo "Main app built to:"
    echo "   - dist/cupcake-vanilla-ng"
else
    echo "Main application build failed"
    exit 1
fi
