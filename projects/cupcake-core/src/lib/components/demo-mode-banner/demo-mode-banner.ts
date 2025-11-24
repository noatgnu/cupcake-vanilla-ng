import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DemoModeService, DemoModeInfo } from '../../services/demo-mode';

@Component({
  selector: 'cupcake-demo-mode-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './demo-mode-banner.html',
  styleUrls: ['./demo-mode-banner.scss']
})
export class DemoModeBannerComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  isDemoMode = false;
  demoModeInfo: DemoModeInfo | null = null;
  isCollapsed = false;
  isDismissed = false;

  constructor(
    private demoModeService: DemoModeService,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit(): void {
    this.demoModeService.demoMode$
      .pipe(takeUntil(this.destroy$))
      .subscribe(info => {
        this.isDemoMode = info.isActive;
        this.demoModeInfo = info;

        const dismissed = localStorage.getItem('demo_banner_dismissed');
        this.isDismissed = dismissed === 'true';

        this.updateBodyClasses();
      });

    const collapsed = localStorage.getItem('demo_banner_collapsed');
    if (collapsed === 'true') {
      this.isCollapsed = true;
    }
  }

  ngOnDestroy(): void {
    this.document.body.classList.remove('demo-mode-active');
    this.document.body.classList.remove('demo-mode-collapsed');
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
    localStorage.setItem('demo_banner_collapsed', this.isCollapsed.toString());
    this.updateBodyClasses();
  }

  dismissBanner(): void {
    this.isDismissed = true;
    localStorage.setItem('demo_banner_dismissed', 'true');
    this.updateBodyClasses();
  }

  private updateBodyClasses(): void {
    if (this.isDemoMode && !this.isDismissed) {
      this.document.body.classList.add('demo-mode-active');
      if (this.isCollapsed) {
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
    if (!this.demoModeInfo?.lastDetected) {
      return this.demoModeInfo?.cleanupIntervalMinutes || 15;
    }

    const elapsed = (Date.now() - this.demoModeInfo.lastDetected.getTime()) / 1000 / 60;
    const remaining = this.demoModeInfo.cleanupIntervalMinutes - elapsed;
    return Math.max(0, Math.floor(remaining));
  }
}
