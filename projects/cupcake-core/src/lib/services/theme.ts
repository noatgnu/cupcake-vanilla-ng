import { Injectable, signal, computed } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type ThemePalette = 'default' | 'eink';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly MODE_KEY = 'cupcake-theme';
  private readonly PALETTE_KEY = 'cupcake-palette';
  private readonly mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  private _mode = signal<ThemeMode>(this.loadStoredMode());
  private _palette = signal<ThemePalette>(this.loadStoredPalette());

  readonly mode = this._mode.asReadonly();
  readonly palette = this._palette.asReadonly();

  readonly isDark = computed(() => {
    const mode = this._mode();
    if (mode === 'auto') {
      return this.mediaQuery.matches;
    }
    return mode === 'dark';
  });

  constructor() {
    this.mediaQuery.addEventListener('change', () => {
      if (this._mode() === 'auto') {
        this.updateDocumentTheme();
      }
    });

    this.updateDocumentTheme();
  }

  setMode(mode: ThemeMode): void {
    this._mode.set(mode);
    localStorage.setItem(this.MODE_KEY, mode);
    this.updateDocumentTheme();
  }

  toggleMode(): void {
    const current = this._mode();
    if (current === 'light') {
      this.setMode('dark');
    } else if (current === 'dark') {
      this.setMode('auto');
    } else {
      this.setMode('light');
    }
  }

  setPalette(palette: ThemePalette): void {
    this._palette.set(palette);
    localStorage.setItem(this.PALETTE_KEY, palette);
    this.updateDocumentTheme();
  }

  private loadStoredMode(): ThemeMode {
    const stored = localStorage.getItem(this.MODE_KEY) as ThemeMode;
    return stored && ['light', 'dark', 'auto'].includes(stored) ? stored : 'auto';
  }

  private loadStoredPalette(): ThemePalette {
    const stored = localStorage.getItem(this.PALETTE_KEY) as ThemePalette;
    return stored && ['default', 'eink'].includes(stored) ? stored : 'default';
  }

  private readonly PRIMARY_INLINE_VARS = [
    '--cupcake-primary',
    '--cupcake-primary-rgb',
    '--cupcake-primary-dark',
    '--cupcake-primary-light',
    '--cupcake-primary-contrast',
  ];

  private updateDocumentTheme(): void {
    const isDark = this.isDark();
    const palette = this._palette();

    document.documentElement.setAttribute('data-bs-theme', isDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark-mode', isDark);

    document.documentElement.classList.remove('theme-default', 'theme-eink');
    document.documentElement.classList.add(`theme-${palette}`);

    if (palette !== 'default') {
      this.PRIMARY_INLINE_VARS.forEach(v =>
        document.documentElement.style.removeProperty(v)
      );
    }
  }

  getThemeIcon(): string {
    switch (this._mode()) {
      case 'light': return 'bi-sun-fill';
      case 'dark': return 'bi-moon-fill';
      case 'auto': return 'bi-circle-half';
      default: return 'bi-circle-half';
    }
  }

  getThemeLabel(): string {
    switch (this._mode()) {
      case 'light': return 'Light Mode';
      case 'dark': return 'Dark Mode';
      case 'auto': return 'Auto Mode';
      default: return 'Auto Mode';
    }
  }
}
