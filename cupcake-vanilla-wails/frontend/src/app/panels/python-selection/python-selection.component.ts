import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WailsService, PythonCandidate, ValidationResult } from '../../core/services/wails.service';

@Component({
  selector: 'app-python-selection',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="cupcake-container py-selection-layout">
      <header class="panel-header">
        <h1 class="cupcake-title">Python Setup</h1>
        <p class="cupcake-subtitle">Choose a Python interpreter for the backend services</p>
      </header>

      <main class="panel-main">
        @if (loading()) {
          <div class="cupcake-card loading-state">
            <div class="spinner-large"></div>
            <p>Scanning system for Python installations...</p>
          </div>
        } @else {
          <section class="selection-section">
            <h2 class="section-title">Detected Installations</h2>
            <div class="candidates-grid">
              @for (candidate of candidates(); track candidate.path) {
                <div
                  class="candidate-card"
                  [class.active]="selectedPath() === candidate.path"
                  (click)="selectCandidate(candidate)"
                >
                  <div class="card-status">
                    <span class="status-dot"></span>
                  </div>
                  <div class="card-body">
                    <span class="version-label">Python {{ candidate.version }}</span>
                    <code class="path-label">{{ candidate.path }}</code>
                  </div>
                  @if (selectedPath() === candidate.path) {
                    <div class="selection-badge">
                      <i class="bi bi-check-circle-fill"></i>
                    </div>
                  }
                </div>
              }
            </div>
          </section>

          <section class="cupcake-card custom-section">
            <h2 class="section-title">Manual Path</h2>
            <div class="input-group-custom">
              <input
                type="text"
                class="cupcake-input"
                [(ngModel)]="customPath"
                placeholder="e.g. /usr/bin/python3 or C:\\Python311\\python.exe"
                (input)="onCustomPathChange()"
              />
              <div class="input-actions">
                <button class="btn-icon" (click)="browseForPython()" title="Browse files">
                  <i class="bi bi-folder2-open"></i>
                </button>
                <button class="btn-verify" [disabled]="!customPath" (click)="verifyCustomPath()">
                  Verify
                </button>
              </div>
            </div>

            @if (validationResult()) {
              <div class="validation-banner" [class.valid]="validationResult()?.valid" [class.invalid]="!validationResult()?.valid">
                <span class="banner-icon">
                  {{ validationResult()?.valid ? '✓' : '⚠' }}
                </span>
                <span class="banner-text">{{ validationResult()?.message }}</span>
              </div>
            }
          </section>
        }
      </main>

      <footer class="panel-footer cupcake-card">
        <div class="footer-options">
          <label class="cupcake-checkbox">
            <input type="checkbox" [(ngModel)]="createNewVenv" />
            <span class="checkbox-label">Initialize isolated virtual environment (.venv)</span>
          </label>
        </div>
        <div class="footer-actions">
          <button
            class="cupcake-btn primary btn-proceed"
            [disabled]="!canProceed()"
            (click)="proceed()"
          >
            Continue to Setup
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

    .py-selection-layout {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      max-width: 800px !important;
      padding: 2rem;
    }

    .panel-header {
      animation: fadeInDown 0.6s ease-out;
    }

    .cupcake-title {
      font-size: 1.75rem;
      font-weight: 700;
      margin: 0;
      color: #fff;
    }

    .cupcake-subtitle {
      color: var(--cupcake-text-muted);
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .panel-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      min-height: 0;
      overflow-y: auto;
      padding-right: 4px;
    }

    .section-title {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--cupcake-primary);
      margin-bottom: 0.75rem;
    }

    .candidates-grid {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .candidate-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      cursor: pointer;
      position: relative;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .candidate-card:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.15);
      transform: translateX(4px);
    }

    .candidate-card.active {
      background: rgba(76, 175, 80, 0.08);
      border-color: var(--cupcake-primary);
      box-shadow: 0 0 15px rgba(76, 175, 80, 0.1);
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
    }

    .candidate-card.active .status-dot {
      background: var(--cupcake-primary);
      box-shadow: 0 0 8px var(--cupcake-primary);
    }

    .card-body {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-width: 0;
    }

    .version-label {
      font-weight: 600;
      font-size: 0.9375rem;
    }

    .path-label {
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 0.75rem;
      color: var(--cupcake-text-muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .selection-badge {
      margin-left: auto;
      color: var(--cupcake-primary);
      font-size: 1.25rem;
    }

    .custom-section {
      background: rgba(0, 0, 0, 0.2) !important;
    }

    .input-group-custom {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    .cupcake-input {
      flex: 1;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 0.75rem 1rem;
      color: #fff;
      font-family: inherit;
      outline: none;
      transition: border-color 0.2s;
    }

    .cupcake-input:focus {
      border-color: var(--cupcake-primary);
    }

    .input-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-icon {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #fff;
      padding: 0.75rem;
      border-radius: 8px;
      cursor: pointer;
    }

    .btn-verify {
      background: var(--cupcake-secondary, #3182ce);
      color: #fff;
      border: none;
      padding: 0.75rem 1.25rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-verify:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .validation-banner {
      margin-top: 1rem;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.8125rem;
      animation: fadeIn 0.3s ease-out;
    }

    .validation-banner.valid {
      background: rgba(76, 175, 80, 0.1);
      border: 1px solid rgba(76, 175, 80, 0.2);
      color: #4caf50;
    }

    .validation-banner.invalid {
      background: rgba(244, 67, 54, 0.1);
      border: 1px solid rgba(244, 67, 54, 0.2);
      color: #f44336;
    }

    .panel-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.5rem !important;
      background: rgba(255, 255, 255, 0.02) !important;
      margin-bottom: 0 !important;
    }

    .cupcake-checkbox {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
      font-size: 0.875rem;
      color: var(--cupcake-text-muted);
    }

    .checkbox-label {
      transition: color 0.2s;
    }

    .cupcake-checkbox:hover .checkbox-label {
      color: #fff;
    }

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

    .cupcake-btn.primary:hover:not(:disabled) {
      filter: brightness(1.1);
      transform: translateY(-1px);
    }

    .cupcake-btn.primary:disabled {
      background: #444;
      cursor: not-allowed;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1.5rem;
      padding: 4rem 2rem !important;
      text-align: center;
    }

    .spinner-large {
      width: 48px;
      height: 48px;
      border: 4px solid rgba(255, 255, 255, 0.05);
      border-top-color: var(--cupcake-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeInDown {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `]
})
export class PythonSelectionComponent implements OnInit {
  private wails = inject(WailsService);

  loading = signal(true);
  candidates = signal<PythonCandidate[]>([]);
  selectedPath = signal<string>('');
  customPath = '';
  createNewVenv = true;
  validationResult = signal<ValidationResult | null>(null);

  canProceed = computed(() => {
    return this.selectedPath() !== '' ||
           (this.customPath !== '' && this.validationResult()?.valid === true);
  });

  async ngOnInit(): Promise<void> {
    try {
      const candidates = await this.wails.detectPythonCandidates();
      this.candidates.set(candidates);

      if (candidates.length > 0) {
        this.selectedPath.set(candidates[0].path);
      }
    } finally {
      this.loading.set(false);
    }
  }

  selectCandidate(candidate: PythonCandidate): void {
    this.selectedPath.set(candidate.path);
    this.customPath = '';
    this.validationResult.set(null);
  }

  onCustomPathChange(): void {
    this.selectedPath.set('');
    this.validationResult.set(null);
  }

  async browseForPython(): Promise<void> {
    const path = await this.wails.openFile('Select Python executable');
    if (path) {
      this.customPath = path;
      this.selectedPath.set('');
      await this.verifyCustomPath();
    }
  }

  async verifyCustomPath(): Promise<void> {
    if (!this.customPath) return;

    const result = await this.wails.verifyPython(this.customPath);
    this.validationResult.set(result);

    if (result.valid) {
      this.selectedPath.set('');
    }
  }

  async proceed(): Promise<void> {
    const pythonPath = this.selectedPath() || this.customPath;
    if (!pythonPath) return;

    await this.wails.selectPython(pythonPath, this.createNewVenv);
  }
}
