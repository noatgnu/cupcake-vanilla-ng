import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('wizardAPI', {
  // Navigation
  nextStep: () => ipcRenderer.send('wizard:next-step'),
  previousStep: () => ipcRenderer.send('wizard:previous-step'),
  cancel: () => ipcRenderer.send('wizard:cancel'),

  // Installation type selection
  setInstallationType: (type: 'portable' | 'source') => ipcRenderer.send('wizard:set-installation-type', type),

  // Backend download
  startBackendDownload: (version?: string) => ipcRenderer.send('wizard:start-backend-download', version),

  // Python setup
  setPythonPath: (pythonPath: string) => ipcRenderer.send('wizard:set-python-path', pythonPath),
  browsePythonPath: () => ipcRenderer.invoke('wizard:browse-python-path'),
  setCreateNewVenv: (create: boolean) => ipcRenderer.send('wizard:set-create-new-venv', create),

  // Installation
  startInstallation: () => ipcRenderer.send('wizard:start-installation'),

  // Superuser setup
  createSuperuser: (username: string, email: string, password: string) => ipcRenderer.send('wizard:create-superuser', username, email, password),

  // Database population
  setDatabaseCommands: (commands: any) => ipcRenderer.send('wizard:set-database-commands', commands),
  runDatabaseCommands: () => ipcRenderer.send('wizard:run-database-commands'),

  // Completion
  finish: (launchNow: boolean) => ipcRenderer.send('wizard:finish', launchNow),

  // Listeners
  onStepChanged: (callback: (step: number) => void) => {
    ipcRenderer.on('wizard:step-changed', (_event, step) => callback(step));
  },

  onDownloadProgress: (callback: (data: any) => void) => {
    ipcRenderer.on('wizard:download-progress', (_event, data) => callback(data));
  },

  onInstallationProgress: (callback: (data: any) => void) => {
    ipcRenderer.on('wizard:installation-progress', (_event, data) => callback(data));
  },

  onLog: (callback: (message: string, type: string) => void) => {
    ipcRenderer.on('wizard:log', (_event, message, type) => callback(message, type));
  },

  onError: (callback: (error: string) => void) => {
    ipcRenderer.on('wizard:error', (_event, error) => callback(error));
  }
});
