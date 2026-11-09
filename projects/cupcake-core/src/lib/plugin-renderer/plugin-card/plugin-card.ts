import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, OnInit, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PluginCardData, PluginWidgetDefinition } from '../../models/plugin';
import { PluginRendererService } from '../../services/plugin-renderer';
import { pollEvery } from '../polling';

@Component({
  selector: 'ccc-plugin-card',
  imports: [CommonModule],
  templateUrl: './plugin-card.html',
  styleUrl: './plugin-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PluginCard implements OnInit {
  definition = input.required<PluginWidgetDefinition>();
  pluginId = input.required<number>();
  live = input<unknown>(undefined);

  data = signal<PluginCardData | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  readonly inPluginOrder = (): number => 0;

  private renderer = inject(PluginRendererService);
  private destroyRef = inject(DestroyRef);
  private loaded = false;

  constructor() {
    effect(() => {
      const v = this.live();
      if (v === undefined) return;
      untracked(() => {
        this.data.set(v as PluginCardData);
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
    this.renderer.fetch<PluginCardData>(this.pluginId(), endpoint).subscribe({
      next: d => { this.data.set(d); this.loaded = true; this.loading.set(false); },
      error: e => { this.error.set(e.message); this.loading.set(false); },
    });
  }
}
