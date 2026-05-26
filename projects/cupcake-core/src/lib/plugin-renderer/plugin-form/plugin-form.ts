import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PluginFormResponse, PluginWidgetDefinition } from '../../models/plugin';
import { PluginRendererService } from '../../services/plugin-renderer';

@Component({
  selector: 'ccc-plugin-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './plugin-form.html',
  styleUrl: './plugin-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PluginForm {
  definition = input.required<PluginWidgetDefinition>();
  baseUrl = input.required<string>();

  formData = signal<Record<string, string>>({});
  submitting = signal(false);
  result = signal<PluginFormResponse | null>(null);
  error = signal<string | null>(null);

  private renderer = inject(PluginRendererService);

  getFields(): string[] {
    return this.definition().fields ?? [];
  }

  getValue(field: string): string {
    return this.formData()[field] ?? '';
  }

  setValue(field: string, value: string): void {
    this.formData.update(d => ({ ...d, [field]: value }));
  }

  submit(): void {
    const endpoint = this.definition().endpoint;
    if (!endpoint) return;
    this.submitting.set(true);
    this.error.set(null);
    this.result.set(null);
    this.renderer.submit<PluginFormResponse>(this.baseUrl(), endpoint, this.formData()).subscribe({
      next: r => { this.result.set(r); this.submitting.set(false); },
      error: e => { this.error.set(e.message); this.submitting.set(false); },
    });
  }
}
