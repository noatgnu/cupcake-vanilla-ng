import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WailsService } from '../../core/services/wails.service';

@Component({
  selector: 'app-superuser',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="cupcake-container superuser-layout">
      <div class="cupcake-card auth-card animate-slide-up">
        <header class="auth-header">
          <div class="icon-circle">
            <i class="bi bi-shield-lock-fill"></i>
          </div>
          <h1 class="cupcake-title">Administrative Setup</h1>
          <p class="cupcake-subtitle">Create the primary superuser account for backend access</p>
        </header>

        <main class="auth-form">
          <div class="form-grid">
            <div class="cupcake-form-group">
              <label class="cupcake-label" for="username">Username</label>
              <div class="input-wrapper">
                <i class="bi bi-person input-icon"></i>
                <input
                  id="username"
                  class="cupcake-input"
                  type="text"
                  [(ngModel)]="username"
                  placeholder="e.g. administrator"
                  [disabled]="creating()"
                />
              </div>
            </div>

            <div class="cupcake-form-group">
              <label class="cupcake-label" for="email">Email Address</label>
              <div class="input-wrapper">
                <i class="bi bi-envelope input-icon"></i>
                <input
                  id="email"
                  class="cupcake-input"
                  type="email"
                  [(ngModel)]="email"
                  placeholder="admin@cupcake.io"
                  [disabled]="creating()"
                />
              </div>
            </div>

            <div class="cupcake-form-group">
              <label class="cupcake-label" for="password">Password</label>
              <div class="input-wrapper">
                <i class="bi bi-key input-icon"></i>
                <input
                  id="password"
                  class="cupcake-input"
                  type="password"
                  [(ngModel)]="password"
                  placeholder="At least 8 characters"
                  [disabled]="creating()"
                />
              </div>
            </div>

            <div class="cupcake-form-group">
              <label class="cupcake-label" for="confirmPassword">Confirm Password</label>
              <div class="input-wrapper">
                <i class="bi bi-shield-check input-icon"></i>
                <input
                  id="confirmPassword"
                  class="cupcake-input"
                  type="password"
                  [(ngModel)]="confirmPassword"
                  placeholder="Repeat your password"
                  [disabled]="creating()"
                />
              </div>
            </div>
          </div>

          @if (error()) {
            <div class="banner error-banner animate-fade-in">
              <i class="bi bi-exclamation-circle banner-icon"></i>
              <span class="banner-text">{{ error() }}</span>
            </div>
          }

          @if (success()) {
            <div class="banner success-banner animate-fade-in">
              <i class="bi bi-check-circle-fill banner-icon"></i>
              <span class="banner-text">Administrator account provisioned successfully.</span>
            </div>
          }
        </main>

        <footer class="auth-footer">
          <button class="cupcake-btn outline" (click)="skip()" [disabled]="creating()">
            Skip for now
          </button>
          <button
            class="cupcake-btn primary"
            (click)="create()"
            [disabled]="!isValid() || creating()"
          >
            @if (creating()) {
              <span class="spinner-tiny"></span>
              Provisioning
            } @else {
              Create Account
            }
          </button>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
      background: var(--cupcake-bg-gradient, linear-gradient(135deg, #1a1a2e 0%, #16213e 100%));
    }

    .superuser-layout {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .auth-card {
      width: 100%;
      max-width: 500px;
      padding: 2.5rem !important;
      background: rgba(255, 255, 255, 0.03) !important;
      border: 1px solid rgba(255, 255, 255, 0.08) !important;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4) !important;
    }

    .auth-header {
      text-align: center;
      margin-bottom: 2.5rem;
    }

    .icon-circle {
      width: 64px;
      height: 64px;
      background: rgba(76, 175, 80, 0.1);
      color: var(--cupcake-primary);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
      margin: 0 auto 1.5rem;
      border: 1px solid rgba(76, 175, 80, 0.2);
    }

    .cupcake-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #fff;
      margin: 0;
    }

    .cupcake-subtitle {
      font-size: 0.875rem;
      color: var(--cupcake-text-muted);
      margin-top: 0.5rem;
      line-height: 1.4;
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.25rem;
    }

    .cupcake-form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .cupcake-label {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #555;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 1rem;
      color: #444;
      font-size: 1rem;
    }

    .cupcake-input {
      width: 100%;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 0.75rem 1rem 0.75rem 2.75rem;
      color: #fff;
      font-size: 0.9375rem;
      outline: none;
      transition: all 0.2s;
    }

    .cupcake-input:focus {
      border-color: var(--cupcake-primary);
      background: rgba(255, 255, 255, 0.04);
      box-shadow: 0 0 0 4px rgba(76, 175, 80, 0.1);
    }

    .banner {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      border-radius: 8px;
      font-size: 0.8125rem;
    }

    .error-banner { background: rgba(244, 67, 54, 0.1); border: 1px solid rgba(244, 67, 54, 0.2); color: #f44336; }
    .success-banner { background: rgba(76, 175, 80, 0.1); border: 1px solid rgba(76, 175, 80, 0.2); color: #4caf50; }

    .auth-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2.5rem;
    }

    .cupcake-btn {
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .cupcake-btn.primary { background: var(--cupcake-primary); color: #fff; border: none; }
    .cupcake-btn.primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .cupcake-btn.outline { background: transparent; border: 1px solid rgba(255, 255, 255, 0.1); color: #888; }
    .cupcake-btn.outline:hover { background: rgba(255, 255, 255, 0.05); color: #fff; }

    .spinner-tiny {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      display: inline-block;
      margin-right: 0.5rem;
      vertical-align: middle;
    }

    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .animate-slide-up { animation: slideUp 0.5s ease-out; }
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
  `]
})
export class SuperuserComponent {
  private wails = inject(WailsService);

  username = '';
  email = '';
  password = '';
  confirmPassword = '';

  creating = signal(false);
  error = signal<string | null>(null);
  success = signal(false);

  isValid(): boolean {
    if (!this.username || !this.email || !this.password || !this.confirmPassword) return false;
    return this.password === this.confirmPassword && this.password.length >= 8;
  }

  async create(): Promise<void> {
    if (!this.isValid()) {
      this.error.set(this.password !== this.confirmPassword ? 'Passwords do not match' : 'Password too short');
      return;
    }

    this.creating.set(true);
    this.error.set(null);

    try {
      await this.wails.createSuperuser(this.username, this.email, this.password);
      this.success.set(true);
      setTimeout(() => this.wails.dismissSuperuserCreation(), 1500);
    } catch (err) {
      this.error.set(`Provisioning failed: ${err}`);
    } finally {
      this.creating.set(false);
    }
  }

  skip(): void { this.wails.dismissSuperuserCreation(); }
}
