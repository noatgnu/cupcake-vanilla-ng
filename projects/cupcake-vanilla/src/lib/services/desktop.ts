import { Injectable, NgZone, inject } from '@angular/core';
import { Observable, NEVER, Subject } from 'rxjs';
import { DesktopRuntime, DesktopAPI } from '@noatgnu/cupcake-core';

interface WailsRuntime {
  Call: { ByName: (name: string, ...args: any[]) => Promise<any> };
  Events: { On: (event: string, callback: (data: any) => void) => void };
}

interface WindowWithDesktop extends Window {
  electronAPI?: DesktopAPI & { isElectron: boolean };
  _wails?: any;
}

declare const window: WindowWithDesktop;

@Injectable({
  providedIn: 'root'
})
export class DesktopService {
  private ngZone = inject(NgZone);
  private readonly _runtime: DesktopRuntime;
  private backendStatusSubject = new Subject<any>();
  private windowStateSubject = new Subject<'maximized' | 'unmaximized'>();
  private wailsRuntime: WailsRuntime | null = null;

  constructor() {
    if (this.hasWails()) {
      this._runtime = 'wails';
      this.loadWailsRuntime();
    } else if (this.hasElectron()) {
      this._runtime = 'electron';
    } else {
      this._runtime = 'web';
    }
  }

  private async loadWailsRuntime(): Promise<void> {
    if (this.wailsRuntime) return;
    try {
      const wails = await import('@wailsio/runtime');
      this.wailsRuntime = { Call: wails.Call, Events: wails.Events };
      this.setupWailsListeners();
    } catch {
      this.wailsRuntime = null;
    }
  }

  private hasElectron(): boolean {
    return typeof window !== 'undefined' &&
           window.electronAPI !== undefined &&
           window.electronAPI.isElectron === true;
  }

  private hasWails(): boolean {
    return typeof window !== 'undefined' && '_wails' in window;
  }

  get runtime(): DesktopRuntime {
    return this._runtime;
  }

  get isDesktop(): boolean {
    return this._runtime !== 'web';
  }

  get isElectron(): boolean {
    return this._runtime === 'electron';
  }

  get isWails(): boolean {
    return this._runtime === 'wails';
  }

  get platform(): string {
    if (this._runtime === 'electron' && window.electronAPI) {
      return window.electronAPI.platform;
    }
    return 'web';
  }

  private setupWailsListeners(): void {
    if (!this.hasWails() || !this.wailsRuntime) return;

    this.wailsRuntime.Events.On('backend:status', (event: { name: string; data: unknown }) => {
      this.ngZone.run(() => {
        this.backendStatusSubject.next(event.data || event);
      });
    });
  }

  async getAppVersion(): Promise<string> {
    if (this._runtime === 'electron' && window.electronAPI) {
      return window.electronAPI.getAppVersion();
    }
    if (this._runtime === 'wails' && this.wailsRuntime) {
      return this.wailsRuntime.Call.ByName('main.App.GetAppVersion');
    }
    return '0.0.0';
  }

  async getRuntimeVersion(): Promise<string> {
    if (this._runtime === 'electron' && window.electronAPI) {
      return (window.electronAPI as any).getElectronVersion?.() || 'unknown';
    }
    if (this._runtime === 'wails') {
      return 'wails-v3';
    }
    return 'web';
  }

  minimize(): void {
    if (this._runtime === 'electron' && window.electronAPI) {
      window.electronAPI.minimize();
    }
  }

  maximize(): void {
    if (this._runtime === 'electron' && window.electronAPI) {
      window.electronAPI.maximize();
    }
  }

  close(): void {
    if (this._runtime === 'electron' && window.electronAPI) {
      window.electronAPI.close();
    }
    if (this._runtime === 'wails') {
      window.close();
    }
  }

  async isMaximized(): Promise<boolean> {
    if (this._runtime === 'electron' && window.electronAPI) {
      return window.electronAPI.isMaximized();
    }
    return false;
  }

  async showOpenDialog(options?: any): Promise<any> {
    if (this._runtime === 'electron' && window.electronAPI) {
      return window.electronAPI.showOpenDialog(options);
    }
    if (this._runtime === 'wails' && this.wailsRuntime) {
      return this.wailsRuntime.Call.ByName('main.App.OpenFile', options?.title || 'Select File');
    }
    throw new Error('Not running in desktop environment');
  }

  async showSaveDialog(options?: any): Promise<any> {
    if (this._runtime === 'electron' && window.electronAPI) {
      return window.electronAPI.showSaveDialog(options);
    }
    throw new Error('Not running in desktop environment');
  }

  async showMessageBox(options: any): Promise<any> {
    if (this._runtime === 'electron' && window.electronAPI) {
      return window.electronAPI.showMessageBox(options);
    }
    throw new Error('Not running in desktop environment');
  }

  async downloadFile(url: string, filename?: string): Promise<string> {
    if (this._runtime === 'electron' && window.electronAPI) {
      return window.electronAPI.downloadFile(url, filename);
    }
    throw new Error('Not running in desktop environment');
  }

  async getBackendPort(): Promise<number> {
    if (this._runtime === 'electron' && window.electronAPI) {
      return window.electronAPI.getBackendPort();
    }
    if (this._runtime === 'wails' && this.wailsRuntime) {
      return this.wailsRuntime.Call.ByName('main.App.GetBackendPort');
    }
    return 8000;
  }

  async isBackendReady(): Promise<boolean> {
    if (this._runtime === 'electron' && window.electronAPI) {
      return window.electronAPI.isBackendReady();
    }
    if (this._runtime === 'wails' && this.wailsRuntime) {
      return this.wailsRuntime.Call.ByName('main.App.IsBackendReady');
    }
    return false;
  }

  onBackendStatusChange(): Observable<any> {
    if (this._runtime === 'electron' && window.electronAPI) {
      return new Observable(observer => {
        const unsubscribe = window.electronAPI!.onBackendStatusChange((status: any) => {
          this.ngZone.run(() => observer.next(status));
        });
        return () => unsubscribe();
      });
    }
    if (this._runtime === 'wails') {
      return this.backendStatusSubject.asObservable();
    }
    return NEVER;
  }

  onWindowStateChange(): Observable<'maximized' | 'unmaximized'> {
    if (this._runtime === 'electron' && window.electronAPI) {
      return new Observable(observer => {
        const unsubscribe = window.electronAPI!.onWindowStateChange((state: 'maximized' | 'unmaximized') => {
          this.ngZone.run(() => observer.next(state));
        });
        return () => unsubscribe();
      });
    }
    return this.windowStateSubject.asObservable();
  }

  async logToFile(message: string): Promise<void> {
    if (this._runtime === 'wails' && this.wailsRuntime) {
      return this.wailsRuntime.Call.ByName('main.App.LogToFile', message);
    }
  }
}
