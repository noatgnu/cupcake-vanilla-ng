import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { PluginWidgetDefinition } from '../../models/plugin';

@Component({
  selector: 'ccc-plugin-iframe',
  imports: [],
  templateUrl: './plugin-iframe.html',
  styleUrl: './plugin-iframe.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PluginIframe {
  definition = input.required<PluginWidgetDefinition>();
  baseUrl = input.required<string>();

  constructor(private sanitizer: DomSanitizer) {}

  get safeUrl(): SafeResourceUrl {
    const src = this.definition().src ?? '';
    const url = src.startsWith('http') ? src : `${this.baseUrl()}${src}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
