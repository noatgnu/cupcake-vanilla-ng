import { BrowserWindow, ipcMain } from 'electron';
import { BackendManager } from './BackendManager';
import * as path from 'path';
import * as fs from 'fs';

export class UserManager {
  private backendManager: BackendManager;
  private userDataPath: string;
  private isDev: boolean;

  constructor(backendManager: BackendManager, userDataPath: string, isDev: boolean) {
    this.backendManager = backendManager;
    this.userDataPath = userDataPath;
    this.isDev = isDev;
  }

  async checkAndHandleUsers(pythonPath: string, venvPath: string, parentWindow?: BrowserWindow): Promise<void> {
    try {
      const backendDir = path.join(__dirname, '..', 'backend');
      const userCount = await this.getUserCount(backendDir, venvPath);

      console.log(`[UserManager] Found ${userCount} users in database`);

      if (userCount === 0) {
        console.log('[UserManager] No users found, setting up superuser creation...');
        await this.showSuperuserCreationModal(backendDir, venvPath, parentWindow);
      } else {
        console.log(`[UserManager] Found ${userCount} existing users, no action needed`);
      }
    } catch (error) {
      console.error('[UserManager] Error checking users:', error);
      throw error;
    }
  }

  private async getUserCount(backendDir: string, venvPath: string): Promise<number> {
    const pythonCode = 'from django.contrib.auth.models import User; print(User.objects.count())';
    const output = await this.backendManager.runDjangoShellCommand(backendDir, venvPath, pythonCode);

    // Parse the output to get user count
    const lines = output.trim().split('\n').filter(line => line.trim() !== '');
    const userCountStr = lines[lines.length - 1];
    const userCount = parseInt(userCountStr);

    return isNaN(userCount) ? 0 : userCount;
  }

  private async showSuperuserCreationModal(backendDir: string, venvPath: string, parentWindow?: BrowserWindow): Promise<void> {
    return new Promise<void>((resolve) => {
      let promptWindow: BrowserWindow | null = new BrowserWindow({
        width: 500,
        height: 650,
        modal: true,
        parent: parentWindow,
        show: false,
        resizable: false,
        titleBarStyle: 'hidden',
        titleBarOverlay: process.platform !== 'darwin',
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          preload: path.join(__dirname, 'superuser-modal-preload.js')
        }
      });

      // Load HTML from file
      const htmlPath = path.join(__dirname, 'superuser-modal.html');
      promptWindow.loadFile(htmlPath);

      promptWindow.once('ready-to-show', () => {
        promptWindow.show();
      });

      // Handle superuser creation
      ipcMain.once('create-superuser', async (event, userData) => {
        try {
          await this.createSuperuser(backendDir, venvPath, userData.username, userData.email, userData.password);
          event.reply('superuser-created', true, 'Superuser created successfully');

          // After successful superuser creation, check for schemas and column templates
          setTimeout(async () => {
            if (promptWindow && !promptWindow.isDestroyed()) {
              promptWindow.close();
            }
            await this.showManagementPanelIfNeeded(backendDir, venvPath, parentWindow);
          }, 1000);
        } catch (error) {
          event.reply('superuser-created', false, error.message);
        }
      });

      // Handle cancel
      ipcMain.once('cancel-superuser', () => {
        if (promptWindow && !promptWindow.isDestroyed()) {
          promptWindow.close();
        }
      });

      // Handle close window
      ipcMain.once('close-superuser-window', () => {
        if (promptWindow && !promptWindow.isDestroyed()) {
          promptWindow.close();
        }
      });

      promptWindow.on('closed', () => {
        promptWindow = null;
        resolve();
      });
    });
  }

  private async createSuperuser(backendDir: string, venvPython: string, username: string, email: string, password: string): Promise<void> {
    const pythonCode = `
from django.contrib.auth.models import User
try:
    user = User.objects.create_superuser('${username}', '${email}', '${password}')
    print(f'Superuser "${username}" created successfully')
except Exception as e:
    print(f'Error creating superuser: {e}')
    exit(1)
`;

    const output = await this.backendManager.runDjangoShellCommand(backendDir, venvPython, pythonCode);

    if (!output.includes('created successfully')) {
      throw new Error(`Failed to create superuser: ${output}`);
    }

    console.log(`[UserManager] Superuser "${username}" created successfully`);
  }

  private async showManagementPanelIfNeeded(backendDir: string, venvPath: string, parentWindow?: BrowserWindow): Promise<void> {
    try {
      const needsSchemas = !(await this.backendManager.checkSchemas(backendDir, venvPath));
      const needsColumnTemplates = !(await this.backendManager.checkColumnTemplates(backendDir, venvPath));

      if (needsSchemas || needsColumnTemplates) {
        await this.showManagementPanel(backendDir, venvPath, needsSchemas, needsColumnTemplates, parentWindow);
      }
    } catch (error) {
      console.error('[UserManager] Error checking management requirements:', error);
    }
  }

  async showManagementPanel(backendDir: string, venvPath: string, needsSchemas: boolean, needsColumnTemplates: boolean, parentWindow?: BrowserWindow): Promise<void> {
    return new Promise<void>((resolve) => {
      let managementWindow: BrowserWindow | null = new BrowserWindow({
        width: 600,
        height: 500,
        modal: true,
        parent: parentWindow,
        show: false,
        resizable: false,
        titleBarStyle: 'hidden',
        titleBarOverlay: process.platform !== 'darwin',
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          preload: path.join(__dirname, 'management-panel-preload.js')
        }
      });

      const htmlPath = path.join(__dirname, 'management-panel.html');
      managementWindow.loadFile(htmlPath);

      managementWindow.once('ready-to-show', () => {
        managementWindow.show();
        managementWindow.webContents.send('setup-panel', { needsSchemas, needsColumnTemplates });
      });

      // Handle schema initialization
      ipcMain.once('run-sync-schemas', async (event) => {
        try {
          event.reply('command-progress', 'sync-schemas', 'running', 'Running sync_schemas command...');
          await this.backendManager.runManagementCommand(backendDir, venvPath, 'sync_schemas');
          event.reply('command-progress', 'sync-schemas', 'completed', 'Schema synchronization completed successfully');
        } catch (error) {
          event.reply('command-progress', 'sync-schemas', 'error', `Schema synchronization failed: ${error.message}`);
        }
      });

      // Handle column template initialization
      ipcMain.once('run-load-column-templates', async (event) => {
        try {
          event.reply('command-progress', 'load-column-templates', 'running', 'Running load_column_templates command...');
          await this.backendManager.runManagementCommand(backendDir, venvPath, 'load_column_templates');
          event.reply('command-progress', 'load-column-templates', 'completed', 'Column templates loaded successfully');
        } catch (error) {
          event.reply('command-progress', 'load-column-templates', 'error', `Column templates loading failed: ${error.message}`);
        }
      });

      // Handle skip
      ipcMain.once('skip-management', () => {
        if (managementWindow && !managementWindow.isDestroyed()) {
          managementWindow.close();
        }
      });

      // Handle close window
      ipcMain.once('close-management-window', () => {
        if (managementWindow && !managementWindow.isDestroyed()) {
          managementWindow.close();
        }
      });

      managementWindow.on('closed', () => {
        managementWindow = null;
        resolve();
      });
    });
  }
}
