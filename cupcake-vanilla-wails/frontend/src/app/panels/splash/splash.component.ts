import { Component, OnInit, OnDestroy, computed, signal, effect, untracked, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WailsService, BackendStatus, LogMessage } from '../../core/services/wails.service';

interface ServiceStatus {
  name: string;
  displayName: string;
  status: 'pending' | 'starting' | 'ready' | 'error';
  message: string;
}

@Component({
  selector: 'app-splash',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="cupcake-container splash-layout">
      <header class="splash-header">
        <div class="logo-wrapper">
          <img src="assets/cupcake_logo.png" alt="Cupcake Vanilla" class="logo" />
        </div>
        <h1 class="cupcake-title">Cupcake Vanilla</h1>
        <p class="cupcake-subtitle">Version {{ version }}</p>
      </header>

      <main class="splash-main">
        <section class="cupcake-card status-section">
          <h2 class="section-title">Initializing Services</h2>
          <div class="service-grid">
            @for (service of services(); track service.name) {
              <div class="service-card" [class]="service.status">
                <div class="service-status-indicator">
                  @switch (service.status) {
                    @case ('pending') { <i class="bi bi-circle pending-icon"></i> }
                    @case ('starting') { <div class="spinner-tiny"></div> }
                    @case ('ready') { <i class="bi bi-check-circle-fill ready-icon"></i> }
                    @case ('error') { <i class="bi bi-x-circle-fill error-icon"></i> }
                  }
                </div>
                <div class="service-info">
                  <span class="service-label">{{ service.displayName }}</span>
                  <span class="service-desc text-truncate">{{ service.message }}</span>
                </div>
              </div>
            }
          </div>
        </section>

        <section class="cupcake-card log-section">
          <h2 class="section-title">System Logs</h2>
          <div class="log-viewport" #logContainer>
            @for (log of recentLogs(); track $index) {
              <div class="log-line" [class]="log.type">
                <span class="log-timestamp">{{ currentTime | date:'HH:mm:ss' }}</span>
                <span class="log-text">{{ log.message }}</span>
              </div>
            }
          </div>
        </section>
      </main>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
      background: var(--cupcake-bg-gradient, linear-gradient(135deg, #1a1a2e 0%, #16213e 100%));
    }

    .splash-layout {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding: 2rem;
      max-width: 900px !important;
    }

    .splash-header {
      text-align: center;
      animation: fadeInDown 0.8s ease-out;
    }

    .logo-wrapper {
      width: 100px;
      height: 100px;
      margin: 0 auto 1rem;
      padding: 10px;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }

    .logo {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .cupcake-title {
      font-size: 2rem;
      font-weight: 700;
      margin: 0;
      background: linear-gradient(to right, #fff, #888);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: -0.5px;
    }

    .cupcake-subtitle {
      color: var(--cupcake-text-muted);
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .splash-main {
      display: grid;
      grid-template-rows: auto 1fr;
      gap: 1.5rem;
      min-height: 0;
    }

    .section-title {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--cupcake-primary);
      margin-bottom: 1rem;
    }

    .service-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 0.75rem;
    }

    .service-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      transition: all 0.3s ease;
    }

    .service-card.ready {
      border-color: rgba(76, 175, 80, 0.2);
      background: rgba(76, 175, 80, 0.02);
    }

    .service-status-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      font-size: 0.875rem;
    }

    .pending-icon { color: #444; }
    .ready-icon { color: #4caf50; filter: drop-shadow(0 0 4px rgba(76, 175, 80, 0.4)); }
    .error-icon { color: #f44336; filter: drop-shadow(0 0 4px rgba(244, 67, 54, 0.4)); }

    .spinner-tiny {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 193, 7, 0.2);
      border-top-color: #ffc107;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .service-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .service-label {
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--cupcake-text);
    }

    .service-desc {
      font-size: 0.6875rem;
      color: var(--cupcake-text-muted);
    }

    .log-section {
      display: flex;
      flex-direction: column;
      min-height: 0;
      background: rgba(0, 0, 0, 0.2) !important;
    }

    .log-viewport {
      flex: 1;
      overflow-y: auto;
      font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
      font-size: 0.75rem;
      line-height: 1.5;
    }

    .log-line {
      display: flex;
      gap: 1rem;
      padding: 0.25rem 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    }

    .log-timestamp {
      color: #555;
      flex-shrink: 0;
    }

    .log-text { color: #ccc; }
    .log-line.success .log-text { color: #4caf50; }
    .log-line.warning .log-text { color: #ffc107; }
    .log-line.error .log-text { color: #f44336; }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @keyframes fadeInDown {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .text-truncate {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `]
})
export class SplashComponent implements OnInit, OnDestroy {
  @ViewChild('logContainer') private logContainer!: ElementRef;
  version = '0.0.1';
  currentTime = new Date();
  private timer: any;

  private serviceStatuses = signal<Map<string, ServiceStatus>>(new Map([
    ['database', { name: 'database', displayName: 'Database', status: 'pending', message: 'Waiting...' }],
    ['python', { name: 'python', displayName: 'Python', status: 'pending', message: 'Waiting...' }],
    ['venv', { name: 'venv', displayName: 'Virtual Environment', status: 'pending', message: 'Waiting...' }],
    ['dependencies', { name: 'dependencies', displayName: 'Dependencies', status: 'pending', message: 'Waiting...' }],
    ['migrations', { name: 'migrations', displayName: 'Migrations', status: 'pending', message: 'Waiting...' }],
    ['collectstatic', { name: 'collectstatic', displayName: 'Static Files', status: 'pending', message: 'Waiting...' }],
    ['redis', { name: 'redis', displayName: 'Redis Server', status: 'pending', message: 'Waiting...' }],
    ['django', { name: 'django', displayName: 'Django Server', status: 'pending', message: 'Waiting...' }],
    ['rq', { name: 'rq', displayName: 'RQ Worker', status: 'pending', message: 'Waiting...' }],
  ]));

  services = computed(() => Array.from(this.serviceStatuses().values()));

  private logs = signal<LogMessage[]>([]);
  recentLogs = computed(() => this.logs().slice(-50));

  constructor(private wails: WailsService) {
    effect(() => {
      const status = this.wails.backendStatus();
      if (status) {
        this.updateServiceStatus(status);
      }
    });

    effect(() => {
      const log = this.wails.backendLog();
      if (log) {
        this.addLog(log);
        setTimeout(() => this.scrollToBottom(), 10);
      }
    });
  }

  ngOnInit(): void {
    this.wails.getAppVersion().then(version => {
      this.version = version;
    });

    this.timer = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private scrollToBottom(): void {
    if (this.logContainer) {
      const element = this.logContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  private updateServiceStatus(status: BackendStatus): void {
    const currentStatuses = untracked(() => this.serviceStatuses());
    const statuses = new Map(currentStatuses);
    const current = statuses.get(status.service);
    if (current) {
      statuses.set(status.service, {
        ...current,
        status: status.status as 'pending' | 'starting' | 'ready' | 'error',
        message: status.message
      });
      this.serviceStatuses.set(statuses);
    }
  }

  private addLog(log: LogMessage): void {
    const current = untracked(() => this.logs());
    this.logs.set([...current, log]);
  }
}
