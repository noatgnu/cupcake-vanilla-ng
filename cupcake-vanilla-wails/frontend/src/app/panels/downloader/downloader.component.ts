import { Component, OnInit, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { WailsService, ReleaseInfo, DownloadProgress, PythonCandidate } from '../../core/services/wails.service';

type DistributionMode = 'portable' | 'native';

@Component({
  selector: 'app-downloader',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="cupcake-container downloader-layout">
      <header class="panel-header">
        <h1 class="cupcake-title">{{ title() }}</h1>
        <p class="cupcake-subtitle">{{ description() }}</p>
      </header>

      <main class="panel-main">
        @if (downloadType === 'backend' && !downloading() && !success()) {
          <section class="mode-section">
            <h2 class="section-title">Distribution Mode</h2>
            <div class="mode-grid">
              <div
                class="mode-card"
                [class.active]="distributionMode() === 'portable'"
                (click)="setDistributionMode('portable')"
              >
                <div class="mode-icon-wrapper"><i class="bi bi-box-seam"></i></div>
                <div class="mode-content">
                  <span class="mode-label">Portable Distribution</span>
                  <span class="mode-desc">Bundled Python environment (Highly Recommended)</span>
                </div>
                <div class="mode-check" *ngIf="distributionMode() === 'portable'">
                  <i class="bi bi-check-circle-fill"></i>
                </div>
              </div>

              <div
                class="mode-card"
                [class.active]="distributionMode() === 'native'"
                (click)="setDistributionMode('native')"
              >
                <div class="mode-icon-wrapper"><i class="bi bi-cpu"></i></div>
                <div class="mode-content">
                  <span class="mode-label">Native Installation</span>
                  <span class="mode-desc">Use system Python and git repository</span>
                </div>
                <div class="mode-check" *ngIf="distributionMode() === 'native'">
                  <i class="bi bi-check-circle-fill"></i>
                </div>
              </div>
            </div>
          </section>

          @if (distributionMode() === 'portable') {
            <section class="version-section">
              <h2 class="section-title">Select Version</h2>
              @if (loadingReleases()) {
                <div class="cupcake-card loading-state-small">
                  <div class="spinner-small"></div>
                  <span>Fetching available releases...</span>
                </div>
              } @else {
                <div class="selection-list">
                  @for (release of releases(); track release.tag) {
                    <div
                      class="selection-item"
                      [class.active]="selectedVersion() === release.tag"
                      (click)="selectVersion(release.tag)"
                    >
                      <div class="item-main">
                        <span class="item-title">{{ release.tag }}</span>
                        <span class="item-subtitle">{{ release.name }}</span>
                      </div>
                      <span class="item-meta">{{ formatDate(release.publishedAt) }}</span>
                    </div>
                  }
                </div>
              }
            </section>
          }

          @if (distributionMode() === 'native') {
            <div class="native-grid">
              <section class="branch-section">
                <h2 class="section-title">Repository Branch</h2>
                <div class="selection-list">
                  @for (release of releases(); track release.tag) {
                    <div
                      class="selection-item"
                      [class.active]="selectedBranch() === release.tag"
                      (click)="selectBranch(release.tag)"
                    >
                      <div class="item-main">
                        <span class="item-title">{{ release.tag }}</span>
                      </div>
                    </div>
                  }
                </div>
              </section>

              <section class="python-section">
                <h2 class="section-title">System Python</h2>
                @if (loadingPython()) {
                  <div class="cupcake-card loading-state-small">
                    <div class="spinner-small"></div>
                    <span>Detecting Python...</span>
                  </div>
                } @else {
                  <div class="selection-list">
                    @for (python of pythonCandidates(); track python.path) {
                      <div
                        class="selection-item"
                        [class.active]="selectedPython() === python.path"
                        (click)="selectPython(python)"
                      >
                        <div class="item-main">
                          <span class="item-title">Python {{ python.version }}</span>
                          <code class="item-subtitle">{{ python.path }}</code>
                        </div>
                      </div>
                    }
                  </div>
                }
              </section>
            </div>
          }
        }

        @if (downloading()) {
          <section class="cupcake-card progress-card">
            <h2 class="section-title">{{ progressTitle() }}</h2>
            <div class="progress-container">
              <div class="progress-bar-wrapper">
                <div class="cupcake-progress-bar">
                  <div class="progress-fill" [style.width.%]="progress()?.percentage || 0"></div>
                </div>
                <span class="percentage-label">{{ progress()?.percentage || 0 }}%</span>
              </div>

              <div class="progress-metrics">
                <div class="metric">
                  <span class="metric-label">Speed</span>
                  <span class="metric-value">{{ formatSpeed(progress()?.speed || 0) }}</span>
                </div>
                <div class="metric">
                  <span class="metric-label">Downloaded</span>
                  <span class="metric-value">
                    {{ formatSize(progress()?.downloaded || 0) }} / {{ formatSize(progress()?.total || 0) }}
                  </span>
                </div>
              </div>

              <div class="progress-status-text">
                <div class="spinner-tiny"></div>
                <span>{{ statusMessage() }}</span>
              </div>
            </div>
          </section>
        }

        @if (error()) {
          <div class="banner error-banner">
            <i class="bi bi-exclamation-triangle banner-icon"></i>
            <div class="banner-content">
              <span class="banner-title">Error</span>
              <span class="banner-text">{{ error() }}</span>
            </div>
            <button class="btn-retry" (click)="error.set(null)">Retry</button>
          </div>
        }

        @if (success()) {
          <div class="banner success-banner">
            <div class="success-illustration"><i class="bi bi-check-lg"></i></div>
            <h2 class="success-title">Success!</h2>
            <p class="success-text">{{ successMessage() }}</p>
          </div>
        }
      </main>

      <footer class="panel-footer cupcake-card" *ngIf="!downloading() && !success()">
        <div class="footer-info" *ngIf="downloadType === 'backend' && distributionMode() === 'portable'">
          Selected: <strong class="text-primary">{{ selectedVersion() }}</strong>
        </div>
        <div class="footer-actions">
          <button
            class="cupcake-btn primary"
            [disabled]="!canDownload()"
            (click)="startDownload()"
          >
            {{ downloadButtonLabel() }}
          </button>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
      background: var(--cupcake-bg-gradient, linear-gradient(135deg, #1a1a2e 0%, #16213e 100%));
    }

    .downloader-layout {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      max-width: 900px !important;
      padding: 2rem;
    }

    .panel-header { animation: fadeInDown 0.6s ease-out; }
    .cupcake-title { font-size: 1.75rem; font-weight: 700; margin: 0; color: #fff; }
    .cupcake-subtitle { color: var(--cupcake-text-muted); font-size: 0.875rem; margin-top: 0.25rem; }

    .panel-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      min-height: 0;
      overflow-y: auto;
    }

    .section-title {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--cupcake-primary);
      margin-bottom: 0.75rem;
    }

    .mode-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .mode-card {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      padding: 1.5rem;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      cursor: pointer;
      position: relative;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .mode-card:hover {
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(255, 255, 255, 0.15);
      transform: translateY(-2px);
    }

    .mode-card.active {
      background: rgba(76, 175, 80, 0.08);
      border-color: var(--cupcake-primary);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    }

    .mode-icon-wrapper {
      font-size: 2rem;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 10px;
    }

    .mode-content { display: flex; flex-direction: column; gap: 0.25rem; }
    .mode-label { font-weight: 600; font-size: 1rem; }
    .mode-desc { font-size: 0.75rem; color: var(--cupcake-text-muted); }

    .mode-check {
      position: absolute;
      top: 1rem;
      right: 1rem;
      color: var(--cupcake-primary);
    }

    .selection-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .selection-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .selection-item:hover { background: rgba(255, 255, 255, 0.05); }
    .selection-item.active {
      background: rgba(76, 175, 80, 0.1);
      border-color: rgba(76, 175, 80, 0.3);
    }

    .item-main { display: flex; flex-direction: column; min-width: 0; }
    .item-title { font-weight: 600; font-size: 0.875rem; }
    .item-subtitle { font-size: 0.75rem; color: var(--cupcake-text-muted); }
    .item-meta { font-size: 0.75rem; color: #555; }

    .native-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    .progress-card {
      background: rgba(0, 0, 0, 0.2) !important;
      padding: 2rem !important;
    }

    .progress-container { display: flex; flex-direction: column; gap: 1.5rem; }

    .progress-bar-wrapper {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .cupcake-progress-bar {
      flex: 1;
      height: 12px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 6px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--cupcake-primary-dark), var(--cupcake-primary));
      box-shadow: 0 0 10px rgba(76, 175, 80, 0.4);
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .percentage-label { font-weight: 700; font-size: 1.25rem; color: var(--cupcake-primary); width: 60px; text-align: right; }

    .progress-metrics {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .metric {
      background: rgba(255, 255, 255, 0.03);
      padding: 1rem;
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .metric-label { font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.5px; color: #555; }
    .metric-value { font-weight: 600; font-size: 1rem; }

    .progress-status-text {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: var(--cupcake-text-muted);
      font-size: 0.875rem;
      justify-content: center;
    }

    .spinner-tiny {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.1);
      border-top-color: var(--cupcake-primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .banner {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      border-radius: 12px;
      animation: fadeIn 0.4s ease-out;
    }

    .error-banner {
      background: rgba(244, 67, 54, 0.1);
      border: 1px solid rgba(244, 67, 54, 0.2);
    }

    .banner-icon { font-size: 1.5rem; }
    .banner-content { flex: 1; display: flex; flex-direction: column; }
    .banner-title { font-weight: 700; font-size: 0.9375rem; color: #f44336; }
    .banner-text { font-size: 0.8125rem; color: #e57373; }

    .btn-retry {
      background: rgba(244, 67, 54, 0.2);
      border: 1px solid rgba(244, 67, 54, 0.3);
      color: #fff;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      cursor: pointer;
    }

    .success-banner {
      flex-direction: column;
      padding: 3rem;
      text-align: center;
      background: rgba(76, 175, 80, 0.05);
      border: 1px solid rgba(76, 175, 80, 0.1);
    }

    .success-illustration {
      width: 64px;
      height: 64px;
      background: var(--cupcake-primary);
      color: #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 0 30px rgba(76, 175, 80, 0.3);
    }

    .success-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; }
    .success-text { color: var(--cupcake-text-muted); }

    .panel-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.5rem !important;
      background: rgba(255, 255, 255, 0.02) !important;
      margin-bottom: 0 !important;
    }

    .footer-info { font-size: 0.8125rem; color: #555; }
    .text-primary { color: var(--cupcake-primary); }

    .cupcake-btn.primary {
      background: var(--cupcake-primary);
      color: #fff;
      border: none;
      padding: 0.75rem 2rem;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }

    .loading-state-small {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem !important;
      color: var(--cupcake-text-muted);
      font-size: 0.875rem;
    }

    .spinner-small {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.1);
      border-top-color: var(--cupcake-primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeInDown {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `]
})
export class DownloaderComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private wails = inject(WailsService);

  downloadType: 'backend' | 'valkey' = 'backend';
  distributionMode = signal<DistributionMode>('portable');

  title = computed(() => {
    return this.downloadType === 'backend'
      ? 'Backend Source'
      : 'Service Setup';
  });

  description = computed(() => {
    if (this.downloadType !== 'backend') {
      return 'Initializing Redis/Valkey for asynchronous background processing';
    }
    return this.distributionMode() === 'portable'
      ? 'Standalone package with pre-configured Python environment'
      : 'Developer mode: Synchronize repository and use system-level Python';
  });

  loadingReleases = signal(false);
  releases = signal<ReleaseInfo[]>([]);
  selectedVersion = signal<string>('');
  selectedBranch = signal<string>('');

  loadingPython = signal(false);
  pythonCandidates = signal<PythonCandidate[]>([]);
  selectedPython = signal<string>('');

  downloading = signal(false);
  progress = signal<DownloadProgress | null>(null);
  statusMessage = signal('');

  error = signal<string | null>(null);
  success = signal(false);
  successMessage = signal('');

  progressTitle = computed(() => {
    if (this.downloadType === 'valkey') return 'Downloading Core Service';
    return this.distributionMode() === 'portable'
      ? 'Downloading Distribution'
      : 'Orchestrating Environment';
  });

  downloadButtonLabel = computed(() => {
    if (this.downloadType === 'valkey') return 'Begin Download';
    return this.distributionMode() === 'portable' ? 'Begin Download' : 'Start Orchestration';
  });

  canDownload = computed(() => {
    if (this.downloading() || this.success()) return false;
    if (this.downloadType === 'valkey') return true;

    if (this.distributionMode() === 'portable') {
      return this.selectedVersion() !== '';
    } else {
      return this.selectedBranch() !== '' && this.selectedPython() !== '';
    }
  });

  constructor() {
    effect(() => {
      const progress = this.wails.downloadProgress();
      if (progress) this.progress.set(progress);
    });

    effect(() => {
      const complete = this.wails.downloadComplete();
      if (complete) {
        this.downloading.set(false);
        if (complete.success) {
          this.success.set(true);
          this.successMessage.set(complete.message);
        } else {
          this.error.set(complete.message);
        }
      }
    });
  }

  async ngOnInit(): Promise<void> {
    const queryType = this.route.snapshot.queryParams['type'];
    const routeType = this.route.snapshot.data['downloadType'];

    this.downloadType = (queryType === 'valkey' || routeType === 'valkey') ? 'valkey' : 'backend';

    if (this.downloadType === 'backend') {
      await Promise.all([this.loadReleases(), this.loadPythonCandidates()]);
    }
  }

  setDistributionMode(mode: DistributionMode): void {
    this.distributionMode.set(mode);
    this.error.set(null);
  }

  async loadReleases(): Promise<void> {
    this.loadingReleases.set(true);
    try {
      const releases = await this.wails.getAvailableReleases();
      this.releases.set(releases);
      if (releases.length > 0) {
        this.selectedVersion.set(releases[0].tag);
        this.selectedBranch.set(releases[0].tag);
      }
    } catch (error) {
      this.error.set(`Release API error: ${error}`);
    } finally {
      this.loadingReleases.set(false);
    }
  }

  async loadPythonCandidates(): Promise<void> {
    this.loadingPython.set(true);
    try {
      const candidates = await this.wails.detectPythonCandidates();
      this.pythonCandidates.set(candidates);
      if (candidates.length > 0) this.selectedPython.set(candidates[0].path);
    } catch (error) {
      this.error.set(`Python detection error: ${error}`);
    } finally {
      this.loadingPython.set(false);
    }
  }

  selectVersion(tag: string): void { this.selectedVersion.set(tag); }
  selectBranch(tag: string): void { this.selectedBranch.set(tag); }
  selectPython(candidate: PythonCandidate): void { this.selectedPython.set(candidate.path); }

  async startDownload(): Promise<void> {
    this.downloading.set(true);
    this.error.set(null);
    this.statusMessage.set(this.distributionMode() === 'native' ? 'Provisioning repository...' : 'Negotiating connection...');

    try {
      if (this.downloadType === 'backend') {
        if (this.distributionMode() === 'portable') {
          await this.wails.downloadPortableBackend(this.selectedVersion());
        } else {
          await this.wails.setupNativeBackend(this.selectedPython(), this.selectedBranch());
        }
      } else {
        await this.wails.downloadValkey();
      }
    } catch (error) {
      this.downloading.set(false);
      this.error.set(`Provisioning failed: ${error}`);
    }
  }

  formatDate(dateStr: string): string {
    return dateStr ? new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '';
  }

  formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + ['B', 'KB', 'MB', 'GB'][i];
  }

  formatSpeed(bytesPerSec: number): string { return this.formatSize(bytesPerSec) + '/s'; }
}
