import { Injectable, signal } from '@angular/core';

declare const Office: any;

export type ThemeMode = 'light' | 'dark';

export interface OfficeTheme {
  bodyBackgroundColor: string;
  bodyForegroundColor: string;
  controlBackgroundColor: string;
  controlForegroundColor: string;
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private _theme = signal<ThemeMode>('light');
  readonly theme = this._theme.asReadonly();

  private _officeTheme = signal<OfficeTheme | null>(null);
  readonly officeTheme = this._officeTheme.asReadonly();

  constructor() {
    this.initializeTheme();
  }

  private initializeTheme(): void {
    if (typeof Office !== 'undefined' && Office.context) {
      this.detectOfficeTheme();
      this.listenForThemeChanges();
    } else {
      this.detectSystemTheme();
      this.listenForSystemThemeChanges();
    }
  }

  private detectOfficeTheme(): void {
    try {
      if (Office.context.officeTheme) {
        const theme = Office.context.officeTheme;
        this._officeTheme.set({
          bodyBackgroundColor: theme.bodyBackgroundColor,
          bodyForegroundColor: theme.bodyForegroundColor,
          controlBackgroundColor: theme.controlBackgroundColor,
          controlForegroundColor: theme.controlForegroundColor
        });
        this.determineThemeFromColors(theme.bodyBackgroundColor);
        this.applyTheme();
      }
    } catch {
      this.detectSystemTheme();
    }
  }

  private listenForThemeChanges(): void {
    try {
      if (Office.context.document) {
        Office.context.document.addHandlerAsync(
          Office.EventType.DocumentSelectionChanged,
          () => this.detectOfficeTheme()
        );
      }
    } catch {
      // Office theme change listener not available
    }
  }

  private detectSystemTheme(): void {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this._theme.set(darkModeQuery.matches ? 'dark' : 'light');
      this.applyTheme();
    }
  }

  private listenForSystemThemeChanges(): void {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      darkModeQuery.addEventListener('change', (e) => {
        this._theme.set(e.matches ? 'dark' : 'light');
        this.applyTheme();
      });
    }
  }

  private determineThemeFromColors(backgroundColor: string): void {
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    this._theme.set(luminance < 0.5 ? 'dark' : 'light');
  }

  private applyTheme(): void {
    const root = document.documentElement;
    const theme = this._theme();
    const officeTheme = this._officeTheme();

    root.setAttribute('data-bs-theme', theme);

    if (officeTheme) {
      root.style.setProperty('--office-body-bg', officeTheme.bodyBackgroundColor);
      root.style.setProperty('--office-body-fg', officeTheme.bodyForegroundColor);
      root.style.setProperty('--office-control-bg', officeTheme.controlBackgroundColor);
      root.style.setProperty('--office-control-fg', officeTheme.controlForegroundColor);
    }

    if (theme === 'dark') {
      root.style.setProperty('--taskpane-bg', officeTheme?.bodyBackgroundColor || '#1e1e1e');
      root.style.setProperty('--taskpane-fg', officeTheme?.bodyForegroundColor || '#ffffff');
      root.style.setProperty('--taskpane-border', '#404040');
      root.style.setProperty('--taskpane-hover', '#2d2d2d');
      root.style.setProperty('--taskpane-muted', '#a0a0a0');
    } else {
      root.style.setProperty('--taskpane-bg', officeTheme?.bodyBackgroundColor || '#ffffff');
      root.style.setProperty('--taskpane-fg', officeTheme?.bodyForegroundColor || '#212529');
      root.style.setProperty('--taskpane-border', '#dee2e6');
      root.style.setProperty('--taskpane-hover', '#f8f9fa');
      root.style.setProperty('--taskpane-muted', '#6c757d');
    }
  }

  setTheme(theme: ThemeMode): void {
    this._theme.set(theme);
    this.applyTheme();
  }
}
