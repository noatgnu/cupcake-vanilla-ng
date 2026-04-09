import { Component, inject, signal, output, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@noatgnu/cupcake-core';
import { ExcelLaunchService } from '@noatgnu/cupcake-vanilla';
import { SyncService } from '../../core/services/sync.service';

const REMEMBER_ME_KEY = 'cupcake-excel-remember-me';
const PENDING_TABLE_KEY = 'cupcake-excel-pending-table';

type LoginMode = 'credentials' | 'launchCode';

@Component({
  selector: 'app-compact-login',
  imports: [FormsModule],
  templateUrl: './compact-login.html',
  styleUrl: './compact-login.scss',
})
export class CompactLogin implements OnInit {
  private authService = inject(AuthService);
  private launchService = inject(ExcelLaunchService);
  private syncService = inject(SyncService);

  readonly mode = signal<LoginMode>('credentials');
  readonly username = signal('');
  readonly password = signal('');
  readonly launchCode = signal('');
  readonly rememberMe = signal(true);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly loginSuccess = output<void>();
  readonly tableReady = output<number>();

  ngOnInit(): void {
    const saved = localStorage.getItem(REMEMBER_ME_KEY);
    if (saved !== null) {
      this.rememberMe.set(saved === 'true');
    }
  }

  setMode(mode: LoginMode): void {
    this.mode.set(mode);
    this.error.set(null);
  }

  onSubmit(): void {
    if (this.mode() === 'launchCode') {
      this.submitLaunchCode();
    } else {
      this.submitCredentials();
    }
  }

  private submitCredentials(): void {
    if (!this.username() || !this.password()) {
      this.error.set('Please enter username and password');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    localStorage.setItem(REMEMBER_ME_KEY, this.rememberMe().toString());

    this.authService.login(this.username(), this.password(), this.rememberMe()).subscribe({
      next: () => {
        this.loading.set(false);
        this.checkPendingTable();
        this.loginSuccess.emit();
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.detail || 'Login failed');
      }
    });
  }

  private submitLaunchCode(): void {
    const code = this.launchCode().trim().toUpperCase();
    if (!code) {
      this.error.set('Please enter a launch code');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.launchService.claimLaunchCode(code).subscribe({
      next: (response) => {
        localStorage.setItem('ccvAccessToken', response.accessToken);
        localStorage.setItem('ccvRefreshToken', response.refreshToken);

        if (response.tableId) {
          localStorage.setItem(PENDING_TABLE_KEY, response.tableId.toString());
        }

        this.loading.set(false);
        this.loginSuccess.emit();

        if (response.tableId) {
          this.tableReady.emit(response.tableId);
        }
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 410) {
          this.error.set('Launch code has expired. Please generate a new one.');
        } else if (err.status === 400) {
          this.error.set('Invalid launch code');
        } else {
          this.error.set(err.error?.detail || 'Failed to verify launch code');
        }
      }
    });
  }

  private checkPendingTable(): void {
    const pendingTableId = localStorage.getItem(PENDING_TABLE_KEY);
    if (pendingTableId) {
      localStorage.removeItem(PENDING_TABLE_KEY);
      this.tableReady.emit(parseInt(pendingTableId, 10));
    }
  }

  clearError(): void {
    this.error.set(null);
  }
}
