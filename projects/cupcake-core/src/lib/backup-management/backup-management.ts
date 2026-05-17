import { Component, inject, OnInit, OnDestroy, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ApplianceService } from '../services/appliance';
import { BackupLog, BackupRunRequest } from '../models/appliance';

const ALLOWED_PREFIXES = ['/mnt/cupcake-data/', '/opt/cupcake/backups'];

@Component({
  selector: 'ccc-backup-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './backup-management.html',
  styleUrl: './backup-management.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BackupManagement implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private applianceService = inject(ApplianceService);

  logs = signal<BackupLog[]>([]);
  loading = signal(false);
  runLoading = signal(false);
  error = signal<string | null>(null);
  validationError = signal<string | null>(null);

  form: FormGroup;

  hasRunningBackup = computed(() => this.logs().some(l => l.status === 'running'));

  private pollSub: Subscription | null = null;

  constructor() {
    this.form = this.fb.group({
      backupType: ['full'],
      destinationType: ['mounted'],
      customPath: ['/opt/cupcake/backups']
    });
  }

  ngOnInit(): void {
    this.loadLogs();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  get destinationType(): string {
    return this.form.get('destinationType')?.value ?? 'mounted';
  }

  private resolvedDestination(): string {
    return this.destinationType === 'mounted'
      ? '/mnt/cupcake-data/backups'
      : (this.form.get('customPath')?.value ?? '').trim();
  }

  private validateDestination(destination: string): string | null {
    if (!destination) return 'Destination path is required';
    if (!destination.startsWith('/')) return 'Destination must be an absolute path';
    if (destination.includes('/../') || destination.endsWith('/..')) {
      return 'Destination must not contain path traversal';
    }
    const allowed = ALLOWED_PREFIXES.some(p => destination.startsWith(p) || destination === p.replace(/\/$/, ''));
    if (!allowed) {
      return `Destination must be under: ${ALLOWED_PREFIXES.join(' or ')}`;
    }
    return null;
  }

  loadLogs(): void {
    this.loading.set(true);
    this.applianceService.getBackupLogs().subscribe({
      next: (logs) => {
        this.logs.set(logs);
        this.loading.set(false);
        this.maybeStartPolling(logs);
      },
      error: (e) => {
        this.error.set(e?.error?.error ?? e?.error?.detail ?? 'Failed to load backup logs');
        this.loading.set(false);
      }
    });
  }

  runBackup(): void {
    this.validationError.set(null);

    if (this.hasRunningBackup()) {
      this.validationError.set('A backup is already in progress');
      return;
    }

    const destination = this.resolvedDestination();
    const destError = this.validateDestination(destination);
    if (destError) {
      this.validationError.set(destError);
      return;
    }

    const req: BackupRunRequest = {
      backupType: this.form.get('backupType')?.value,
      destination
    };
    this.runLoading.set(true);
    this.error.set(null);
    this.applianceService.runBackup(req).subscribe({
      next: () => {
        this.runLoading.set(false);
        this.loadLogs();
      },
      error: (e) => {
        this.error.set(e?.error?.error ?? e?.error?.detail ?? 'Failed to start backup');
        this.runLoading.set(false);
      }
    });
  }

  formatBytes(bytes: number | null): string {
    if (bytes === null) return '—';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  }

  private maybeStartPolling(logs: BackupLog[]): void {
    const hasRunning = logs.some(l => l.status === 'running');
    if (hasRunning && !this.pollSub) {
      this.pollSub = interval(3000).pipe(
        switchMap(() => this.applianceService.getBackupLogs())
      ).subscribe({
        next: (updated) => {
          this.logs.set(updated);
          if (!updated.some(l => l.status === 'running')) {
            this.stopPolling();
          }
        }
      });
    } else if (!hasRunning) {
      this.stopPolling();
    }
  }

  private stopPolling(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = null;
  }
}
