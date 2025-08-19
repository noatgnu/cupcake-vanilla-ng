import { Injectable, signal, computed } from '@angular/core';

export type Theme = 'light' | 'dark' | 'auto';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'cupcake-theme';
  private readonly mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  private _theme = signal<Theme>(this.loadStoredTheme());
  
  readonly theme = this._theme.asReadonly();
  readonly isDark = computed(() => {
    const theme = this._theme();
    if (theme === 'auto') {
      return this.mediaQuery.matches;
    }
    return theme === 'dark';
  });

  constructor() {
    this.mediaQuery.addEventListener('change', () => {
      if (this._theme() === 'auto') {
        this.updateDocumentTheme();
      }
    });
    
    this.updateDocumentTheme();
  }

  setTheme(theme: Theme): void {
    this._theme.set(theme);
    localStorage.setItem(this.THEME_KEY, theme);
    this.updateDocumentTheme();
  }

  toggleTheme(): void {
    const current = this._theme();
    if (current === 'light') {
      this.setTheme('dark');
    } else if (current === 'dark') {
      this.setTheme('auto');
    } else {
      this.setTheme('light');
    }
  }

  private loadStoredTheme(): Theme {
    const stored = localStorage.getItem(this.THEME_KEY) as Theme;
    return stored && ['light', 'dark', 'auto'].includes(stored) ? stored : 'auto';
  }

  private updateDocumentTheme(): void {
    const isDark = this.isDark();
    document.documentElement.setAttribute('data-bs-theme', isDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark-mode', isDark);
  }

  getThemeIcon(): string {
    const theme = this._theme();
    switch (theme) {
      case 'light': return 'bi-sun-fill';
      case 'dark': return 'bi-moon-fill';
      case 'auto': return 'bi-circle-half';
      default: return 'bi-circle-half';
    }
  }

  getThemeLabel(): string {
    const theme = this._theme();
    switch (theme) {
      case 'light': return 'Light Mode';
      case 'dark': return 'Dark Mode';
      case 'auto': return 'Auto Mode';
      default: return 'Auto Mode';
    }
  }
}