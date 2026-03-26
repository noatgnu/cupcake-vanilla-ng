import { Component, signal, computed, effect, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WailsService, LogMessage } from '../../core/services/wails.service';

@Component({
  selector: 'app-debug',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="cupcake-container debug-layout">
      <header class="debug-header cupcake-card">
        <div class="header-main">
          <div class="title-group">
            <h1 class="debug-title">System Console</h1>
            <span class="entry-badge">{{ logCount() }} entries</span>
          </div>

          <div class="action-group">
            <div class="filter-wrapper">
              <i class="bi bi-filter filter-icon"></i>
              <select class="cupcake-select" [(ngModel)]="filterLevel">
                <option value="all">All Logs</option>
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Errors</option>
              </select>
            </div>
            <button class="cupcake-btn outline small" (click)="clearLogs()">
              Clear Output
            </button>
          </div>
        </div>
      </header>

      <main class="console-main cupcake-card">
        <div class="terminal-viewport" #terminalViewport>
          @if (filteredLogs().length === 0) {
            <div class="empty-console">
              <i class="bi bi-terminal empty-icon"></i>
              <p>No log entries matching current filter</p>
            </div>
          }

          @for (log of filteredLogs(); track $index) {
            <div class="log-row" [class]="log.type">
              <span class="log-ts">[{{ log.time }}]</span>
              <span class="log-lvl">{{ log.type.toUpperCase() }}</span>
              <span class="log-msg">{{ log.message }}</span>
            </div>
          }
        </div>
      </main>

      <footer class="debug-footer">
        <div class="footer-left">
          <label class="cupcake-checkbox">
            <input type="checkbox" [(ngModel)]="autoScroll" />
            <span class="checkbox-label">Sticky Scroll</span>
          </label>
        </div>
        <div class="footer-right">
          <span class="status-indicator">
            <span class="status-dot" [class.error]="isLastError()"></span>
            <span class="status-label">{{ backendStatus() }}</span>
          </span>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
      background: #08080c;
    }

    .debug-layout {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-width: 100% !important;
      height: 100%;
      padding: 1.5rem;
    }

    .debug-header {
      padding: 0.75rem 1.25rem !important;
      margin-bottom: 0 !important;
      background: rgba(255, 255, 255, 0.02) !important;
      border: 1px solid rgba(255, 255, 255, 0.05) !important;
    }

    .header-main {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .title-group {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .debug-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: #fff;
      margin: 0;
      letter-spacing: -0.2px;
    }

    .entry-badge {
      font-size: 0.6875rem;
      font-weight: 600;
      background: rgba(255, 255, 255, 0.05);
      color: #666;
      padding: 0.25rem 0.625rem;
      border-radius: 20px;
    }

    .action-group {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .filter-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .filter-icon {
      position: absolute;
      left: 0.75rem;
      color: #444;
      font-size: 0.875rem;
      pointer-events: none;
    }

    .cupcake-select {
      background: #12121a;
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #aaa;
      padding: 0.5rem 1rem 0.5rem 2.25rem;
      border-radius: 6px;
      font-size: 0.8125rem;
      outline: none;
      cursor: pointer;
      appearance: none;
    }

    .cupcake-select:hover { border-color: rgba(255, 255, 255, 0.2); }

    .cupcake-btn.outline.small {
      padding: 0.5rem 1rem !important;
      font-size: 0.75rem !important;
      color: #888 !important;
      border-color: rgba(255, 255, 255, 0.1) !important;
    }

    .console-main {
      flex: 1;
      background: #000 !important;
      border: 1px solid rgba(255, 255, 255, 0.05) !important;
      padding: 0 !important;
      overflow: hidden;
      margin-bottom: 0 !important;
    }

    .terminal-viewport {
      height: 100%;
      padding: 1rem;
      overflow-y: auto;
      font-family: 'JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', 'Consolas', monospace;
      font-size: 0.8125rem;
      line-height: 1.5;
    }

    .log-row {
      display: flex;
      gap: 1rem;
      padding: 0.125rem 0.5rem;
      border-radius: 4px;
      margin-bottom: 0.125rem;
      white-space: pre-wrap;
    }

    .log-row:hover { background: rgba(255, 255, 255, 0.03); }

    .log-ts { color: #444; flex-shrink: 0; font-size: 0.75rem; }
    .log-lvl { font-weight: 700; flex-shrink: 0; width: 60px; font-size: 0.75rem; }

    .log-row.info .log-lvl { color: #3182ce; }
    .log-row.success .log-lvl { color: #4caf50; }
    .log-row.warning .log-lvl { color: #ffc107; }
    .log-row.error .log-lvl { color: #f44336; }

    .log-msg { color: #aaa; }
    .log-row.success .log-msg { color: #c8e6c9; }
    .log-row.warning .log-msg { color: #fff8e1; }
    .log-row.error .log-msg { color: #ffcdd2; }

    .empty-console {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #333;
      gap: 1rem;
    }

    .empty-icon { font-size: 3rem; opacity: 0.2; }

    .debug-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 0.5rem;
    }

    .cupcake-checkbox {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      font-size: 0.75rem;
      color: #555;
    }

    .checkbox-label { transition: color 0.2s; }
    .cupcake-checkbox:hover .checkbox-label { color: #888; }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: rgba(255, 255, 255, 0.02);
      padding: 0.375rem 0.75rem;
      border-radius: 4px;
      font-size: 0.75rem;
      color: #666;
    }

    .status-dot { width: 6px; height: 6px; border-radius: 50%; background: #4caf50; }
    .status-dot.error { background: #f44336; animation: pulseError 2s infinite; }

    @keyframes pulseError {
      0% { box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.4); }
      70% { box-shadow: 0 0 0 6px rgba(244, 67, 54, 0); }
      100% { box-shadow: 0 0 0 0 rgba(244, 67, 54, 0); }
    }
  `]
})
export class DebugComponent {
  @ViewChild('terminalViewport') private terminalViewport!: ElementRef;
  private wails = inject(WailsService);

  filterLevel = 'all';
  autoScroll = true;

  private logs = signal<{message: string; type: string; time: string}[]>([]);
  logCount = computed(() => this.logs().length);

  filteredLogs = computed(() => {
    const logs = this.logs();
    return this.filterLevel === 'all' ? logs : logs.filter(log => log.type === this.filterLevel);
  });

  backendStatus = signal('Initializing');
  isLastError = signal(false);

  constructor() {
    effect(() => {
      const log = this.wails.backendLog();
      if (log) this.addLog(log);
    });

    effect(() => {
      const status = this.wails.backendStatus();
      if (status) {
        this.backendStatus.set(`${status.service}: ${status.status}`);
        this.isLastError.set(status.status === 'error');
        this.addLog({
          message: `[${status.service}] ${status.message}`,
          type: status.status === 'error' ? 'error' : 'info'
        });
      }
    });
  }

  private addLog(log: LogMessage): void {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.logs.update(current => {
      const updated = [...current, { ...log, time }];
      return updated.length > 2000 ? updated.slice(-2000) : updated;
    });

    if (this.autoScroll) {
      setTimeout(() => this.scrollToBottom(), 10);
    }
  }

  private scrollToBottom(): void {
    if (this.terminalViewport) {
      const el = this.terminalViewport.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  clearLogs(): void {
    this.logs.set([]);
  }
}
