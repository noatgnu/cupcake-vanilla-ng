import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DesktopService } from './desktop';

/**
 * @deprecated Use DesktopService instead. ElectronService is kept for backwards compatibility.
 */
@Injectable({
  providedIn: 'root'
})
export class ElectronService {
  private desktop = inject(DesktopService);

  get isElectron(): boolean {
    return this.desktop.isElectron;
  }

  get isWails(): boolean {
    return this.desktop.isWails;
  }

  get isDesktop(): boolean {
    return this.desktop.isDesktop;
  }

  get platform(): string {
    return this.desktop.platform;
  }

  async getAppVersion(): Promise<string> {
    return this.desktop.getAppVersion();
  }

  async getElectronVersion(): Promise<string> {
    return this.desktop.getRuntimeVersion();
  }

  minimize(): void {
    this.desktop.minimize();
  }

  maximize(): void {
    this.desktop.maximize();
  }

  close(): void {
    this.desktop.close();
  }

  async isMaximized(): Promise<boolean> {
    return this.desktop.isMaximized();
  }

  async showOpenDialog(options?: any): Promise<any> {
    return this.desktop.showOpenDialog(options);
  }

  async showSaveDialog(options?: any): Promise<any> {
    return this.desktop.showSaveDialog(options);
  }

  async showMessageBox(options: any): Promise<any> {
    return this.desktop.showMessageBox(options);
  }

  async downloadFile(url: string, filename?: string): Promise<string> {
    return this.desktop.downloadFile(url, filename);
  }

  async getBackendPort(): Promise<number> {
    return this.desktop.getBackendPort();
  }

  async isBackendReady(): Promise<boolean> {
    return this.desktop.isBackendReady();
  }

  onBackendStatusChange(): Observable<any> {
    return this.desktop.onBackendStatusChange();
  }

  onWindowStateChange(): Observable<'maximized' | 'unmaximized'> {
    return this.desktop.onWindowStateChange();
  }
}
