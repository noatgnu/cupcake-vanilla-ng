import { app, BrowserWindow, Menu, shell, dialog, ipcMain } from 'electron';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { PythonManager, Config, PythonCandidate, ValidationResult } from './PythonManager';
import { BackendManager, BackendStatus, LogMessage } from './BackendManager';
import { UserManager } from './UserManager';

// Keep a global reference of the window objects
let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;
let backendPort: number = 8000;
let backendReady: boolean = false;
let splashReady: boolean = false;
let pythonPath: string | null = null;
let venvPath: string | null = null;

// Configuration storage paths
const userDataPath: string = app.getPath('userData');
const configPath: string = path.join(userDataPath, 'cupcake-config.json');

// Initialize Python Manager
const pythonManager = new PythonManager();

// Initialize Backend Manager
const isDev: boolean = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');
const backendManager = new BackendManager(userDataPath, isDev);

// Initialize User Manager
const userManager = new UserManager(backendManager, userDataPath, isDev);

// Configuration
const allowSelfSignedCerts: boolean = isDev || process.argv.includes('--allow-self-signed');

// Allow self-signed certificates when needed
if (allowSelfSignedCerts) {
  console.log('Allowing self-signed certificates...');
  app.commandLine.appendSwitch('ignore-certificate-errors');
  app.commandLine.appendSwitch('ignore-ssl-errors');
  app.commandLine.appendSwitch('ignore-certificate-errors-spki-list');
  app.commandLine.appendSwitch('ignore-urlfetcher-cert-requests');
}

// Helper function to send status updates to splash screen
function sendBackendStatus(service: string, status: 'starting' | 'ready' | 'error', message: string): void {
  console.log(`[${service}] ${status}: ${message}`);
  if (splashWindow && !splashWindow.isDestroyed() && splashReady) {
    const backendStatus: BackendStatus = { service, status, message };
    splashWindow.webContents.send('backend-status', backendStatus);
  }
}

// Helper function to send log messages to splash screen
function sendBackendLog(message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info'): void {
  console.log(`[LOG] ${message}`);
  if (splashWindow && !splashWindow.isDestroyed() && splashReady) {
    const logMessage: LogMessage = { message, type };
    splashWindow.webContents.send('backend-log', logMessage);
  }
}


async function createVirtualEnvironmentWithLogging(pythonCmd: string): Promise<string> {
  sendBackendStatus('venv', 'starting', 'Creating virtual environment...');
  sendBackendLog('Creating virtual environment in user data directory...');

  try {
    const venvPython = await pythonManager.createVirtualEnvironment(pythonCmd);
    sendBackendStatus('venv', 'ready', 'Virtual environment created');
    sendBackendLog(`Virtual environment created successfully`, 'success');
    return venvPython;
  } catch (error) {
    sendBackendStatus('venv', 'error', `Virtual environment creation failed: ${error.message}`);
    throw error;
  }
}

// Helper function to get backend directory path
function getBackendPath(): string {
  if (isDev) {
    // Development: backend is in electron-app/backend
    return path.join(__dirname, '..', 'backend');
  } else {
    // Production: backend is packaged in resources/backend
    return path.join(process.resourcesPath, 'backend');
  }
}

async function installDependenciesWithLogging(backendDir: string, venvPython: string): Promise<void> {
  sendBackendStatus('dependencies', 'starting', 'Installing Python dependencies...');
  sendBackendLog('Installing dependencies in virtual environment...');

  const requirementsPath = path.join(backendDir, 'requirements.txt');

  if (fs.existsSync(requirementsPath)) {
    sendBackendLog('Found requirements.txt, installing dependencies with pip...');
    try {
      await pythonManager.installDependencies(venvPython, requirementsPath);
      sendBackendStatus('dependencies', 'ready', 'Dependencies installation completed');
      sendBackendLog('All dependencies installed successfully with pip', 'success');
    } catch (error) {
      sendBackendStatus('dependencies', 'error', `Dependency installation error: ${error.message}`);
      throw error;
    }
  } else {
    sendBackendStatus('dependencies', 'error', 'requirements.txt not found');
    throw new Error('requirements.txt not found');
  }
}



// Classify process output messages based on content
function classifyProcessOutput(output: string, isStderr: boolean = false): string {
  const lowerOutput = output.toLowerCase();

  // Always treat actual errors as errors
  if (lowerOutput.includes('error:') ||
      lowerOutput.includes('exception') ||
      lowerOutput.includes('traceback') ||
      lowerOutput.includes('failed') ||
      lowerOutput.includes('critical:')) {
    return 'error';
  }

  // Django-specific informational messages that go to stderr but are not errors
  if (lowerOutput.includes('watching for file changes') ||
      lowerOutput.includes('performing system checks') ||
      lowerOutput.includes('system check identified no issues') ||
      lowerOutput.includes('starting development server') ||
      lowerOutput.includes('quit the server') ||
      lowerOutput.includes('django version') ||
      lowerOutput.includes('autoreload')) {
    return 'info';
  }

  // RQ-specific informational messages that go to stderr but are not errors
  if (lowerOutput.includes('worker started') ||
      lowerOutput.includes('listening on') ||
      lowerOutput.includes('worker rq:worker:') ||
      lowerOutput.includes('cleaned registry') ||
      lowerOutput.includes('worker registered successfully')) {
    return 'info';
  }

  // Warning indicators
  if (lowerOutput.includes('warning:') ||
      lowerOutput.includes('deprecated') ||
      lowerOutput.includes('ignore')) {
    return 'warning';
  }

  // Success indicators
  if (lowerOutput.includes('successfully') ||
      lowerOutput.includes('completed') ||
      lowerOutput.includes('ready') ||
      lowerOutput.includes('started')) {
    return 'success';
  }

  // Default classification: stderr messages that don't match patterns above are warnings
  return isStderr ? 'warning' : 'info';
}





