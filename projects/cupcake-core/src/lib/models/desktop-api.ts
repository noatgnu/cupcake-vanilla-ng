export type DesktopRuntime = 'electron' | 'wails' | 'web';

export interface DesktopAPI {
  platform: string;
  runtime: DesktopRuntime;

  getAppVersion(): Promise<string>;
  getRuntimeVersion(): Promise<string>;

  minimize(): void;
  maximize(): void;
  close(): void;
  isMaximized(): Promise<boolean>;

  showOpenDialog(options?: any): Promise<any>;
  showSaveDialog(options?: any): Promise<any>;
  showMessageBox(options: any): Promise<any>;
  downloadFile(url: string, filename?: string): Promise<string>;

  getBackendPort(): Promise<number>;
  isBackendReady(): Promise<boolean>;

  onBackendStatusChange(callback: (status: any) => void): () => void;
  onWindowStateChange(callback: (state: 'maximized' | 'unmaximized') => void): () => void;
}

export interface WailsAPI {
  Events: {
    On(eventName: string, callback: (event: any) => void): void;
    Off(eventName: string): void;
    Emit(eventName: string, data?: any): void;
  };
  Call(methodName: string, ...args: any[]): Promise<any>;
}
