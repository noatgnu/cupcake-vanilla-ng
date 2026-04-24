import { Injectable, inject, signal } from '@angular/core';
import { AsyncValidationService } from '@noatgnu/cupcake-vanilla';
import { ValidationSchema } from '@noatgnu/cupcake-core';

@Injectable({
  providedIn: 'root'
})
export class SchemaContext {
  private validationService = inject(AsyncValidationService);

  readonly selectedSchema = signal<string>('default');
  readonly availableSchemas = signal<ValidationSchema[]>([]);
  readonly schemasLoaded = signal(false);

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

  setSchema(schema: string): void {
    this.selectedSchema.set(schema);
  }
}
