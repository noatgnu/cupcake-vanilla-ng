import { contextBridge, ipcRenderer } from 'electron';

interface ManagementElectronAPI {
  runSyncSchemas: () => void;
  runLoadColumnTemplates: () => void;
  skipManagement: () => void;
  closeManagementWindow: () => void;

  onSetupPanel: (callback: (event: any, data: { needsSchemas: boolean; needsColumnTemplates: boolean }) => void) => void;
  onCommandProgress: (callback: (event: any, command: string, status: string, message: string) => void) => void;
}

const electronAPI: ManagementElectronAPI = {
  runSyncSchemas: () => ipcRenderer.send('run-sync-schemas'),
  runLoadColumnTemplates: () => ipcRenderer.send('run-load-column-templates'),
  skipManagement: () => ipcRenderer.send('skip-management'),
  closeManagementWindow: () => ipcRenderer.send('close-management-window'),

  onSetupPanel: (callback) => ipcRenderer.on('setup-panel', callback),
  onCommandProgress: (callback) => ipcRenderer.on('command-progress', callback)
};

contextBridge.exposeInMainWorld('managementAPI', electronAPI);

declare global {
  interface Window {
    managementAPI: ManagementElectronAPI;
  }
}