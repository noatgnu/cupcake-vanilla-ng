#!/bin/bash

echo "🏗️  Building cupcake-core library..."
ng build cupcake-core

if [ $? -eq 0 ]; then
    echo "✅ cupcake-core built successfully"
else
    echo "❌ cupcake-core build failed"
    exit 1
fi

echo ""
echo "🏗️  Building main application..."
ng build

if [ $? -eq 0 ]; then
    echo "✅ All builds completed successfully!"
    echo ""
    echo "📦 Libraries built to:"
    echo "   - dist/cupcake-core"
    echo ""
    echo "🚀 Main app built to:"
    echo "   - dist/cupcake-vanilla-ng"
else
    echo "❌ Main application build failed"
    exit 1
fi
