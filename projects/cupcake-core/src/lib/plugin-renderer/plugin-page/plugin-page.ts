import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Plugin, PluginPageDef } from '../../models/plugin';
import { PluginService } from '../../services/plugin';
import { PluginWidget } from '../plugin-widget/plugin-widget';

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

  plugin = signal<Plugin | null>(null);
  page = signal<PluginPageDef | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('pluginId'));
    const path = this.route.snapshot.paramMap.get('pagePath') ?? '';
    this.pluginService.getPlugin(id).subscribe({
      next: p => {
        this.plugin.set(p);
        const found = p.manifestCache?.pages?.find(pg => pg.path === path) ?? null;
        this.page.set(found);
        this.loading.set(false);
      },
      error: e => { this.error.set(e.message); this.loading.set(false); },
    });
  }
}
