import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { SiteConfig } from '../models/site-config';

@Injectable({
  providedIn: 'root'
})
export class SiteConfigService {
  private http = inject(HttpClient);

  private readonly defaultConfig: SiteConfig = {
    site_name: 'CUPCAKE Vanilla',
    show_powered_by: true,
    primary_color: '#1976d2',
    allow_user_registration: false,
    enable_orcid_login: false
  };

  private configSubject = new BehaviorSubject<SiteConfig>(this.defaultConfig);
  public config$ = this.configSubject.asObservable();

  constructor() {
    this.loadConfig();
  }

  /**
   * Load site configuration from backend or localStorage
   */
  private loadConfig(): void {
    // Try to load from localStorage first (for offline/fallback)
    const savedConfig = localStorage.getItem('site_config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        this.configSubject.next({ ...this.defaultConfig, ...config });
      } catch (error) {
        console.warn('Invalid site config in localStorage, using defaults');
      }
    }

    // Then try to load from backend
    this.fetchConfigFromBackend().subscribe({
      next: (config) => {
        this.configSubject.next({ ...this.defaultConfig, ...config });
        // Cache in localStorage
        localStorage.setItem('site_config', JSON.stringify(config));
      },
      error: (error) => {
        console.warn('Could not load site config from backend:', error);
        // Continue with current config (localStorage or defaults)
      }
    });
  }

  /**
   * Fetch configuration from backend
   */
  private fetchConfigFromBackend(): Observable<Partial<SiteConfig>> {
    return this.http.get<Partial<SiteConfig>>(`${environment.apiUrl}/site-config/public/`);
  }

  /**
   * Fetch current configuration for authenticated users (admin)
   */
  getCurrentConfig(): Observable<SiteConfig> {
    return this.http.get<SiteConfig>(`${environment.apiUrl}/site-config/current/`);
  }

  /**
   * Update site configuration (admin only)
   */
  updateConfig(config: Partial<SiteConfig>): Observable<SiteConfig> {
    return this.http.put<SiteConfig>(`${environment.apiUrl}/site-config/update_config/`, config);
  }

  /**
   * Get current site name
   */
  getSiteName(): string {
    return this.configSubject.value.site_name;
  }

  /**
   * Check if powered by should be shown
   */
  shouldShowPoweredBy(): boolean {
    return this.configSubject.value.show_powered_by !== false;
  }

  /**
   * Get logo URL (prioritize uploaded image over URL)
   */
  getLogoUrl(): string | null {
    const config = this.configSubject.value;
    return config.logo_image || config.logo_url || null;
  }

  /**
   * Get primary color
   */
  getPrimaryColor(): string {
    return this.configSubject.value.primary_color || '#1976d2';
  }

  /**
   * Check if user registration is enabled
   */
  isRegistrationEnabled(): boolean {
    return this.configSubject.value.allow_user_registration === true;
  }

  /**
   * Check if ORCID login is enabled
   */
  isOrcidLoginEnabled(): boolean {
    return this.configSubject.value.enable_orcid_login === true;
  }
}
