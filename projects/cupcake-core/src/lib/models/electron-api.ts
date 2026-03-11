export interface ElectronAPI {
  platform: string;
  isElectron: boolean;

  // App information
  getAppVersion(): Promise<string>;
  getElectronVersion(): Promise<string>;

  // Window controls
  minimize(): void;
  maximize(): void;
  close(): void;
  isMaximized(): Promise<boolean>;

  // File operations
  showOpenDialog(options?: any): Promise<any>;
  showSaveDialog(options?: any): Promise<any>;
  showMessageBox(options: any): Promise<any>;
  downloadFile(url: string, filename?: string): Promise<string>;

  // Backend communication
  getBackendPort(): Promise<number>;
  isBackendReady(): Promise<boolean>;

  // Listeners for events from main process
  onBackendStatusChange(callback: (status: any) => void): () => void;
  onWindowStateChange(callback: (state: 'maximized' | 'unmaximized') => void): () => void;
}
