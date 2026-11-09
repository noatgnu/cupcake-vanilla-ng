import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, OnInit, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PluginRecord, PluginWidgetDefinition } from '../../models/plugin';
import { PluginRendererService } from '../../services/plugin-renderer';
import { pollEvery } from '../polling';

@Component({
  selector: 'ccc-plugin-table',
  imports: [CommonModule],
  templateUrl: './plugin-table.html',
  styleUrl: './plugin-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PluginTable implements OnInit {
  definition = input.required<PluginWidgetDefinition>();
  pluginId = input.required<number>();
  live = input<unknown>(undefined);

  rows = signal<PluginRecord[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  private renderer = inject(PluginRendererService);
  private destroyRef = inject(DestroyRef);
  private loaded = false;

  constructor() {
    effect(() => {
      const v = this.live();
      if (v === undefined) return;
      untracked(() => {
        this.rows.set(Array.isArray(v) ? v as PluginRecord[] : []);
        this.loaded = true;
        this.loading.set(false);
        this.error.set(null);
      });
    });
  }

  ngOnInit(): void {
    this.load();
    pollEvery(this.destroyRef, this.definition().refreshInterval, () => this.load());
  }

  load(): void {
    const endpoint = this.definition().endpoint;
    if (!endpoint) return;
    this.loading.set(!this.loaded);
    this.error.set(null);
    this.renderer.fetch<PluginRecord[]>(this.pluginId(), endpoint).subscribe({
      next: d => { this.rows.set(Array.isArray(d) ? d : []); this.loaded = true; this.loading.set(false); },
      error: e => { this.error.set(e.message); this.loading.set(false); },
    });
  }
}
