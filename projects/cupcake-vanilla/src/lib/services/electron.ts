import { Injectable } from '@angular/core';
import { Observable, NEVER } from 'rxjs';
import { ElectronAPI } from '@noatgnu/cupcake-core';

interface WindowWithElectron extends Window {
  electronAPI?: ElectronAPI;
}

@Injectable({
  providedIn: 'root'
})
export class ElectronService {
  private electronAPI: ElectronAPI | null = null;

  constructor() {
    this.electronAPI = (window as unknown as WindowWithElectron).electronAPI || null;
  }

  get isElectron(): boolean {
    return this.electronAPI?.isElectron ?? false;
  }

  get platform(): string {
    return this.electronAPI?.platform ?? 'web';
  }

  async getAppVersion(): Promise<string> {
    if (!this.electronAPI) throw new Error('Not running in Electron');
    return this.electronAPI.getAppVersion();
  }

  async getElectronVersion(): Promise<string> {
    if (!this.electronAPI) throw new Error('Not running in Electron');
    return this.electronAPI.getElectronVersion();
  }

  minimize(): void {
    if (!this.electronAPI) return;
    this.electronAPI.minimize();
  }

  maximize(): void {
    if (!this.electronAPI) return;
    this.electronAPI.maximize();
  }

  close(): void {
    if (!this.electronAPI) return;
    this.electronAPI.close();
  }

  async isMaximized(): Promise<boolean> {
    if (!this.electronAPI) return false;
    return this.electronAPI.isMaximized();
  }

  async showOpenDialog(options?: any): Promise<any> {
    if (!this.electronAPI) throw new Error('Not running in Electron');
    return this.electronAPI.showOpenDialog(options);
  }

  async showSaveDialog(options?: any): Promise<any> {
    if (!this.electronAPI) throw new Error('Not running in Electron');
    return this.electronAPI.showSaveDialog(options);
  }

  async showMessageBox(options: any): Promise<any> {
    if (!this.electronAPI) throw new Error('Not running in Electron');
    return this.electronAPI.showMessageBox(options);
  }

  async downloadFile(url: string, filename?: string): Promise<string> {
    if (!this.electronAPI) throw new Error('Not running in Electron');
    return this.electronAPI.downloadFile(url, filename);
  }

  async getBackendPort(): Promise<number> {
    if (!this.electronAPI) throw new Error('Not running in Electron');
    return this.electronAPI.getBackendPort();
  }

  async isBackendReady(): Promise<boolean> {
    if (!this.electronAPI) return false;
    return this.electronAPI.isBackendReady();
  }

  onBackendStatusChange(): Observable<any> {
    if (!this.electronAPI) return NEVER;

    return new Observable(observer => {
      const unsubscribe = this.electronAPI!.onBackendStatusChange((status: any) => {
        observer.next(status);
      });

      return () => unsubscribe();
    });
  }

  onWindowStateChange(): Observable<'maximized' | 'unmaximized'> {
    if (!this.electronAPI) return NEVER;

    return new Observable(observer => {
      const unsubscribe = this.electronAPI!.onWindowStateChange((state: 'maximized' | 'unmaximized') => {
        observer.next(state);
      });

      return () => unsubscribe();
    });
  }
}