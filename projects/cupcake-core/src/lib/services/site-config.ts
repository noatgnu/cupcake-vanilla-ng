import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { tap } from 'rxjs/operators';
import { BaseApiService } from './base-api';
import { SiteConfig } from '../models/site-config';
import { DemoModeService } from './demo-mode';

@Injectable({
  providedIn: 'root'
})
export class SiteConfigService extends BaseApiService {

  private readonly defaultConfig: SiteConfig = {
    siteName: 'CUPCAKE Vanilla',
    showPoweredBy: true,
    primaryColor: '#1976d2',
    allowUserRegistration: false,
    enableOrcidLogin: false,
    bookingDeletionWindowMinutes: 30,
    whisperCppModel: '/app/whisper.cpp/models/ggml-medium.bin',
    uiFeatures: {},
    uiFeaturesWithDefaults: {
      show_metadata_tables: true,
      show_instruments: true,
      show_sessions: true,
      show_protocols: true,
      show_messages: true,
      show_notifications: true,
      show_storage: true,
      show_webrtc: true,
      show_billing: true
    },
    installedApps: {},
    maxUploadSize: 104857600,
    maxChunkedUploadSize: 2147483648,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  private configSubject = new BehaviorSubject<SiteConfig>(this.defaultConfig);
  public config$ = this.configSubject.asObservable();

  constructor(private demoModeService: DemoModeService) {
    super();
    this.loadConfig();
    this.startPeriodicRefresh();
  }

  private startPeriodicRefresh(): void {
    interval(60000).subscribe(() => {
      this.fetchConfigFromBackend().subscribe({
        next: (config) => {
          this.configSubject.next({ ...this.defaultConfig, ...config });
          localStorage.setItem('site_config', JSON.stringify(config));
          this.handleDemoMode(config);
        },
        error: () => {}
      });
    });
  }

  private loadConfig(): void {
    const savedConfig = localStorage.getItem('site_config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        this.configSubject.next({ ...this.defaultConfig, ...config });
        this.handleDemoMode(config);
      } catch (error) {
        // Invalid config, use defaults
      }
    }

    this.fetchConfigFromBackend().subscribe({
      next: (config) => {
        this.configSubject.next({ ...this.defaultConfig, ...config });
        localStorage.setItem('site_config', JSON.stringify(config));
        this.handleDemoMode(config);
      },
      error: () => {
        // Continue with current config
      }
    });
  }

  refreshConfig(): void {
    this.loadConfig();
  }

  private fetchConfigFromBackend(): Observable<Partial<SiteConfig>> {
    return this.get<Partial<SiteConfig>>(`${this.apiUrl}/site-config/public/`);
  }

  getCurrentConfig(): Observable<SiteConfig> {
    return this.get<SiteConfig>(`${this.apiUrl}/site-config/current/`).pipe(
      tap(config => {
        this.configSubject.next({ ...this.defaultConfig, ...config });
        localStorage.setItem('site_config', JSON.stringify(config));
        this.handleDemoMode(config);
      })
    );
  }

  updateConfig(config: Partial<SiteConfig>): Observable<SiteConfig> {
    return this.put<SiteConfig>(`${this.apiUrl}/site-config/update_config/`, config).pipe(
      tap(updatedConfig => {
        this.configSubject.next({ ...this.defaultConfig, ...updatedConfig });
        localStorage.setItem('site_config', JSON.stringify(updatedConfig));
      })
    );
  }

  getSiteName(): string {
    return this.configSubject.value.siteName;
  }

  shouldShowPoweredBy(): boolean {
    return this.configSubject.value.showPoweredBy !== false;
  }

  getLogoUrl(): string | null {
    const config = this.configSubject.value;
    return config.logoImage || config.logoUrl || null;
  }

  getPrimaryColor(): string {
    return this.configSubject.value.primaryColor || '#1976d2';
  }

  isRegistrationEnabled(): boolean {
    return this.configSubject.value.allowUserRegistration === true;
  }

  isOrcidLoginEnabled(): boolean {
    return this.configSubject.value.enableOrcidLogin === true;
  }

  getAvailableWhisperModels(): Observable<{models: any[], count: number}> {
    return this.get<{models: any[], count: number}>(`${this.apiUrl}/site-config/available_whisper_models/`);
  }

  refreshWhisperModels(): Observable<{status: string, message: string, job_id: string}> {
    return this.post<{status: string, message: string, job_id: string}>(`${this.apiUrl}/site-config/refresh_whisper_models/`, {});
  }

  getWorkerStatus(): Observable<any> {
    return this.get<any>(`${this.apiUrl}/site-config/worker_status/`);
  }

  getMaxUploadSize(): number {
    return this.configSubject.value.maxUploadSize || 104857600;
  }

  getMaxChunkedUploadSize(): number {
    return this.configSubject.value.maxChunkedUploadSize || 2147483648;
  }

  getMaxUploadSizeMB(): number {
    return Math.floor(this.getMaxUploadSize() / 1048576);
  }

  getMaxChunkedUploadSizeMB(): number {
    return Math.floor(this.getMaxChunkedUploadSize() / 1048576);
  }

  private handleDemoMode(config: Partial<SiteConfig>): void {
    if (config.demoMode) {
      this.demoModeService.setDemoMode(true, config.demoCleanupIntervalMinutes || 15);
    } else {
      this.demoModeService.setDemoMode(false);
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  validateFileSize(fileSize: number, isChunked: boolean = false): { valid: boolean; message?: string } {
    const maxSize = isChunked ? this.getMaxChunkedUploadSize() : this.getMaxUploadSize();

    if (fileSize > maxSize) {
      const formattedMaxSize = this.formatFileSize(maxSize);
      const formattedFileSize = this.formatFileSize(fileSize);
      return {
        valid: false,
        message: `File size (${formattedFileSize}) exceeds the maximum allowed size of ${formattedMaxSize}`
      };
    }

    return { valid: true };
  }
}
