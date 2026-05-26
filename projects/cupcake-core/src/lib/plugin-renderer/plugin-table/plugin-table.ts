import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PluginRecord, PluginWidgetDefinition } from '../../models/plugin';
import { PluginRendererService } from '../../services/plugin-renderer';

@Component({
  selector: 'ccc-plugin-table',
  imports: [CommonModule],
  templateUrl: './plugin-table.html',
  styleUrl: './plugin-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PluginTable implements OnInit {
  definition = input.required<PluginWidgetDefinition>();
  baseUrl = input.required<string>();

  rows = signal<PluginRecord[]>([]);
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
    this.renderer.fetch<PluginRecord[]>(this.baseUrl(), endpoint).subscribe({
      next: d => { this.rows.set(Array.isArray(d) ? d : []); this.loading.set(false); },
      error: e => { this.error.set(e.message); this.loading.set(false); },
    });
  }
}
