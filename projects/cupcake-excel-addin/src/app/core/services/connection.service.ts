import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export type ConnectionMode = 'cloud' | 'local';

export interface ConnectionConfig {
  mode: ConnectionMode;
  cloudUrl: string;
  localUrl: string;
}

const STORAGE_KEY = environment.storageKey;
const DEFAULT_CLOUD_URL = environment.defaultCloudUrl;
const DEFAULT_LOCAL_URL = environment.defaultLocalUrl;
const DEFAULT_MODE = environment.defaultMode;

export const OFFICIAL_CLOUD_URL = DEFAULT_CLOUD_URL;

@Injectable({
  providedIn: 'root'
})
export class ConnectionService {
  private _mode = signal<ConnectionMode>(DEFAULT_MODE);
  private _cloudUrl = signal<string>(DEFAULT_CLOUD_URL);
  private _localUrl = signal<string>(DEFAULT_LOCAL_URL);
  private _isConnected = signal<boolean>(false);
  private _isChecking = signal<boolean>(false);

  readonly mode = this._mode.asReadonly();
  readonly cloudUrl = this._cloudUrl.asReadonly();
  readonly localUrl = this._localUrl.asReadonly();
  readonly isConnected = this._isConnected.asReadonly();
  readonly isChecking = this._isChecking.asReadonly();

  readonly baseUrl = computed(() => {
    return this._mode() === 'cloud' ? this._cloudUrl() : this._localUrl();
  });

  constructor(private http: HttpClient) {
    this.loadConfig();
    (window as any).__connectionService = this;
  }

  private loadConfig(): void {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const config: ConnectionConfig = JSON.parse(stored);
        this._mode.set(config.mode);
        this._cloudUrl.set(config.cloudUrl || DEFAULT_CLOUD_URL);
        this._localUrl.set(config.localUrl || DEFAULT_LOCAL_URL);
      } catch {
        this.saveConfig();
      }
    }
  }

  private saveConfig(): void {
    const config: ConnectionConfig = {
      mode: this._mode(),
      cloudUrl: this._cloudUrl(),
      localUrl: this._localUrl()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }

  setMode(mode: ConnectionMode): void {
    this._mode.set(mode);
    this.saveConfig();
  }

  setCloudUrl(url: string): void {
    this._cloudUrl.set(url);
    this.saveConfig();
  }

  setLocalUrl(url: string): void {
    this._localUrl.set(url);
    this.saveConfig();
  }

  resetCloudUrl(): void {
    this._cloudUrl.set(DEFAULT_CLOUD_URL);
    this.saveConfig();
  }

  resetLocalUrl(): void {
    this._localUrl.set(DEFAULT_LOCAL_URL);
    this.saveConfig();
  }

  isOfficialCloudUrl(): boolean {
    return this._cloudUrl() === DEFAULT_CLOUD_URL;
  }

  getDefaultCloudUrl(): string {
    return DEFAULT_CLOUD_URL;
  }

  getDefaultLocalUrl(): string {
    return DEFAULT_LOCAL_URL;
  }

  async testConnection(): Promise<boolean> {
    this._isChecking.set(true);
    try {
      const url = `${this.baseUrl()}/auth/status/`;
      await firstValueFrom(this.http.get(url, { observe: 'response' }));
      this._isConnected.set(true);
      return true;
    } catch {
      this._isConnected.set(false);
      return false;
    } finally {
      this._isChecking.set(false);
    }
  }

  async detectLocalBackend(): Promise<boolean> {
    try {
      const url = `${this._localUrl()}/auth/status/`;
      await firstValueFrom(this.http.get(url, { observe: 'response' }));
      return true;
    } catch {
      return false;
    }
  }
}
