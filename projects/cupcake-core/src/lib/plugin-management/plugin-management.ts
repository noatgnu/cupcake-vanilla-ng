import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, Observable } from 'rxjs';

import { InstalledPlugin, PluginPackagePreview, PluginServiceCommand } from '../models/appliance';
import { Plugin } from '../models/plugin';
import { ApplianceService } from '../services/appliance';
import { ConfirmDialogService } from '../services/confirm-dialog';
import { PluginService } from '../services/plugin';
import { ToastService } from '../services/toast';

export const STARTUP_RECHECK_MS = 4000;

export interface PluginRow {
  name: string;
  displayName: string;
  version: string;
  plugin: Plugin | null;
  service: InstalledPlugin | null;
}

export function errorText(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    return error.error?.error ?? error.error?.detail ?? fallback;
  }
  return fallback;
}

@Component({
  selector: 'ccc-plugin-management',
  imports: [DatePipe],
  templateUrl: './plugin-management.html',
  styleUrl: './plugin-management.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PluginManagement implements OnInit {
  private appliance = inject(ApplianceService);
  private plugins = inject(PluginService);
  private toast = inject(ToastService);
  private confirmDialog = inject(ConfirmDialogService);
  private destroyRef = inject(DestroyRef);

  registered = signal<Plugin[]>([]);
  installed = signal<InstalledPlugin[]>([]);
  loading = signal(false);
  uploading = signal(false);
  installing = signal(false);
  preview = signal<PluginPackagePreview | null>(null);
  busy = signal<Record<string, string>>({});

  rows = computed<PluginRow[]>(() => {
    const byName = new Map<string, PluginRow>();
    for (const plugin of this.registered()) {
      byName.set(plugin.name, { name: plugin.name, displayName: plugin.displayName, version: plugin.version, plugin, service: null });
    }
    for (const service of this.installed()) {
      const row = byName.get(service.name);
      if (row) {
        row.service = service;
      } else {
        byName.set(service.name, { name: service.name, displayName: service.name, version: '', plugin: null, service });
      }
    }
    return [...byName.values()].sort((a, b) => a.displayName.localeCompare(b.displayName));
  });

  private recheck: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.recheck) clearTimeout(this.recheck);
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    forkJoin({ registered: this.plugins.listPlugins(), installed: this.appliance.listInstalledPlugins() }).subscribe({
      next: ({ registered, installed }) => {
        this.registered.set(registered);
        this.installed.set(installed.plugins);
        this.loading.set(false);
      },
      error: error => {
        this.toast.error(errorText(error, 'Could not read the plugins'));
        this.loading.set(false);
      },
    });
  }

  choose(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.uploading.set(true);
    this.preview.set(null);
    this.appliance.uploadPluginPackage(file).subscribe({
      next: preview => {
        this.preview.set(preview);
        this.uploading.set(false);
      },
      error: error => {
        this.toast.error(errorText(error, 'The package could not be uploaded'));
        this.uploading.set(false);
      },
    });
  }

  install(): void {
    const preview = this.preview();
    if (!preview) return;
    this.installing.set(true);
    this.appliance.installPluginPackage(preview.uploadId).subscribe({
      next: installed => {
        this.toast.success(`${preview.displayName} ${preview.version} installed on port ${installed.port}`);
        this.preview.set(null);
        this.installing.set(false);
        this.reloadAfterStartup();
      },
      error: error => {
        this.toast.error(errorText(error, 'The plugin could not be installed'));
        this.installing.set(false);
        this.load();
      },
    });
  }

  cancel(): void {
    this.preview.set(null);
  }

  control(row: PluginRow, command: PluginServiceCommand): void {
    this.run(row, command, this.appliance.controlPlugin(row.name, command), `${row.displayName}: ${command} done`);
  }

  checkConnection(row: PluginRow): void {
    if (!row.plugin) return;
    this.run(row, 'check', this.plugins.checkConnection(row.plugin.id), `${row.displayName} answered the backend`);
  }

  async uninstall(row: PluginRow): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Uninstall plugin',
      message: `Uninstall ${row.displayName}? Its files, settings and registration are removed, including its vocabularies and their terms.`,
      confirmLabel: 'Uninstall',
    });
    if (confirmed) {
      this.run(row, 'uninstall', this.appliance.uninstallPlugin(row.name), `${row.displayName} uninstalled`);
    }
  }

  isBusy(row: PluginRow): boolean {
    return !!this.busy()[row.name];
  }

  private run(row: PluginRow, action: string, request: Observable<unknown>, done: string): void {
    this.busy.update(current => ({ ...current, [row.name]: action }));
    request.subscribe({
      next: () => {
        this.toast.success(done);
        this.finish(row);
        if (action === 'start' || action === 'restart') {
          this.reloadAfterStartup();
        } else {
          this.load();
        }
      },
      error: error => {
        this.toast.error(errorText(error, `${row.displayName}: ${action} failed`));
        this.finish(row);
        this.load();
      },
    });
  }

  private finish(row: PluginRow): void {
    this.busy.update(current => {
      const next = { ...current };
      delete next[row.name];
      return next;
    });
  }

  private reloadAfterStartup(): void {
    this.load();
    if (this.recheck) clearTimeout(this.recheck);
    this.recheck = setTimeout(() => this.load(), STARTUP_RECHECK_MS);
  }
}
