import { Component, OnInit, OnDestroy, signal, computed, inject, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WailsService } from '../../core/services/wails.service';

interface CommandStatus {
  name: string;
  displayName: string;
  description: string;
  running: boolean;
  success: boolean | null;
  count: number | null;
  icon: string;
}

@Component({
  selector: 'app-management',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="cupcake-container management-layout">
      <header class="panel-header">
        <h1 class="cupcake-title">System Management</h1>
        <p class="cupcake-subtitle">Orchestrate backend services and monitor data integrity</p>
      </header>

      <main class="panel-main">
        <div class="dashboard-grid">
          <!-- LEFT: Statistics -->
          <section class="stats-sidebar">
            <h2 class="section-title">Data Warehouse</h2>
            <div class="stats-cards">
              <div class="cupcake-card stat-card">
                <span class="stat-icon"><i class="bi bi-bar-chart"></i></span>
                <div class="stat-body">
                  <span class="stat-value">{{ schemaCount() }}</span>
                  <span class="stat-label">SDRF Schemas</span>
                </div>
              </div>

              <div class="cupcake-card stat-card">
                <span class="stat-icon"><i class="bi bi-card-checklist"></i></span>
                <div class="stat-body">
                  <span class="stat-value">{{ columnTemplateCount() }}</span>
                  <span class="stat-label">Column Templates</span>
                </div>
              </div>

              <div class="cupcake-card stat-card primary">
                <span class="stat-icon"><i class="bi bi-dna"></i></span>
                <div class="stat-body">
                  <span class="stat-value">{{ ontologyTotal() }}</span>
                  <span class="stat-label">Ontology Terms</span>
                </div>
              </div>
            </div>

            <div class="cupcake-card ontology-box">
              <h3 class="box-title">Ontology Breakdown</h3>
              <div class="ontology-grid">
                @for (item of ontologyBreakdown(); track item.name) {
                  <div class="ontology-pill">
                    <span class="pill-name">{{ item.name }}</span>
                    <span class="pill-divider"></span>
                    <span class="pill-count">{{ item.count | number }}</span>
                  </div>
                }
              </div>
            </div>
          </section>

          <!-- RIGHT: Actions & Output -->
          <div class="actions-column">
            <section class="commands-section">
              <h2 class="section-title">Operations</h2>
              <div class="command-grid">
                @for (cmd of commands(); track cmd.name) {
                  <div class="cupcake-card command-card" [class.running]="cmd.running">
                    <div class="command-icon-wrapper"><i [class]="cmd.icon"></i></div>
                    <div class="command-content">
                      <div class="command-main">
                        <span class="command-name">{{ cmd.displayName }}</span>
                        @if (cmd.count !== null) {
                          <span class="badge-success">{{ cmd.count | number }} items</span>
                        }
                      </div>
                      <p class="command-desc">{{ cmd.description }}</p>
                    </div>
                    <button
                      class="cupcake-btn action-btn"
                      [class.secondary]="!cmd.running"
                      [disabled]="cmd.running"
                      (click)="runCommand(cmd.name)"
                    >
                      @if (cmd.running) {
                        <span class="spinner-tiny"></span>
                        Working
                      } @else {
                        Execute
                      }
                    </button>
                  </div>
                }
              </div>
            </section>

            <section class="cupcake-card terminal-section">
              <div class="terminal-header">
                <span class="terminal-title">Command Output</span>
                <div class="terminal-controls">
                  <button class="btn-clear" (click)="outputLines.set([])">Clear</button>
                </div>
              </div>
              <div class="terminal-viewport" #terminalViewport>
                @if (outputLines().length === 0) {
                  <div class="terminal-placeholder">Awaiting command execution...</div>
                }
                @for (line of outputLines(); track $index) {
                  <div class="terminal-line" [class]="line.type">
                    <span class="line-caret">></span>
                    <span class="line-text">{{ line.text }}</span>
                  </div>
                }
              </div>
            </section>
          </div>
        </div>
      </main>

      <footer class="panel-footer cupcake-card">
        <div class="footer-status">
          <span class="dot pulse-ready"></span>
          <span>Backend Connected on Port 8000</span>
        </div>
        <button class="cupcake-btn outline" (click)="refreshStats()">
          Refresh Statistics
        </button>
      </footer>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
      background: var(--cupcake-bg-gradient, linear-gradient(135deg, #1a1a2e 0%, #16213e 100%));
    }

    .management-layout {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      max-width: 1200px !important;
      padding: 2rem;
    }

    .panel-header { animation: fadeInDown 0.6s ease-out; }
    .cupcake-title { font-size: 1.75rem; font-weight: 700; margin: 0; color: #fff; }
    .cupcake-subtitle { color: var(--cupcake-text-muted); font-size: 0.875rem; margin-top: 0.25rem; }

    .panel-main { flex: 1; min-height: 0; }

    .dashboard-grid {
      display: grid;
      grid-template-columns: 320px 1fr;
      gap: 2rem;
      height: 100%;
    }

    .section-title {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--cupcake-primary);
      margin-bottom: 1rem;
    }

    .stats-sidebar { display: flex; flex-direction: column; gap: 1.5rem; }
    .stats-cards { display: flex; flex-direction: column; gap: 0.75rem; }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem !important;
      margin-bottom: 0 !important;
      background: rgba(255, 255, 255, 0.03) !important;
      border: 1px solid rgba(255, 255, 255, 0.05) !important;
      transition: transform 0.2s;
    }

    .stat-card:hover { transform: translateX(5px); background: rgba(255, 255, 255, 0.05) !important; }
    .stat-card.primary { border-left: 3px solid var(--cupcake-primary) !important; }

    .stat-icon { font-size: 1.5rem; }
    .stat-body { display: flex; flex-direction: column; }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: #fff; line-height: 1.2; }
    .stat-label { font-size: 0.75rem; color: var(--cupcake-text-muted); }

    .ontology-box { background: rgba(0, 0, 0, 0.2) !important; margin-bottom: 0 !important; }
    .box-title { font-size: 0.8125rem; font-weight: 600; margin-bottom: 1rem; color: #888; }

    .ontology-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .ontology-pill {
      display: flex;
      align-items: center;
      background: rgba(255, 255, 255, 0.04);
      padding: 0.375rem 0.75rem;
      border-radius: 20px;
      font-size: 0.6875rem;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .pill-divider { width: 1px; height: 10px; background: rgba(255, 255, 255, 0.1); margin: 0 0.5rem; }
    .pill-name { color: var(--cupcake-text-muted); font-weight: 600; }
    .pill-count { color: var(--cupcake-primary); font-weight: 700; }

    .actions-column { display: flex; flex-direction: column; gap: 1.5rem; min-width: 0; }
    .command-grid { display: flex; flex-direction: column; gap: 0.75rem; }

    .command-card {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      padding: 1rem 1.25rem !important;
      margin-bottom: 0 !important;
      background: rgba(255, 255, 255, 0.02) !important;
      border: 1px solid rgba(255, 255, 255, 0.05) !important;
      transition: all 0.3s;
    }

    .command-card.running { border-color: var(--cupcake-primary) !important; background: rgba(76, 175, 80, 0.05) !important; }

    .command-icon-wrapper {
      width: 40px; height: 40px; border-radius: 8px; background: rgba(255, 255, 255, 0.04);
      display: flex; align-items: center; justify-content: center; font-size: 1.25rem;
    }

    .command-content { flex: 1; min-width: 0; }
    .command-main { display: flex; align-items: center; gap: 0.75rem; }
    .command-name { font-weight: 600; font-size: 0.9375rem; }
    .badge-success { font-size: 0.625rem; font-weight: 700; padding: 0.125rem 0.5rem; background: rgba(76, 175, 80, 0.15); color: #4caf50; border-radius: 10px; text-transform: uppercase; }
    .command-desc { font-size: 0.75rem; color: var(--cupcake-text-muted); margin-top: 0.125rem; }

    .action-btn { padding: 0.5rem 1.25rem !important; font-size: 0.8125rem !important; }
    .action-btn.secondary { background: rgba(255, 255, 255, 0.05) !important; border: 1px solid rgba(255, 255, 255, 0.1) !important; color: #fff !important; }
    .action-btn.secondary:hover { background: rgba(255, 255, 255, 0.1) !important; }

    .terminal-section {
      flex: 1; display: flex; flex-direction: column; background: #0c0c14 !important;
      border: 1px solid rgba(255, 255, 255, 0.05) !important; padding: 0 !important; overflow: hidden;
    }

    .terminal-header {
      padding: 0.75rem 1.25rem; background: rgba(255, 255, 255, 0.02);
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      display: flex; justify-content: space-between; align-items: center;
    }

    .terminal-title { font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; color: #555; letter-spacing: 0.5px; }
    .btn-clear { background: transparent; border: none; color: #444; font-size: 0.6875rem; cursor: pointer; }
    .btn-clear:hover { color: #888; }

    .terminal-viewport {
      flex: 1; padding: 1rem; overflow-y: auto; font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 0.75rem;
    }

    .terminal-placeholder { color: #333; height: 100%; display: flex; align-items: center; justify-content: center; }
    .terminal-line { display: flex; gap: 0.75rem; padding: 0.125rem 0; }
    .line-caret { color: var(--cupcake-primary); opacity: 0.5; }
    .line-text { color: #aaa; }
    .terminal-line.error .line-text { color: #f44336; }
    .terminal-line.success .line-text { color: #4caf50; }

    .panel-footer {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1rem 1.5rem !important; background: rgba(255, 255, 255, 0.02) !important; margin-bottom: 0 !important;
    }

    .footer-status { display: flex; align-items: center; gap: 0.75rem; font-size: 0.8125rem; color: #555; }
    .dot { width: 8px; height: 8px; border-radius: 50%; }
    .pulse-ready { background: #4caf50; animation: dotPulse 2s infinite; }

    .cupcake-btn.outline { background: transparent; border: 1px solid rgba(255, 255, 255, 0.1); color: #888; padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.8125rem; }
    .cupcake-btn.outline:hover { background: rgba(255, 255, 255, 0.05); color: #fff; border-color: rgba(255, 255, 255, 0.2); }

    .spinner-tiny { width: 12px; height: 12px; border: 2px solid rgba(255, 255, 255, 0.2); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }

    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes dotPulse { 0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(76, 175, 80, 0); } 100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); } }
    @keyframes fadeInDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ManagementComponent implements OnInit, OnDestroy {
  @ViewChild('terminalViewport') private terminalViewport!: ElementRef;
  private wails = inject(WailsService);
  private lastOutputTime = 0;

  constructor() {
    effect(() => {
      const output = this.wails.commandOutput();
      if (output && Date.now() - this.lastOutputTime > 100) {
        this.lastOutputTime = Date.now();
        const type = output.type === 'error' ? 'error' : 'info';
        this.addOutput(output.output, type);
      }
    });
  }

  commands = signal<CommandStatus[]>([
    {
      name: 'sync-schemas',
      displayName: 'SDRF Schema Synchronization',
      description: 'Fetch official metadata schemas from centralized repositories',
      running: false,
      success: null,
      count: null,
      icon: 'bi bi-arrow-repeat'
    },
    {
      name: 'load-column-templates',
      displayName: 'Column Template Provisioning',
      description: 'Import standardized column definitions into local storage',
      running: false,
      success: null,
      count: null,
      icon: 'bi bi-file-earmark-text'
    },
    {
      name: 'load-ontologies',
      displayName: 'Ontology Initialization',
      description: 'Import biological and chemical ontology terminologies',
      running: false,
      success: null,
      count: null,
      icon: 'bi bi-diagram-3'
    }
  ]);

  schemaCount = signal(0);
  columnTemplateCount = signal(0);
  ontologyCounts = signal<Record<string, number>>({});

  ontologyTotal = computed(() => this.ontologyCounts()['total'] || 0);

  ontologyBreakdown = computed(() => {
    const counts = this.ontologyCounts();
    return ['mondo', 'uberon', 'ncbi', 'chebi', 'psims', 'cell']
      .map(name => ({
        name: name.toUpperCase(),
        count: counts[name] || 0
      }))
      .filter(item => item.count > 0);
  });

  outputLines = signal<{text: string; type: string}[]>([]);

  async ngOnInit(): Promise<void> {
    await this.refreshStats();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  async refreshStats(): Promise<void> {
    try {
      const [schemas, templates, ontologies] = await Promise.all([
        this.wails.getSchemaCount(),
        this.wails.getColumnTemplateCount(),
        this.wails.getOntologyCounts()
      ]);

      this.schemaCount.set(schemas);
      this.columnTemplateCount.set(templates);
      this.ontologyCounts.set(ontologies);

      this.updateCommandCount('sync-schemas', schemas);
      this.updateCommandCount('load-column-templates', templates);
      this.updateCommandCount('load-ontologies', ontologies['total'] || 0);
    } catch (error) {
      console.error('Stat refresh failure:', error);
    }
  }

  private updateCommandCount(name: string, count: number): void {
    this.commands.update(cmds =>
      cmds.map(cmd => cmd.name === name ? { ...cmd, count } : cmd)
    );
  }

  async runCommand(name: string): Promise<void> {
    this.setCommandStatus(name, true);
    this.addOutput(`Initiating ${name} process...`, 'info');

    try {
      switch (name) {
        case 'sync-schemas': await this.wails.runSyncSchemas(); break;
        case 'load-column-templates': await this.wails.runLoadColumnTemplates(); break;
        case 'load-ontologies': await this.wails.runLoadOntologies(); break;
      }

      this.setCommandStatus(name, false, true);
      this.addOutput('Process completed successfully.', 'success');
      await this.refreshStats();
    } catch (error) {
      this.setCommandStatus(name, false, false);
      this.addOutput(`Process failed: ${error}`, 'error');
    }
  }

  private setCommandStatus(name: string, running: boolean, success: boolean | null = null): void {
    this.commands.update(cmds =>
      cmds.map(cmd => cmd.name === name ? { ...cmd, running, success: success ?? cmd.success } : cmd)
    );
  }

  private addOutput(text: string, type: string): void {
    this.outputLines.update(lines => [...lines, { text, type }]);
    setTimeout(() => this.scrollToBottom(), 10);
  }

  private scrollToBottom(): void {
    if (this.terminalViewport) {
      const el = this.terminalViewport.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }
}