// Create splash window
function createSplashWindow(): void {
  console.log('Creating splash window...');

  splashWindow = new BrowserWindow({
    width: 600,
    height: 500,
    show: false,
    frame: false,
    alwaysOnTop: false,
    resizable: false,
    transparent: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'splash-preload.js')
    }
  });

  const splashPath = path.join(__dirname, 'splash.html');
  splashWindow.loadFile(splashPath);

  splashWindow.once('ready-to-show', async () => {
    console.log('Splash window ready to show');
    splashReady = true;
    splashWindow.show();

    // Set up BackendManager with splash window
    backendManager.setSplashWindow(splashWindow);

    // Check if we have valid saved configuration
    const hasValidConfig = await pythonManager.isConfigurationValid();
    if (hasValidConfig) {
      // Use saved configuration and start services directly
      const config = pythonManager.loadConfig();
      sendBackendLog(`Using saved Python: ${config.pythonPath}`, 'success');
      initializeBackend(false, config.pythonPath);
    } else {
      // Show Python selection dialog
      showPythonSelectionDialog();
    }
  });

  splashWindow.on('closed', () => {
    splashWindow = null;
    if (!mainWindow) {
      app.quit();
    }
  });
}

// Show Python selection dialog
async function showPythonSelectionDialog(): Promise<void> {
  sendBackendLog('Detecting Python installations...', 'info');
  const candidates = await pythonManager.detectPythonCandidates();

  let buttons = [];
  let message = 'Choose Python installation for Cupcake Vanilla:\n\n';

  if (candidates.length > 0) {
    candidates.forEach((python, index) => {
      buttons.push(`Use ${python.version}`);
      message += `${index + 1}. ${python.version} (${python.command})\n`;
    });
    message += '\n';
  } else {
    message += 'No suitable Python 3.11+ installations found automatically.\n\n';
  }

  buttons.push('Browse for Python...', 'Cancel');

  const choice = dialog.showMessageBoxSync(splashWindow, {
    type: 'question',
    buttons: buttons,
    defaultId: 0,
    cancelId: buttons.length - 1,
    title: 'Select Python Installation',
    message: 'Choose Python installation for Cupcake Vanilla:',
    detail: message + 'Python 3.11 or higher is required.'
  });

  if (choice < candidates.length) {
    // User selected a detected Python
    const selectedPython = candidates[choice];
    sendBackendLog(`Selected Python: ${selectedPython.version}`, 'success');
    showEnvironmentSetupDialog(selectedPython.command);
  } else if (choice === candidates.length) {
    // User wants to browse for Python
    const result = dialog.showOpenDialogSync(splashWindow, {
      title: 'Select Python Executable',
      filters: [
        { name: 'Python Executable', extensions: process.platform === 'win32' ? ['exe'] : [''] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (result && result.length > 0) {
      const pythonPath = result[0];
      sendBackendLog(`Verifying selected Python: ${pythonPath}`, 'info');

      const verification = await pythonManager.verifyPython(pythonPath);
      if (verification.valid) {
        sendBackendLog(`Selected Python: ${verification.version}`, 'success');
        showEnvironmentSetupDialog(pythonPath);
      } else {
        dialog.showErrorBox('Invalid Python', `The selected Python installation is not valid or is older than 3.11.\n\nFound: ${verification.version}\nRequired: Python 3.11+`);
        showPythonSelectionDialog(); // Try again
      }
    } else {
      showPythonSelectionDialog(); // Try again
    }
  } else {
    // Cancel - close splash window
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
    }
  }
}

// Show environment setup dialog
function showEnvironmentSetupDialog(selectedPython: string): void {
  const choice = dialog.showMessageBoxSync(splashWindow, {
    type: 'question',
    buttons: ['Create Virtual Environment', 'Use Existing Virtual Environment', 'Cancel'],
    defaultId: 0,
    cancelId: 2,
    title: 'Python Environment Setup',
    message: 'Choose how to set up the Python environment for Cupcake Vanilla:',
    detail: `Using Python: ${selectedPython}\n\nA virtual environment is recommended to avoid conflicts with your system Python packages.`
  });

  if (choice === 0) {
    // Create new virtual environment
    initializeBackend(true, selectedPython);
  } else if (choice === 1) {
    // Use existing virtual environment
    initializeBackend(false, selectedPython);
  } else {
    // Cancel - close splash window
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
    }
  }
}

// Main window creation
function createWindow(): void {
  console.log('Creating main window...');

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: !isDev
    }
  });

  // Always load Angular application (dev server in development, compiled files in production)
  const startUrl = isDev ? 'http://localhost:4200' : 'file://' + path.join(__dirname, '..', 'web-dist', 'index.html');
  console.log(`Loading main application from: ${startUrl}`);

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.once('ready-to-show', async () => {
    mainWindow.show();
    backendReady = true;

    // Check for Django users and show superuser creation modal if needed
    try {
      const config = pythonManager.loadConfig();
      if (config.pythonPath && venvPath) {
        // Use UserManager to handle user checking and superuser creation
        await userManager.checkAndHandleUsers(config.pythonPath, venvPath, mainWindow);
      }
    } catch (error) {
      console.error('Error checking users:', error);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Initialize backend services
async function initializeBackend(createNewVenv: boolean = true, selectedPython: string | null = null): Promise<void> {
  try {
    sendBackendLog('Initializing Cupcake Vanilla backend services...', 'info');

    // Step 1: Use selected Python
    if (!selectedPython) {
      sendBackendStatus('python', 'error', 'No Python selected');
      dialog.showErrorBox('Python Not Selected', 'Please select a Python installation to continue.');
      return;
    }

    pythonPath = selectedPython;
    sendBackendStatus('python', 'ready', `Using Python: ${pythonPath}`);

    // Save the selected Python to configuration
    const config = pythonManager.loadConfig();
    config.pythonPath = pythonPath;
    pythonManager.saveConfig(config);

    // Get correct backend directory path based on environment
    const backendDir = getBackendPath();

    // Verify backend directory exists
    if (!fs.existsSync(backendDir)) {
      throw new Error(`Backend directory not found: ${backendDir}`);
    }

    sendBackendLog(`Using backend directory: ${backendDir}`, 'info');

    // Step 2: Handle virtual environment
    if (createNewVenv) {
      venvPath = await createVirtualEnvironmentWithLogging(pythonPath);
    } else {
      venvPath = pythonManager.checkVirtualEnvironment();
      if (!venvPath) {
        sendBackendStatus('venv', 'error', 'No existing virtual environment found');
        dialog.showErrorBox('Virtual Environment Not Found', 'No existing virtual environment found. Please create one first.');
        return;
      }
      sendBackendStatus('venv', 'ready', 'Using existing virtual environment');
      sendBackendLog('Using existing virtual environment', 'success');
    }

    // Step 3: Install dependencies
    await installDependenciesWithLogging(backendDir, venvPath);
    sendBackendLog('All dependencies installed successfully', 'success');
    console.log('[DEBUG] Dependencies completed, starting migrations...');
    console.log("test")
    // Step 4: Run migrations using BackendManager
    console.log('[DEBUG] About to run migrations...');
    await backendManager.runMigrations(backendDir, venvPath);
    sendBackendLog('Database migrations completed successfully', 'success');
    console.log('[DEBUG] Migrations completed, starting static files...');

    // Step 5: Collect static files
    console.log('[DEBUG] About to collect static files...');
    await backendManager.collectStaticFiles(backendDir, venvPath);
    console.log('[DEBUG] Static files completed, starting Django server...');

    // Step 6: Start Django server
    console.log('[DEBUG] About to start Django server...');
    await backendManager.startDjangoServer(backendDir, venvPath);
    console.log('[DEBUG] Django server started, starting RQ worker...');

    // Step 7: Start RQ worker
    console.log('[DEBUG] About to start RQ worker...');
    await backendManager.startRQWorker(backendDir, venvPath);
    console.log('[DEBUG] RQ worker started, all services ready!');

    // All services ready - auto-transition to main app
    sendBackendLog('All services started successfully!', 'success');

    setTimeout(() => {
      if (splashWindow && !splashWindow.isDestroyed()) {
        console.log('Auto-transitioning to main application...');
        splashWindow.close();
        createWindow();
      }
    }, 1500);

  } catch (error) {
    console.error('Backend initialization error:', error);
    sendBackendLog(`Backend initialization error: ${error.message}`, 'error');
    dialog.showErrorBox('Backend Error', `Failed to start backend services: ${error.message}`);
  }
}

// Handle splash continue button
ipcMain.on('splash-continue', () => {
  console.log('Manual continue requested from splash screen');
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close();
    createWindow();
  }
});

// Handle splash window controls
ipcMain.on('splash-minimize', () => {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.minimize();
  }
});

ipcMain.on('splash-close', () => {
  console.log('Splash window close requested');
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close();
  }
  // Clean up and quit the application
  backendManager.stopServices();
  app.quit();
});

// App event handlers
app.whenReady().then(() => {
  createSplashWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      if (backendReady) {
        createWindow();
      } else {
        createSplashWindow();
      }
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Kill backend processes before quitting
    backendManager.stopServices();
    app.quit();
  }
});

app.on('before-quit', () => {
  // Kill backend processes
  backendManager.stopServices();
});

// Menu setup
function createMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        process.platform === 'darwin' ? { role: 'close' } : { role: 'quit' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  createMenu();
});
