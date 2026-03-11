import { Component, OnInit, OnDestroy, Inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DemoModeService, DemoModeInfo } from '../../services/demo-mode';

@Component({
  selector: 'cupcake-demo-mode-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './demo-mode-banner.html',
  styleUrls: ['./demo-mode-banner.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DemoModeBannerComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  isDemoMode = signal(false);
  demoModeInfo = signal<DemoModeInfo | null>(null);
  isCollapsed = signal(false);
  isDismissed = signal(false);

  constructor(
    private demoModeService: DemoModeService,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit(): void {
    this.demoModeService.demoMode$
      .pipe(takeUntil(this.destroy$))
      .subscribe(info => {
        this.isDemoMode.set(info.isActive);
        this.demoModeInfo.set(info);

        const dismissed = localStorage.getItem('demo_banner_dismissed');
        this.isDismissed.set(dismissed === 'true');

        this.updateBodyClasses();
      });

    const collapsed = localStorage.getItem('demo_banner_collapsed');
    if (collapsed === 'true') {
      this.isCollapsed.set(true);
    }
  }

  ngOnDestroy(): void {
    this.document.body.classList.remove('demo-mode-active');
    this.document.body.classList.remove('demo-mode-collapsed');
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleCollapse(): void {
    const newValue = !this.isCollapsed();
    this.isCollapsed.set(newValue);
    localStorage.setItem('demo_banner_collapsed', newValue.toString());
    this.updateBodyClasses();
  }

  dismissBanner(): void {
    this.isDismissed.set(true);
    localStorage.setItem('demo_banner_dismissed', 'true');
    this.updateBodyClasses();
  }

  private updateBodyClasses(): void {
    if (this.isDemoMode() && !this.isDismissed()) {
      this.document.body.classList.add('demo-mode-active');
      if (this.isCollapsed()) {
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
