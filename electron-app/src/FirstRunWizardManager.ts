import { BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { BackendManager } from './BackendManager';
import { PythonManager } from './PythonManager';
import { UserManager } from './UserManager';
import { BackendDownloader } from './BackendDownloader';
import { DownloaderManager, DownloadTask } from './DownloaderManager';

interface WizardState {
  currentStep: number;
  installationType: 'portable' | 'source';
  backendVersion?: string;
  pythonPath?: string;
  createNewVenv: boolean;
  backendDir?: string;
  venvPath?: string;
  databaseCommands: {
    runSyncSchemas: boolean;
    runLoadColumnTemplates: boolean;
    runLoadSpecies: boolean;
    runLoadTissue: boolean;
    runLoadSubcellular: boolean;
    runLoadMsMod: boolean;
    runLoadMsTerm: boolean;
    runLoadOntologies: boolean;
  };
}

export class FirstRunWizardManager {
  private wizardWindow: BrowserWindow | null = null;
  private state: WizardState;
  private backendManager: BackendManager;
  private pythonManager: PythonManager;
  private userManager: UserManager;
  private downloaderManager: DownloaderManager;
  private userDataPath: string;

  constructor(
    backendManager: BackendManager,
    pythonManager: PythonManager,
    userManager: UserManager,
    userDataPath: string
  ) {
    this.backendManager = backendManager;
    this.pythonManager = pythonManager;
    this.userManager = userManager;
    this.userDataPath = userDataPath;
    this.downloaderManager = new DownloaderManager();

    this.state = {
      currentStep: 1,
      installationType: 'portable',
      createNewVenv: true,
      databaseCommands: {
        runSyncSchemas: true,
        runLoadColumnTemplates: true,
        runLoadSpecies: true,
        runLoadTissue: true,
        runLoadSubcellular: true,
        runLoadMsMod: true,
        runLoadMsTerm: true,
        runLoadOntologies: false // Not pre-selected (largest download)
      }
    };

    this.setupIpcHandlers();
  }

  private setupIpcHandlers(): void {
    // Navigation
    ipcMain.on('wizard:next-step', () => this.nextStep());
    ipcMain.on('wizard:previous-step', () => this.previousStep());
    ipcMain.on('wizard:cancel', () => this.cancel());

    // Installation type
    ipcMain.on('wizard:set-installation-type', (_event, type: 'portable' | 'source') => {
      this.state.installationType = type;
    });

    // Backend download
    ipcMain.on('wizard:start-backend-download', async (_event, version?: string) => {
      await this.startBackendDownload(version);
    });

    // Python setup
    ipcMain.on('wizard:set-python-path', (_event, pythonPath: string) => {
      this.state.pythonPath = pythonPath;
    });

    ipcMain.handle('wizard:browse-python-path', async () => {
      const result = dialog.showOpenDialogSync(this.wizardWindow!, {
        properties: ['openFile'],
        filters: [{ name: 'Python Executable', extensions: ['exe', 'py'] }]
      });
      if (result && result.length > 0) {
        return result[0];
      }
      return undefined;
    });

    ipcMain.on('wizard:set-create-new-venv', (_event, create: boolean) => {
      this.state.createNewVenv = create;
    });

    // Installation
    ipcMain.on('wizard:start-installation', async () => {
      await this.startInstallation();
    });

    // Superuser
    ipcMain.on('wizard:create-superuser', async (_event, username: string, email: string, password: string) => {
      await this.createSuperuser(username, email, password);
    });

    // Database commands
    ipcMain.on('wizard:set-database-commands', (_event, commands: any) => {
      this.state.databaseCommands = { ...this.state.databaseCommands, ...commands };
    });

    ipcMain.on('wizard:run-database-commands', async () => {
      await this.runDatabaseCommands();
    });

    // Finish
    ipcMain.on('wizard:finish', async (_event, launchNow: boolean) => {
      await this.finish(launchNow);
    });
  }

  public async showWizard(): Promise<void> {
    this.wizardWindow = new BrowserWindow({
      width: 900,
      height: 700,
      webPreferences: {
        preload: path.join(__dirname, 'first-run-wizard-preload.js'),
        nodeIntegration: false,
        contextIsolation: true
      },
      resizable: false,
      frame: false,
      show: false
    });

    await this.wizardWindow.loadFile(path.join(__dirname, 'first-run-wizard.html'));
    this.wizardWindow.show();

    this.wizardWindow.on('closed', () => {
      this.wizardWindow = null;
    });
  }

  private nextStep(): void {
    if (this.state.currentStep < 7) {
      this.state.currentStep++;
      this.sendStepChange();
    }
  }

  private previousStep(): void {
    if (this.state.currentStep > 1) {
      this.state.currentStep--;
      this.sendStepChange();
    }
  }

  private cancel(): void {
    const choice = dialog.showMessageBoxSync(this.wizardWindow!, {
      type: 'question',
      buttons: ['Yes, Cancel', 'No, Continue'],
      title: 'Cancel Installation',
      message: 'Are you sure you want to cancel the installation?'
    });

    if (choice === 0) {
      this.wizardWindow?.close();
    }
  }

  private sendStepChange(): void {
    this.wizardWindow?.webContents.send('wizard:step-changed', this.state.currentStep);
  }

  private sendLog(message: string, type: string = 'info'): void {
    this.wizardWindow?.webContents.send('wizard:log', message, type);
  }

  private sendError(error: string): void {
    this.wizardWindow?.webContents.send('wizard:error', error);
  }

  private async startBackendDownload(version?: string): Promise<void> {
    try {
      this.sendLog('Starting backend download...', 'info');

      const backendPath = path.join(this.userDataPath, 'backend');
      this.state.backendDir = backendPath;

      if (this.state.installationType === 'portable') {
        // Get latest release tag first
        const tempDownloader = new BackendDownloader();
        const releases = await tempDownloader.getAvailableReleases();

        if (releases.length === 0) {
          throw new Error('No backend releases found on GitHub');
        }

        const latestRelease = releases[0];
        this.sendLog(`Found latest release: ${latestRelease.tag}`, 'info');

        const task: DownloadTask = {
          title: 'Downloading Portable Backend',
          description: `Downloading Cupcake Vanilla Backend ${latestRelease.tag}`,
          execute: async (window) => {
            const downloader = new BackendDownloader(window);
            await downloader.downloadPortable({
              version: latestRelease.tag,
              isPortable: true,
              pythonVersion: '3.11',
              destPath: backendPath
            });
          }
        };

        await this.downloaderManager.startDownload(task);

        // For portable, set the Python path from the bundled Python
        const portablePython = path.join(
          backendPath,
          'python',
          process.platform === 'win32' ? 'python.exe' : 'bin/python3'
        );

        if (fs.existsSync(portablePython)) {
          this.state.pythonPath = portablePython;
          this.sendLog(`Using portable Python: ${portablePython}`, 'info');

          // Save to config
          const config = this.pythonManager.loadConfig();
          config.pythonPath = portablePython;

          // Detect Python version
          try {
            const result = await this.pythonManager.verifyPython(portablePython);
            config.pythonVersion = result.version;
            this.sendLog(`Detected portable Python version: ${result.version}`, 'info');
          } catch (error: any) {
            this.sendLog(`Warning: Failed to detect Python version: ${error.message}`, 'warning');
          }

          this.pythonManager.saveConfig(config);
        } else {
          throw new Error('Portable Python not found after download');
        }
      } else {
        // Source download
        const task: DownloadTask = {
          title: 'Downloading Source Backend',
          description: 'Cloning backend repository...',
          execute: async (window) => {
            const downloader = new BackendDownloader(window);
            await downloader.downloadSource(backendPath);
          }
        };

        await this.downloaderManager.startDownload(task);
      }

      this.sendLog('Backend downloaded successfully', 'success');
      this.nextStep();
    } catch (error: any) {
      this.sendLog(`Error downloading backend: ${error.message}`, 'error');
      this.sendError(error.message);
    }
  }

  private async startInstallation(): Promise<void> {
    try {
      const backendDir = this.state.backendDir!;

      // Determine if this is a portable backend
      const backendDownloader = new BackendDownloader();
      const isPortable = backendDownloader.isPortableBackend(backendDir);

      // Save Python configuration
      const config = this.pythonManager.loadConfig();
      const pythonPath = this.state.pythonPath || config.pythonPath!;
      config.pythonPath = pythonPath;
      this.pythonManager.saveConfig(config);

      // Task: venv
      this.sendInstallationProgress('venv', 'active', 'Setting up virtual environment...');
      if (isPortable) {
        // Portable backend has venv bundled
        this.state.venvPath = pythonPath;
        this.sendLog('Using bundled portable virtual environment', 'info');
      } else if (this.state.createNewVenv) {
        this.state.venvPath = await this.pythonManager.createVirtualEnvironment(pythonPath);
        this.sendLog('Created new virtual environment', 'info');
      } else {
        const existingVenv = this.pythonManager.checkVirtualEnvironment();
        if (!existingVenv) {
          throw new Error('No existing virtual environment found');
        }
        this.state.venvPath = existingVenv;
        this.sendLog('Using existing virtual environment', 'info');
      }
      this.sendInstallationProgress('venv', 'completed', 'Virtual environment ready');

      // Task: dependencies
      this.sendInstallationProgress('dependencies', 'active', 'Installing dependencies...');
      if (!isPortable) {
        const requirementsPath = path.join(backendDir, 'requirements.txt');
        await this.pythonManager.installDependencies(this.state.venvPath!, requirementsPath);
        this.sendLog('All dependencies installed successfully', 'info');
      } else {
        this.sendLog('Skipping dependency installation for portable backend', 'info');
      }
      this.sendInstallationProgress('dependencies', 'completed', 'Dependencies ready');

      // Task: migrations
      this.sendInstallationProgress('migrations', 'active', 'Running database migrations...');
      await this.backendManager.runMigrations(backendDir, this.state.venvPath!);
      this.sendInstallationProgress('migrations', 'completed', 'Migrations complete');

      // Task: static
      this.sendInstallationProgress('static', 'active', 'Collecting static files...');
      await this.backendManager.collectStaticFiles(backendDir, this.state.venvPath!);
      this.sendInstallationProgress('static', 'completed', 'Static files collected');

      // Cleanup orphaned processes
      this.sendLog('Cleaning up orphaned processes...', 'info');
      await this.backendManager.killOrphanedDjangoProcesses();

      // Task: redis
      this.sendInstallationProgress('redis', 'active', 'Starting Redis server...');
      try {
        await this.backendManager.startRedisServer();
        this.sendInstallationProgress('redis', 'completed', 'Redis server running');
      } catch (error: any) {
        if (error.message === 'REDIS_NOT_FOUND_WINDOWS') {
          this.sendLog('Redis not found on Windows, prompting for download...', 'warning');

          const choice = dialog.showMessageBoxSync(this.wizardWindow!, {
            type: 'question',
            buttons: ['Download Redis', 'Cancel'],
            title: 'Redis Not Found',
            message: 'Redis server is required but not installed.',
            detail: 'Would you like to download and install Redis for Windows?'
          });

          if (choice === 0) {
            const redisDir = this.backendManager.getRedisManager().getRedisDir();
            this.sendLog(`Downloading Redis to: ${redisDir}`, 'info');

            const task: DownloadTask = {
              title: 'Downloading Redis',
              description: 'Downloading Redis for Windows',
              execute: async (window) => {
                const { ValkeyDownloader } = await import('./ValkeyDownloader');
                const downloader = new ValkeyDownloader(window);
                await downloader.downloadValkey(redisDir);
              }
            };

            await this.downloaderManager.startDownload(task);

            // Retry starting Redis after download
            this.sendLog('Retrying Redis startup after download...', 'info');
            await this.backendManager.startRedisServer();
            this.sendInstallationProgress('redis', 'completed', 'Redis server running');
          } else {
            throw new Error('Redis is required to run the application');
          }
        } else {
          throw error;
        }
      }

      // Task: services
      this.sendInstallationProgress('services', 'active', 'Starting backend services...');
      await this.backendManager.startDjangoServer(backendDir, this.state.venvPath!);
      await this.backendManager.startRQWorker(backendDir, this.state.venvPath!);
      this.sendInstallationProgress('services', 'completed', 'Backend services running');

      this.sendLog('All services started successfully!', 'success');
      this.nextStep();
    } catch (error: any) {
      this.sendLog(`Installation error: ${error.message}`, 'error');
      this.sendError(error.message);
    }
  }

  private sendInstallationProgress(task: string, status: string, message: string): void {
    this.wizardWindow?.webContents.send('wizard:installation-progress', { task, status, message });
  }

  private async createSuperuser(username: string, email: string, password: string): Promise<void> {
    try {
      this.sendLog('Creating superuser...', 'info');

      // Use UserManager's superuser creation modal - it will handle creation
      await (this.userManager as any).showSuperuserCreationModal(this.state.backendDir!, this.state.venvPath!, this.wizardWindow!);

      this.sendLog('Superuser created successfully', 'success');
      this.nextStep();
    } catch (error: any) {
      this.sendLog(`Error creating superuser: ${error.message}`, 'error');
      this.sendError(error.message);
    }
  }

  private async runDatabaseCommands(): Promise<void> {
    try {
      // Use UserManager's management panel to run the commands
      // Show the management panel with selected commands
      await this.userManager.showManagementPanel(
        this.state.backendDir!,
        this.state.venvPath!,
        !this.state.databaseCommands.runSyncSchemas,
        !this.state.databaseCommands.runLoadColumnTemplates,
        this.wizardWindow!
      );

      this.sendLog('Database population completed', 'success');
      this.nextStep();
    } catch (error: any) {
      this.sendLog(`Error populating database: ${error.message}`, 'error');
      this.sendError(error.message);
    }
  }

  private async finish(launchNow: boolean): Promise<void> {
    this.wizardWindow?.close();

    // Signal to main process that wizard is complete
    if (this.wizardWindow?.webContents) {
      this.wizardWindow.webContents.send('wizard:complete', launchNow);
    }
  }

  public getState(): WizardState {
    return this.state;
  }
}
