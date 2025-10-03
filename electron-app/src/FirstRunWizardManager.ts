import { BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
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

      const task: DownloadTask = {
        title: this.state.installationType === 'portable' ? 'Downloading Portable Backend' : 'Downloading Source Backend',
        description: 'Downloading backend files...',
        execute: async (window) => {
          const downloader = new BackendDownloader(window);

          if (this.state.installationType === 'portable') {
            // For portable, we need to provide options
            const config = this.pythonManager.loadConfig();
            await downloader.downloadPortable({
              version: version || 'latest',
              isPortable: true,
              pythonVersion: config.pythonVersion || '3.11',
              destPath: backendPath
            });
          } else {
            await downloader.downloadSource(backendPath);
          }
        }
      };

      await this.downloaderManager.startDownload(task);
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

      // Task: venv
      this.sendInstallationProgress('venv', 'active', 'Creating virtual environment...');
      if (this.state.installationType === 'source' && this.state.createNewVenv) {
        const config = this.pythonManager.loadConfig();
        const pythonPath = this.state.pythonPath || config.pythonPath!;
        const venvPath = await this.pythonManager.createVirtualEnvironment(pythonPath);
        this.state.venvPath = venvPath;
      } else if (this.state.installationType === 'portable') {
        // For portable, Python is bundled
        const config = this.pythonManager.loadConfig();
        this.state.venvPath = config.pythonPath!;
      }
      this.sendInstallationProgress('venv', 'completed', 'Virtual environment ready');

      // Task: dependencies
      this.sendInstallationProgress('dependencies', 'active', 'Installing dependencies...');
      if (this.state.installationType === 'source') {
        const requirementsPath = path.join(backendDir, 'requirements.txt');
        await this.pythonManager.installDependencies(this.state.venvPath!, requirementsPath);
      }
      this.sendInstallationProgress('dependencies', 'completed', 'Dependencies installed');

      // Task: migrations
      this.sendInstallationProgress('migrations', 'active', 'Running database migrations...');
      await this.backendManager.runMigrations(backendDir, this.state.venvPath!);
      this.sendInstallationProgress('migrations', 'completed', 'Migrations complete');

      // Task: static
      this.sendInstallationProgress('static', 'active', 'Collecting static files...');
      await this.backendManager.collectStaticFiles(backendDir, this.state.venvPath!);
      this.sendInstallationProgress('static', 'completed', 'Static files collected');

      // Task: redis
      this.sendInstallationProgress('redis', 'active', 'Starting Redis server...');
      await this.backendManager.startRedisServer();
      this.sendInstallationProgress('redis', 'completed', 'Redis server running');

      // Task: services
      this.sendInstallationProgress('services', 'active', 'Starting backend services...');
      await this.backendManager.startDjangoServer(backendDir, this.state.venvPath!);
      await this.backendManager.startRQWorker(backendDir, this.state.venvPath!);
      this.sendInstallationProgress('services', 'completed', 'Backend services running');

      this.sendLog('Installation completed successfully', 'success');
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
