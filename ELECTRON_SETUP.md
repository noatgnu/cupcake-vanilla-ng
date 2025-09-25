# Cupcake Vanilla with Electron Desktop App

This project now includes an Electron desktop application wrapper alongside the Angular web application.

## Project Structure

```
cupcake-vanilla-ng/
├── src/                     # Angular web application
├── projects/                # Angular libraries (core, vanilla, etc.)
├── electron-app/           # Electron desktop application
│   ├── src/
│   │   ├── main.js         # Main Electron process
│   │   └── preload.js      # Secure IPC bridge
│   ├── assets/             # App icons and resources
│   ├── scripts/            # Development scripts
│   └── package.json        # Electron-specific dependencies
├── dist/                   # Built Angular application
└── package.json            # Main project dependencies
```

## Quick Start

### 1. Install Dependencies

```bash
# Install main project dependencies
npm install

# Install Electron dependencies
cd electron-app
npm install
cd ..
```

### 2. Development

**Option A: Simple approach (Recommended)**
```bash
# Terminal 1: Start Angular dev server
npm start

# Terminal 2: Start Electron (after Angular shows "compiled successfully")
npm run electron:dev
```

**Option B: Automatic (may timeout on first run)**
```bash
npm run electron:dev:auto
```
This attempts to start both automatically but may timeout during the initial library build.

**Option C: Electron only (if Angular is already running)**
```bash
cd electron-app
npm run dev:electron-only
```

### 3. Building for Production

**Build Angular app first:**
```bash
npm run build
```

**Then build Electron distributables:**
```bash
# All platforms (based on current OS)
npm run electron:build

# Specific platforms
npm run electron:build:win     # Windows (NSIS installer)
npm run electron:build:mac     # macOS (DMG)
npm run electron:build:linux   # Linux (AppImage)
```

Built applications will be in `electron-app/dist/`

## Features

### Desktop Application Features
- **Native Menu Bar**: File, Edit, View, Navigate, Window, Help menus
- **Keyboard Shortcuts**:
  - `Ctrl/Cmd + N`: New Table
  - `Ctrl/Cmd + I`: Import
  - `Ctrl/Cmd + E`: Export
  - `Ctrl/Cmd + 1/2/3`: Navigate to Tables/Templates/Lab Groups
- **File System Integration**: Native save/open dialogs
- **Security**: Context isolation, no node integration in renderer
- **Cross-Platform**: Windows, macOS, Linux support

### Development Features
- **Hot Reloading**: Both Angular and Electron restart on changes
- **DevTools**: Accessible via menu or `F12`
- **Development Mode**: Loads from `localhost:4200`
- **Production Mode**: Loads built Angular files

## Configuration

### Electron Configuration
The Electron app is configured in `electron-app/package.json`:
- App ID: `com.cupcake.vanilla`
- Product Name: `Cupcake Vanilla`
- Supported platforms: Windows (NSIS), macOS (DMG), Linux (AppImage)

### Security
- Context isolation enabled
- Node integration disabled in renderer
- Secure IPC communication via preload script
- External links open in default browser

## Development Tips

1. **Always start Angular dev server first** when developing
2. **Use `npm run electron:dev`** for the best development experience
3. **Build Angular app** before creating production Electron builds
4. **Check electron-app/README.md** for detailed Electron-specific documentation

## Troubleshooting

**Angular dev server not starting:**
- Check if port 4200 is available
- Run `npm start` manually to see errors

**Electron window is blank:**
- Ensure Angular dev server is running at `http://localhost:4200`
- Check DevTools console for errors

**Build fails:**
- Ensure Angular app builds successfully first: `npm run build`
- Check that `dist/cupcake-vanilla-ng/` exists and contains built files

**Menu shortcuts not working:**
- Menu events are sent via IPC to the Angular app
- Check that the Angular app is listening for these events (if implemented)

## Next Steps

To fully integrate the desktop features:
1. Add Angular service to listen for Electron IPC events
2. Implement menu actions (New Table, Import, Export, Navigation)
3. Add desktop-specific features (file associations, notifications)
4. Customize app icons in `electron-app/assets/`
5. Configure auto-updater for production releases