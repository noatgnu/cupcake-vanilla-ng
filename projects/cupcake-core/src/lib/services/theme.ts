import { Injectable, signal, computed, effect, inject, untracked } from '@angular/core';
import { SiteConfigService } from './site-config';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type ThemePalette = 'default' | 'eink';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly MODE_KEY = 'cupcake-theme';
  private readonly PALETTE_KEY = 'cupcake-palette';
  private readonly mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  private readonly siteConfigService = inject(SiteConfigService);

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
        this.applyTheme();
      }
    });

    effect(() => {
      const isDark = this.isDark();
      const palette = this._palette();
      const primaryColor = this.siteConfigService.getPrimaryColor();
      untracked(() => this.applyTheme(isDark, palette, primaryColor));
    });
  }

  setMode(mode: ThemeMode): void {
    this._mode.set(mode);
    localStorage.setItem(this.MODE_KEY, mode);
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

  private applyTheme(
    isDark = this.isDark(),
    palette = this._palette(),
    primaryColor = this.siteConfigService.getPrimaryColor()
  ): void {
    const root = document.documentElement;

    root.setAttribute('data-bs-theme', isDark ? 'dark' : 'light');
    root.classList.toggle('dark-mode', isDark);

    root.classList.remove('theme-default', 'theme-eink');
    root.classList.add(`theme-${palette}`);

    if (palette !== 'default') {
      this.removePrimaryVars(root);
      return;
    }

    this.applyPrimaryColor(root, primaryColor, isDark);
  }

  private applyPrimaryColor(root: HTMLElement, hex: string, isDark: boolean): void {
    const adjusted = isDark ? this.adjustForDarkMode(hex) : hex;
    root.style.setProperty('--cupcake-primary', adjusted);
    root.style.setProperty('--cupcake-primary-rgb', this.hexToRgb(adjusted));
    root.style.setProperty('--cupcake-primary-dark', this.adjustBrightness(adjusted, isDark ? -15 : -20));
    root.style.setProperty('--cupcake-primary-light', this.adjustBrightness(adjusted, isDark ? 15 : 20));
    root.style.setProperty('--cupcake-primary-contrast', this.contrastColor(adjusted));
  }

  private removePrimaryVars(root: HTMLElement): void {
    ['--cupcake-primary', '--cupcake-primary-rgb', '--cupcake-primary-dark',
     '--cupcake-primary-light', '--cupcake-primary-contrast']
      .forEach(v => root.style.removeProperty(v));
  }

  private hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '25, 118, 210';
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }

  private adjustBrightness(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const clamp = (n: number) => Math.min(255, Math.max(0, n));
    const r = clamp((num >> 16) + amt);
    const g = clamp((num >> 8 & 0x00FF) + amt);
    const b = clamp((num & 0x0000FF) + amt);
    return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
  }

  private adjustForDarkMode(hex: string): string {
    const [r, g, b] = this.hexToRgb(hex).split(', ').map(Number);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    if (luminance < 0.5) {
      return this.adjustBrightness(hex, Math.max(40, 80 * (0.5 - luminance)));
    }
    return this.adjustBrightness(hex, 10);
  }

  private contrastColor(hex: string): string {
    const [r, g, b] = this.hexToRgb(hex).split(', ').map(Number);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? '#000000' : '#ffffff';
  }

  private loadStoredMode(): ThemeMode {
    const stored = localStorage.getItem(this.MODE_KEY) as ThemeMode;
    return stored && ['light', 'dark', 'auto'].includes(stored) ? stored : 'auto';
  }

  private loadStoredPalette(): ThemePalette {
    const stored = localStorage.getItem(this.PALETTE_KEY) as ThemePalette;
    return stored && ['default', 'eink'].includes(stored) ? stored : 'default';
  }
}
