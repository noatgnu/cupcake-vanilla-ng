import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, OnInit, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';

import { Plugin, PluginLifecycleStatus, PluginPageDef, PluginWidgetUpdate } from '../../models/plugin';
import { PluginService } from '../../services/plugin';
import { WebSocketMessage, WebSocketService } from '../../services/websocket';
import { PluginWidget } from '../plugin-widget/plugin-widget';

export const PLUGIN_SUBSCRIPTION = 'plugin_updates';

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

  constructor() {
    effect(() => {
      const plugin = this.plugin();
      if (plugin && this.connected()) {
        untracked(() => this.websocket.subscribe(PLUGIN_SUBSCRIPTION, { plugin_id: plugin.id, scope: 'global' }));
      }
    });
    this.destroyRef.onDestroy(() => {
      const plugin = this.plugin();
      if (plugin) {
        this.websocket.unsubscribe(PLUGIN_SUBSCRIPTION, { plugin_id: plugin.id, scope: 'global' });
      }
    });
    this.websocket.messages$.pipe(takeUntilDestroyed()).subscribe(message => this.receive(message));
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('pluginId'));
    const path = this.route.snapshot.paramMap.get('pagePath') ?? '';
    this.pluginService.getPlugin(id).subscribe({
      next: p => {
        this.plugin.set(p);
        this.lifecycleStatus.set(p.lifecycleStatus);
        this.progressMessage.set(p.progressMessage);
        const found = p.manifestCache?.pages?.find(pg => pg.path === path) ?? null;
        this.page.set(found);
        this.loading.set(false);
      },
      error: e => { this.error.set(e.message); this.loading.set(false); },
    });
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
