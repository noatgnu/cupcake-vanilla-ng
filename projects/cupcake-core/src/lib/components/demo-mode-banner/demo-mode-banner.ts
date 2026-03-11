import { Component, OnInit, OnDestroy, Inject, signal, ChangeDetectionStrategy, inject, effect, untracked } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { DemoModeService } from '../../services/demo-mode';

@Component({
  selector: 'cupcake-demo-mode-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './demo-mode-banner.html',
  styleUrls: ['./demo-mode-banner.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DemoModeBannerComponent implements OnInit, OnDestroy {
  private demoModeService = inject(DemoModeService);
  private document = inject(DOCUMENT);

  isDemoMode = signal(false);
  demoModeInfo = this.demoModeService.demoMode;
  isCollapsed = signal(false);
  isDismissed = signal(false);

  constructor() {
    effect(() => {
      const info = this.demoModeInfo();
      const dismissed = this.isDismissed();
      const collapsed = this.isCollapsed();
      const isActive = info.isActive;

      untracked(() => {
        this.isDemoMode.set(isActive);
        this.updateBodyClasses(isActive, dismissed, collapsed);
      });
    });
  }

  ngOnInit(): void {
    const dismissed = localStorage.getItem('demo_banner_dismissed');
    this.isDismissed.set(dismissed === 'true');

    const collapsed = localStorage.getItem('demo_banner_collapsed');
    if (collapsed === 'true') {
      this.isCollapsed.set(true);
    }
  }

  ngOnDestroy(): void {
    this.document.body.classList.remove('demo-mode-active');
    this.document.body.classList.remove('demo-mode-collapsed');
  }

  toggleCollapse(): void {
    const newValue = !this.isCollapsed();
    this.isCollapsed.set(newValue);
    localStorage.setItem('demo_banner_collapsed', newValue.toString());
  }

  dismissBanner(): void {
    this.isDismissed.set(true);
    localStorage.setItem('demo_banner_dismissed', 'true');
  }

  private updateBodyClasses(isActive: boolean, isDismissed: boolean, isCollapsed: boolean): void {
    if (isActive && !isDismissed) {
      this.document.body.classList.add('demo-mode-active');
      if (isCollapsed) {
        this.document.body.classList.add('demo-mode-collapsed');
      } else {
        this.document.body.classList.remove('demo-mode-collapsed');
      }
    } else {
      this.document.body.classList.remove('demo-mode-active');
      this.document.body.classList.remove('demo-mode-collapsed');
    }
  }

  getMinutesRemaining(): number {
    const info = this.demoModeInfo();
    if (!info?.lastDetected) {
      return info?.cleanupIntervalMinutes || 15;
    }

    const elapsed = (Date.now() - info.lastDetected.getTime()) / 1000 / 60;
    const remaining = info.cleanupIntervalMinutes - elapsed;
    return Math.max(0, Math.floor(remaining));
  }
}
