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
        width: 400,
        height: 500,
        modal: true,
        parent: parentWindow,
        show: false,
        frame: false,
        transparent: true,
        resizable: false,
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
}
