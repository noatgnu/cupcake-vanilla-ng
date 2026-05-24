import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { DeviceTokenService } from '../../services/device-token';
import { DeviceToken, DeviceTokenCreate } from '../../models/device-token';

@Component({
  selector: 'ccc-device-token-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './device-token-management.html',
  styleUrl: './device-token-management.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeviceTokenManagement {
  private service = inject(DeviceTokenService);
  private fb = inject(FormBuilder);
  private modal = inject(NgbModal);

  tokens = signal<DeviceToken[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  newTokenValue = signal<string | null>(null);

  createForm = this.fb.group({
    label: ['', Validators.required],
    description: [''],
    permission: ['read' as 'read' | 'write', Validators.required],
    expiresAt: [null as string | null],
  });

  activeCount = computed(() => this.tokens().filter(t => t.enabled && !t.isExpired).length);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service.list().subscribe({
      next: res => {
        this.tokens.set(res.results);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load device tokens.');
        this.loading.set(false);
      },
    });
  }

  openCreate(content: unknown): void {
    this.createForm.reset({ label: '', description: '', permission: 'read', expiresAt: null });
    this.newTokenValue.set(null);
    this.modal.open(content, { size: 'md' });
  }

  submitCreate(modalRef: NgbModalRef): void {
    if (this.createForm.invalid) return;
    const payload = this.createForm.value as DeviceTokenCreate;
    this.service.create(payload).subscribe({
      next: created => {
        this.newTokenValue.set(created.token);
        this.tokens.update(list => [created, ...list]);
      },
      error: () => this.error.set('Failed to create token.'),
    });
  }

  toggle(token: DeviceToken): void {
    this.service.toggle(token.id).subscribe({
      next: res => {
        this.tokens.update(list =>
          list.map(t => t.id === token.id ? { ...t, enabled: res.enabled } : t)
        );
      },
      error: () => this.error.set('Failed to toggle token.'),
    });
  }

  rotate(token: DeviceToken, content: unknown): void {
    this.newTokenValue.set(null);
    this.service.rotate(token.id).subscribe({
      next: res => {
        this.newTokenValue.set(res.token);
        this.modal.open(content, { size: 'md' });
      },
      error: () => this.error.set('Failed to rotate token.'),
    });
  }

  remove(token: DeviceToken): void {
    this.service.remove(token.id).subscribe({
      next: () => this.tokens.update(list => list.filter(t => t.id !== token.id)),
      error: () => this.error.set('Failed to delete token.'),
    });
  }

  copyToken(value: string): void {
    navigator.clipboard.writeText(value).catch(() => {});
  }
}
