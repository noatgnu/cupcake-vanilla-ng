import { Injectable, inject, signal } from '@angular/core';
import { AsyncValidationService, MetadataTableTemplateService, MetadataTableTemplate } from '@noatgnu/cupcake-vanilla';
import { ValidationSchema } from '@noatgnu/cupcake-core';

@Injectable({
  providedIn: 'root'
})
export class SchemaContext {
  private validationService = inject(AsyncValidationService);
  private tableTemplateService = inject(MetadataTableTemplateService);

  readonly selectedSchema = signal<string>('default');
  readonly availableSchemas = signal<ValidationSchema[]>([]);
  readonly schemasLoaded = signal(false);

  readonly selectedTableTemplate = signal<MetadataTableTemplate | null>(null);
  readonly availableTableTemplates = signal<MetadataTableTemplate[]>([]);
  readonly tableTemplatesLoaded = signal(false);

  loadSchemas(): void {
    if (this.schemasLoaded()) return;
    this.validationService.getAvailableSchemas().subscribe({
      next: schemas => {
        this.availableSchemas.set(schemas);
        this.schemasLoaded.set(true);
      },
      error: () => this.schemasLoaded.set(true)
    });
  }

  loadTableTemplates(): void {
    if (this.tableTemplatesLoaded()) return;
    this.tableTemplateService.getMetadataTableTemplates({ limit: 10 }).subscribe({
      next: response => {
        this.availableTableTemplates.set(response.results ?? []);
        this.tableTemplatesLoaded.set(true);
      },
      error: () => this.tableTemplatesLoaded.set(true)
    });
  }

  setSchema(schema: string): void {
    this.selectedSchema.set(schema);
    this.selectedTableTemplate.set(null);
  }

  setTableTemplate(templateId: number | null): void {
    if (!templateId) {
      this.selectedTableTemplate.set(null);
      return;
    }
    this.tableTemplateService.getMetadataTableTemplate(templateId).subscribe({
      next: tpl => this.selectedTableTemplate.set(tpl),
      error: () => this.selectedTableTemplate.set(null)
    });
  }
}
