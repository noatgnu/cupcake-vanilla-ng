import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PluginChartData, PluginWidgetDefinition } from '../../models/plugin';
import { PluginRendererService } from '../../services/plugin-renderer';

@Component({
  selector: 'ccc-plugin-chart',
  imports: [CommonModule],
  templateUrl: './plugin-chart.html',
  styleUrl: './plugin-chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PluginChart implements OnInit {
  definition = input.required<PluginWidgetDefinition>();
  baseUrl = input.required<string>();

  data = signal<PluginChartData | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  private renderer = inject(PluginRendererService);

  ngOnInit(): void {
    const endpoint = this.definition().endpoint;
    if (!endpoint) return;
    this.loading.set(true);
    this.renderer.fetch<PluginChartData>(this.baseUrl(), endpoint).subscribe({
      next: d => { this.data.set(d); this.loading.set(false); },
      error: e => { this.error.set(e.message); this.loading.set(false); },
    });
  }
}
