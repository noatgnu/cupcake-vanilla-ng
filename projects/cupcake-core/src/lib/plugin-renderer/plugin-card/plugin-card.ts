import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PluginCardData, PluginWidgetDefinition } from '../../models/plugin';
import { PluginRendererService } from '../../services/plugin-renderer';

@Component({
  selector: 'ccc-plugin-card',
  imports: [CommonModule],
  templateUrl: './plugin-card.html',
  styleUrl: './plugin-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PluginCard implements OnInit {
  definition = input.required<PluginWidgetDefinition>();
  baseUrl = input.required<string>();

  data = signal<PluginCardData | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  private renderer = inject(PluginRendererService);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const endpoint = this.definition().endpoint;
    if (!endpoint) return;
    this.loading.set(true);
    this.error.set(null);
    this.renderer.fetch<PluginCardData>(this.baseUrl(), endpoint).subscribe({
      next: d => { this.data.set(d); this.loading.set(false); },
      error: e => { this.error.set(e.message); this.loading.set(false); },
    });
  }
}
