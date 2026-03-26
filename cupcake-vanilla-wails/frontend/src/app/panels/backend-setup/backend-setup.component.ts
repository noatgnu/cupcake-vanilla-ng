import { Component, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WailsService, DownloadProgress } from '../../core/services/wails.service';

type SetupPhase = 'check' | 'download-backend' | 'python-select' | 'download-valkey' | 'services' | 'complete';

interface PhaseInfo {
  id: SetupPhase;
  name: string;
  description: string;
}

@Component({
  selector: 'app-backend-setup',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="cupcake-container setup-layout">
      <header class="panel-header">
        <h1 class="cupcake-title">System Provisioning</h1>
        <p class="cupcake-subtitle">Finalizing environment configuration for Cupcake Vanilla</p>
      </header>

      <main class="panel-main">
        <div class="setup-grid">
          <aside class="progress-sidebar">
            <div class="phase-stepper">
              @for (phase of phases; track phase.id; let i = $index) {
                <div
                  class="step-item"
                  [class.active]="currentPhase() === phase.id"
                  [class.completed]="isPhaseCompleted(phase.id)"
                >
                  <div class="step-marker">
                    @if (isPhaseCompleted(phase.id)) {
                      <i class="bi bi-check-lg"></i>
                    } @else if (currentPhase() === phase.id) {
                      <div class="spinner-tiny"></div>
                    } @else {
                      {{ i + 1 }}
                    }
                  </div>
                  <div class="step-content">
                    <span class="step-name">{{ phase.name }}</span>
                    <span class="step-desc">{{ phase.description }}</span>
                  </div>
                  @if (i < phases.length - 1) {
                    <div class="step-connector"></div>
                  }
                </div>
              }
            </div>
          </aside>

          <section class="phase-display cupcake-card">
            @switch (currentPhase()) {
              @case ('check') {
                <div class="phase-inner animate-fade-in">
                  <div class="spinner-large"></div>
                  <h3 class="phase-title">Requirements Check</h3>
                  <p class="phase-text">Validating system architecture and permissions...</p>
                </div>
              }
              @case ('download-backend') {
                <div class="phase-inner animate-fade-in">
                  <div class="illustration"><i class="bi bi-box-seam"></i></div>
                  <h3 class="phase-title">Backend Distribution</h3>
                  <p class="phase-text">Fetching core application binaries...</p>
                  @if (downloadProgress()) {
                    <div class="phase-progress-container">
                      <div class="cupcake-progress-bar">
                        <div class="progress-fill" [style.width.%]="downloadProgress()?.percentage || 0"></div>
                      </div>
                      <div class="progress-meta">
                        <span>{{ downloadProgress()?.percentage }}%</span>
                        <span>{{ formatSpeed(downloadProgress()?.speed || 0) }}</span>
                      </div>
                    </div>
                  }
                </div>
              }
              @case ('python-select') {
                <div class="phase-inner animate-fade-in">
                  <div class="illustration"><i class="bi bi-cpu"></i></div>
                  <h3 class="phase-title">Environment Linking</h3>
                  <p class="phase-text">Configuring Python runtime hooks...</p>
                </div>
              }
              @case ('download-valkey') {
                <div class="phase-inner animate-fade-in">
                  <div class="illustration"><i class="bi bi-lightning-charge"></i></div>
                  <h3 class="phase-title">Core Services</h3>
                  <p class="phase-text">Downloading high-performance cache server...</p>
                  @if (downloadProgress()) {
                    <div class="phase-progress-container">
                      <div class="cupcake-progress-bar">
                        <div class="progress-fill" [style.width.%]="downloadProgress()?.percentage || 0"></div>
                      </div>
                      <div class="progress-meta">
                        <span>{{ downloadProgress()?.percentage }}%</span>
                        <span>{{ formatSpeed(downloadProgress()?.speed || 0) }}</span>
                      </div>
                    </div>
                  }
                </div>
              }
              @case ('services') {
                <div class="phase-inner animate-fade-in">
                  <div class="spinner-large"></div>
                  <h3 class="phase-title">Bootstrapping</h3>
                  <p class="phase-text">{{ statusMessage() }}</p>
                </div>
              }
              @case ('complete') {
                <div class="phase-inner animate-fade-in">
                  <div class="success-ring">
                    <i class="bi bi-stars"></i>
                  </div>
                  <h3 class="phase-title">Ready for Launch</h3>
                  <p class="phase-text">The environment has been successfully provisioned.</p>
                </div>
              }
            }
          </section>
        </div>
      </main>

      @if (error()) {
        <footer class="error-banner">
          <i class="bi bi-exclamation-triangle-fill banner-icon"></i>
          <div class="banner-body">
            <span class="banner-label">Provisioning Error</span>
            <span class="banner-msg">{{ error() }}</span>
          </div>
          <button class="cupcake-btn danger" (click)="retry()">
            Retry Stage
          </button>
        </footer>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
      background: var(--cupcake-bg-gradient, linear-gradient(135deg, #1a1a2e 0%, #16213e 100%));
    }

    .setup-layout {
      display: flex;
      flex-direction: column;
      gap: 2rem;
      max-width: 1000px !important;
      padding: 3rem 2rem;
    }

    .panel-header { animation: fadeInDown 0.6s ease-out; text-align: center; }
    .cupcake-title { font-size: 2rem; font-weight: 800; margin: 0; color: #fff; letter-spacing: -0.5px; }
    .cupcake-subtitle { color: var(--cupcake-text-muted); font-size: 0.9375rem; margin-top: 0.5rem; }

    .panel-main { flex: 1; min-height: 0; }

    .setup-grid {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 3rem;
      height: 100%;
    }

    .progress-sidebar {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .phase-stepper { display: flex; flex-direction: column; gap: 1.5rem; position: relative; }

    .step-item {
      display: flex;
      align-items: flex-start;
      gap: 1.25rem;
      position: relative;
      transition: all 0.3s;
    }

    .step-marker {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.05);
      border: 2px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8125rem;
      font-weight: 700;
      color: #555;
      z-index: 2;
      transition: all 0.3s;
    }

    .step-item.active .step-marker {
      background: var(--cupcake-primary);
      border-color: var(--cupcake-primary);
      color: #fff;
      box-shadow: 0 0 15px rgba(76, 175, 80, 0.4);
    }

    .step-item.completed .step-marker {
      background: #2e7d32;
      border-color: #2e7d32;
      color: #fff;
    }

    .step-connector {
      position: absolute;
      left: 15px;
      top: 36px;
      width: 2px;
      height: calc(1.5rem + 8px);
      background: rgba(255, 255, 255, 0.05);
      z-index: 1;
    }

    .step-item.completed .step-connector {
      background: #2e7d32;
    }

    .step-content { display: flex; flex-direction: column; gap: 0.125rem; }
    .step-name { font-size: 0.9375rem; font-weight: 600; color: #666; transition: color 0.3s; }
    .step-desc { font-size: 0.75rem; color: #444; transition: color 0.3s; }

    .step-item.active .step-name { color: #fff; }
    .step-item.active .step-desc { color: var(--cupcake-text-muted); }
    .step-item.completed .step-name { color: #aaa; }

    .phase-display {
      background: rgba(255, 255, 255, 0.02) !important;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem !important;
    }

    .phase-inner {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 1.5rem;
      width: 100%;
    }

    .illustration { font-size: 4rem; filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.1)); }
    .phase-title { font-size: 1.5rem; font-weight: 700; margin: 0; color: #fff; }
    .phase-text { font-size: 1rem; color: var(--cupcake-text-muted); margin: 0; }

    .spinner-large {
      width: 64px;
      height: 64px;
      border: 4px solid rgba(255, 255, 255, 0.05);
      border-top-color: var(--cupcake-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .spinner-tiny {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .phase-progress-container {
      width: 100%;
      max-width: 400px;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .cupcake-progress-bar {
      height: 10px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 5px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: var(--cupcake-primary);
      box-shadow: 0 0 10px rgba(76, 175, 80, 0.3);
      transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .progress-meta { display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: 600; color: #555; }

    .success-ring {
      width: 80px;
      height: 80px;
      background: var(--cupcake-primary);
      color: #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.5rem;
      box-shadow: 0 0 40px rgba(76, 175, 80, 0.4);
      animation: scaleUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 1.5rem 2rem;
      background: rgba(244, 67, 54, 0.1);
      border: 1px solid rgba(244, 67, 54, 0.2);
      border-radius: 12px;
      animation: slideUp 0.4s ease-out;
    }

    .banner-icon { font-size: 1.75rem; color: #f44336; }
    .banner-body { flex: 1; display: flex; flex-direction: column; }
    .banner-label { font-weight: 700; font-size: 0.875rem; color: #f44336; text-transform: uppercase; }
    .banner-msg { font-size: 0.875rem; color: #e57373; }

    .cupcake-btn.danger {
      background: #f44336;
      color: #fff;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
    }

    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes scaleUp { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }
    .animate-fade-in { animation: fadeIn 0.5s ease-out; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `]
})
export class BackendSetupComponent {
  private wails = inject(WailsService);

  phases: PhaseInfo[] = [
    { id: 'check', name: 'Identity Validation', description: 'Checking architecture' },
    { id: 'download-backend', name: 'Core Distribution', description: 'Fetching application binaries' },
    { id: 'python-select', name: 'Runtime Linking', description: 'Configuring Python bridge' },
    { id: 'download-valkey', name: 'Service Layer', description: 'Provisioning cache server' },
    { id: 'services', name: 'Bootstrapping', description: 'Starting background workers' },
    { id: 'complete', name: 'System Ready', description: 'Environment established' },
  ];

  currentPhase = signal<SetupPhase>('check');
  completedPhases = signal<SetupPhase[]>([]);
  downloadProgress = signal<DownloadProgress | null>(null);
  statusMessage = signal('Orchestrating...');
  error = signal<string | null>(null);

  constructor() {
    effect(() => {
      const progress = this.wails.downloadProgress();
      if (progress) this.downloadProgress.set(progress);
    });

    effect(() => {
      const status = this.wails.backendStatus();
      if (status) {
        this.statusMessage.set(status.message);
        if (status.status === 'ready') {
          // Logic to advance phases based on service ready events could go here
          // For now we just show the message
        }
        if (status.status === 'error') this.error.set(status.message);
      }
    });
  }

  isPhaseCompleted(phase: SetupPhase): boolean {
    return this.completedPhases().includes(phase);
  }

  formatSpeed(bytesPerSec: number): string {
    if (bytesPerSec === 0) return '0 B/s';
    const i = Math.floor(Math.log(bytesPerSec) / Math.log(1024));
    return (bytesPerSec / Math.pow(1024, i)).toFixed(1) + ' ' + ['B/s', 'KB/s', 'MB/s', 'GB/s'][i];
  }

  retry(): void { this.error.set(null); }
}
