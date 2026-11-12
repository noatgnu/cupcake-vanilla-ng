import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, OnInit, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';

import { Plugin, PluginLifecycleStatus, PluginManifest, PluginPageDef, PluginWidgetUpdate } from '../../models/plugin';
import { PluginService } from '../../services/plugin';
import { WebSocketMessage, WebSocketService } from '../../services/websocket';
import { PluginWidget } from '../plugin-widget/plugin-widget';

export const PLUGIN_SUBSCRIPTION = 'plugin_updates';

export function firstPagePath(manifest: PluginManifest | null | undefined): string | null {
  return manifest?.nav?.[0]?.path ?? manifest?.pages?.[0]?.path ?? null;
}

export function isWidgetUpdate(payload: unknown): payload is PluginWidgetUpdate {
  return !!payload && typeof payload === 'object' && typeof (payload as PluginWidgetUpdate).widget === 'string'
    && 'data' in (payload as object);
}

@Component({
  selector: 'ccc-plugin-page',
  imports: [PluginWidget],
  templateUrl: './plugin-page.html',
  styleUrl: './plugin-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PluginPage implements OnInit {
  private route = inject(ActivatedRoute);
  private pluginService = inject(PluginService);
  private websocket = inject(WebSocketService);
  private destroyRef = inject(DestroyRef);

  plugin = signal<Plugin | null>(null);
  page = signal<PluginPageDef | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  live = signal<Record<string, unknown>>({});
  lifecycleStatus = signal<PluginLifecycleStatus | null>(null);
  progressMessage = signal('');
  lastUpdate = signal<Date | null>(null);
  connected = this.websocket.isConnected;

  private subscribedId: number | null = null;

  constructor() {
    effect(() => {
      const plugin = this.plugin();
      const connected = this.connected();
      untracked(() => {
        if (this.subscribedId !== null && this.subscribedId !== plugin?.id) {
          this.websocket.unsubscribe(PLUGIN_SUBSCRIPTION, { plugin_id: this.subscribedId, scope: 'global' });
          this.subscribedId = null;
        }
        if (plugin && connected) {
          this.websocket.subscribe(PLUGIN_SUBSCRIPTION, { plugin_id: plugin.id, scope: 'global' });
          this.subscribedId = plugin.id;
        }
      });
    });
    this.destroyRef.onDestroy(() => {
      if (this.subscribedId !== null) {
        this.websocket.unsubscribe(PLUGIN_SUBSCRIPTION, { plugin_id: this.subscribedId, scope: 'global' });
      }
    });
    this.websocket.messages$.pipe(takeUntilDestroyed()).subscribe(message => this.receive(message));
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.open(Number(params.get('pluginId')), params.get('pagePath'));
    });
  }

  private open(id: number, path: string | null): void {
    const current = this.plugin();
    if (current && current.id === id) {
      this.showPage(current, path);
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.live.set({});
    this.lastUpdate.set(null);
    this.pluginService.getPlugin(id).subscribe({
      next: p => {
        this.plugin.set(p);
        this.lifecycleStatus.set(p.lifecycleStatus);
        this.progressMessage.set(p.progressMessage);
        this.showPage(p, path);
        this.loading.set(false);
      },
      error: e => { this.error.set(e.message); this.loading.set(false); },
    });
  }

  private showPage(plugin: Plugin, path: string | null): void {
    const wanted = path ?? firstPagePath(plugin.manifestCache);
    this.page.set(plugin.manifestCache?.pages?.find(pg => pg.path === wanted) ?? null);
  }

  statusClass(): string {
    switch (this.lifecycleStatus()) {
      case 'running': return 'text-bg-success';
      case 'error': return 'text-bg-danger';
      case 'stopped': return 'text-bg-secondary';
      default: return 'text-bg-warning';
    }
  }

  receive(message: WebSocketMessage): void {
    const plugin = this.plugin();
    if (!plugin || message['plugin_id'] !== plugin.id) {
      return;
    }
    if (message.type === 'plugin.lifecycle') {
      this.lifecycleStatus.set(message['lifecycle_status'] as PluginLifecycleStatus);
      this.progressMessage.set(String(message['progress_message'] ?? ''));
      return;
    }
    if (message.type === 'plugin.message' && isWidgetUpdate(message['payload'])) {
      const update = message['payload'];
      this.live.update(current => ({ ...current, [update.widget]: update.data }));
      this.lastUpdate.set(new Date());
    }
  }
}
