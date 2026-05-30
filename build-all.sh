#!/bin/bash

echo "Building cupcake-core library..."
ng build @noatgnu/cupcake-core

if [ $? -eq 0 ]; then
    echo "cupcake-core built successfully"
else
    echo "cupcake-core build failed"
    exit 1
fi

echo "Building cupcake-vanilla library..."
ng build @noatgnu/cupcake-vanilla
if [ $? -eq 0 ]; then
    echo "cupcake-vanilla built successfully"
else
    echo "cupcake-vanilla build failed"
    exit 1
fi

echo "Building cupcake-macaron library..."
ng build @noatgnu/cupcake-macaron
if [ $? -eq 0 ]; then
    echo "cupcake-macaron built successfully"
else
    echo "cupcake-macaron build failed"
    exit 1
fi

echo "Building cupcake-mint-chocolate library..."
ng build @noatgnu/cupcake-mint-chocolate
if [ $? -eq 0 ]; then
    echo "cupcake-mint-chocolate built successfully"
else
    echo "cupcake-mint-chocolate build failed"
    exit 1
fi

echo "Building cupcake-red-velvet library..."
ng build @noatgnu/cupcake-red-velvet
if [ $? -eq 0 ]; then
    echo "cupcake-red-velvet built successfully"
else
    echo "cupcake-red-velvet build failed"
    exit 1
fi

echo "Building cupcake-salted-caramel library..."
ng build @noatgnu/cupcake-salted-caramel
if [ $? -eq 0 ]; then
    echo "cupcake-salted-caramel built successfully"
else
    echo "cupcake-salted-caramel build failed"
    exit 1
fi
