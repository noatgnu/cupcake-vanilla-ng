import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { BaseApiService } from './base-api';
import { SiteConfig } from '../models/site-config';

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
    installedApps: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  private configSubject = new BehaviorSubject<SiteConfig>(this.defaultConfig);
  public config$ = this.configSubject.asObservable();

  constructor() {
    super();
    this.loadConfig();
  }

  private loadConfig(): void {
    const savedConfig = localStorage.getItem('site_config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        this.configSubject.next({ ...this.defaultConfig, ...config });
      } catch (error) {
        // Invalid config, use defaults
      }
    }

    this.fetchConfigFromBackend().subscribe({
      next: (config) => {
        this.configSubject.next({ ...this.defaultConfig, ...config });
        localStorage.setItem('site_config', JSON.stringify(config));
      },
      error: () => {
        // Continue with current config
      }
    });
  }

  private fetchConfigFromBackend(): Observable<Partial<SiteConfig>> {
    return this.get<Partial<SiteConfig>>(`${this.apiUrl}/site-config/public/`);
  }

  getCurrentConfig(): Observable<SiteConfig> {
    return this.get<SiteConfig>(`${this.apiUrl}/site-config/current/`);
  }

  updateConfig(config: Partial<SiteConfig>): Observable<SiteConfig> {
    return this.put<SiteConfig>(`${this.apiUrl}/site-config/update_config/`, config);
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
}
