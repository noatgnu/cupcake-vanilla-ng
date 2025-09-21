import { Component, signal, inject, OnInit, DOCUMENT, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './shared/components/navbar/navbar';
import { PoweredByFooterComponent } from './shared/components/powered-by-footer/powered-by-footer';
import { AsyncTaskUIService } from '@cupcake/vanilla';
import { SiteConfigService, ThemeService, ToastService, ToastContainerComponent } from '@cupcake/core';

import { BehaviorSubject } from 'rxjs';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgbModule, CommonModule, NavbarComponent, PoweredByFooterComponent, ToastContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('cupcake-vanilla-ng');
  protected readonly environment = environment;

  private document = inject(DOCUMENT);
  private siteConfigService = inject(SiteConfigService);
  private themeService = inject(ThemeService);
  private asyncTaskService = inject(AsyncTaskUIService);
  private toastService = inject(ToastService);

  private appInitializedSubject = new BehaviorSubject<boolean>(false);
  public appInitialized$ = this.appInitializedSubject.asObservable();

  private themeEffect = effect(() => {
    this.themeService.isDark();
    this.siteConfigService.getCurrentConfig().subscribe(currentConfig => {
      if (currentConfig) {
        this.updatePrimaryColorTheme(currentConfig.primaryColor || '#1976d2');
      }
    });
  });

  ngOnInit(): void {
    this.initializeApp();
  }

  /**
   * Initialize the application - load config (auth is handled by AuthService)
   */
  private async initializeApp(): Promise<void> {
    try {
      this.siteConfigService.config$.subscribe(config => {
        this.updatePrimaryColorTheme(config.primaryColor || '#1976d2');
      });

      if (environment.features?.asyncTasks) {
        console.log('Initializing async task service with WebSocket connection');
        this.asyncTaskService.startRealtimeUpdates();
      }

      this.appInitializedSubject.next(true);
    } catch (error) {
      console.error('Failed to initialize app:', error);
      this.appInitializedSubject.next(true);
    }
  }


  /**
   * Update CSS custom properties for primary color theming
   */
  private updatePrimaryColorTheme(primaryColor: string): void {
    const root = this.document.documentElement;
    const isDark = this.themeService.isDark();

    let adjustedPrimary = primaryColor;
    if (isDark) {
      adjustedPrimary = this.adjustColorForDarkMode(primaryColor);
    }

    const rgbValues = this.hexToRgb(adjustedPrimary);
    const darkerColor = this.adjustColorBrightness(adjustedPrimary, isDark ? -15 : -20);
    const lighterColor = this.adjustColorBrightness(adjustedPrimary, isDark ? 15 : 20);

    root.style.setProperty('--cupcake-primary', adjustedPrimary);
    root.style.setProperty('--cupcake-primary-rgb', rgbValues);
    root.style.setProperty('--cupcake-primary-dark', darkerColor);
    root.style.setProperty('--cupcake-primary-light', lighterColor);
  }

  /**
   * Convert hex color to RGB values
   */
  private hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '25, 118, 210';

    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);

    return `${r}, ${g}, ${b}`;
  }

  /**
   * Adjust color brightness (positive for lighter, negative for darker)
   */
  private adjustColorBrightness(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;

    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }

  /**
   * Adjust primary color for better contrast in dark mode
   */
  private adjustColorForDarkMode(hex: string): string {
    const rgb = this.hexToRgb(hex).split(', ').map(Number);
    const [r, g, b] = rgb;

    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    if (luminance < 0.5) {
      const brightnessIncrease = Math.max(40, 80 * (0.5 - luminance));
      return this.adjustColorBrightness(hex, brightnessIncrease);
    }

    return this.adjustColorBrightness(hex, 10);
  }

}
