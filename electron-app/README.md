# Cupcake Vanilla Electron App

This is the Electron desktop wrapper for the Cupcake Vanilla metadata management application.

## Structure

```
electron-app/
├── src/
│   ├── main.js          # Main Electron process
│   └── preload.js       # Preload script for secure IPC
├── assets/              # App icons and resources
├── package.json         # Electron app dependencies and build config
└── README.md           # This file
```

## Development

### Prerequisites

1. Make sure the main Angular app is built or running:
   ```bash
   # From the root directory
   npm run build
   # OR for development
   npm start
   ```

2. Install Electron dependencies:
   ```bash
   cd electron-app
   npm install
   ```

### Running in Development

```bash
# Start the Angular dev server first (in root directory)
npm start

# Then start Electron in development mode (in electron-app directory)
npm run dev
```

This will load the Angular app from `http://localhost:4200` in the Electron window.

### Building for Production

```bash
# Build everything and create distributable packages
npm run build

# Or build for specific platforms
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

## Features

### Application Menu
- **File Menu**: New Table, Import, Export
- **Edit Menu**: Standard editing operations
- **View Menu**: Zoom, DevTools, etc.
- **Navigate Menu**: Quick access to Tables, Templates, Lab Groups
- **Window Menu**: Window management
- **Help Menu**: About and documentation

### Keyboard Shortcuts
- `Ctrl/Cmd + N`: New Table
- `Ctrl/Cmd + I`: Import
- `Ctrl/Cmd + E`: Export
- `Ctrl/Cmd + 1`: Navigate to Tables
- `Ctrl/Cmd + 2`: Navigate to Templates
- `Ctrl/Cmd + 3`: Navigate to Lab Groups

### Security Features
- Context isolation enabled
- Node integration disabled
- Secure IPC communication via preload script
- External links open in default browser

### File System Integration
- Save and open dialogs for file operations
- Platform-appropriate file handling

## Configuration

The Electron app is configured to:
- Load the built Angular app from `../dist/cupcake-vanilla-ng/`
- Support development mode loading from `localhost:4200`
- Create platform-specific distributables (DMG for macOS, NSIS for Windows, AppImage for Linux)

## Notes

- The app requires the Angular application to be built before creating production builds
- In development mode, the Angular dev server must be running
- The preload script provides a secure bridge between the main process and renderer
- Menu actions are communicated to the Angular app via IPC messages