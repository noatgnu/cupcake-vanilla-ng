import { Component, inject, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApplianceService } from '../services/appliance';
import { BlockDevice, StorageConfig, StorageStatus } from '../models/appliance';

const SHELL_UNSAFE = /[;&|`$\\\n\r\x00]/;

@Component({
  selector: 'ccc-storage-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './storage-management.html',
  styleUrl: './storage-management.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StorageManagement implements OnInit {
  private fb = inject(FormBuilder);
  private applianceService = inject(ApplianceService);

  status = signal<StorageStatus | null>(null);
  blockDevices = signal<BlockDevice[]>([]);
  loading = signal(false);
  applyLoading = signal(false);
  unmountLoading = signal(false);
  scanLoading = signal(false);
  output = signal<string | null>(null);
  error = signal<string | null>(null);
  validationError = signal<string | null>(null);

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      mountType: ['usb', Validators.required],
      label: [''],
      host: [''],
      share: [''],
      username: [''],
      password: ['']
    });
  }

  ngOnInit(): void {
    this.loadStatus();
  }

  get mountType(): string {
    return this.form.get('mountType')?.value ?? 'usb';
  }

  loadStatus(): void {
    this.loading.set(true);
    this.error.set(null);
    this.applianceService.getStorageStatus().subscribe({
      next: (s) => {
        this.status.set(s);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(e?.error?.error ?? e?.error?.detail ?? 'Failed to load storage status');
        this.loading.set(false);
      }
    });
  }

  scanDevices(): void {
    this.scanLoading.set(true);
    this.applianceService.getBlockDevices().subscribe({
      next: (res) => {
        this.blockDevices.set(res.devices);
        this.scanLoading.set(false);
      },
      error: () => {
        this.scanLoading.set(false);
      }
    });
  }

  private validateConfig(): string | null {
    const v = this.form.value;
    const type: string = v.mountType;
    if (!['usb', 'nfs', 'smb'].includes(type)) {
      return 'Invalid mount type';
    }
    const required: Record<string, string[]> = {
      usb: ['label'],
      nfs: ['host', 'share'],
      smb: ['host', 'share'],
    };
    for (const field of required[type]) {
      const val: string = (v[field] ?? '').trim();
      if (!val) return `${field} is required for ${type} mount`;
      if (SHELL_UNSAFE.test(val)) return `${field} contains invalid characters`;
    }
    for (const field of ['host', 'share', 'label', 'username', 'password']) {
      const val: string = v[field] ?? '';
      if (val && SHELL_UNSAFE.test(val)) return `${field} contains invalid characters`;
    }
    return null;
  }

  applyStorage(): void {
    this.validationError.set(null);
    const err = this.validateConfig();
    if (err) {
      this.validationError.set(err);
      return;
    }
    const config: StorageConfig = this.form.value;
    this.applyLoading.set(true);
    this.output.set(null);
    this.error.set(null);
    this.applianceService.applyStorage(config).subscribe({
      next: (res) => {
        this.output.set(res.output);
        this.applyLoading.set(false);
        this.loadStatus();
      },
      error: (e) => {
        this.error.set(e?.error?.error ?? e?.error?.detail ?? 'Failed to apply storage configuration');
        this.applyLoading.set(false);
      }
    });
  }

  unmountStorage(): void {
    if (!this.status()?.mounted) return;
    this.unmountLoading.set(true);
    this.output.set(null);
    this.error.set(null);
    this.applianceService.unmountStorage().subscribe({
      next: (res) => {
        this.output.set(res.output);
        this.unmountLoading.set(false);
        this.loadStatus();
      },
      error: (e) => {
        this.error.set(e?.error?.error ?? e?.error?.detail ?? 'Failed to unmount storage');
        this.unmountLoading.set(false);
      }
    });
  }
}
