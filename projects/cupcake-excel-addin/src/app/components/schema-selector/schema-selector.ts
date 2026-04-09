import { Component, inject, signal, output, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SchemaService, Schema } from '@noatgnu/cupcake-vanilla';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-schema-selector',
  imports: [FormsModule],
  templateUrl: './schema-selector.html',
  styleUrl: './schema-selector.scss',
})
export class SchemaSelector implements OnInit {
  private schemaService = inject(SchemaService);
  private toastService = inject(ToastService);

  readonly schemas = signal<Schema[]>([]);
  readonly selectedSchemaIds = signal<number[]>([]);
  readonly isLoading = signal(false);
  readonly searchQuery = signal('');

  readonly selected = output<Schema[]>();
  readonly cancel = output<void>();

  ngOnInit(): void {
    this.loadSchemas();
  }

  loadSchemas(): void {
    this.isLoading.set(true);
    this.schemaService.getAvailableSchemas().subscribe({
      next: (schemas) => {
        this.schemas.set(schemas);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Failed to load schemas');
        this.isLoading.set(false);
      }
    });
  }

  filteredSchemas(): Schema[] {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.schemas();
    return this.schemas().filter(s =>
      s.name.toLowerCase().includes(query) ||
      (s.category && s.category.toLowerCase().includes(query))
    );
  }

  isSelected(schema: Schema): boolean {
    return this.selectedSchemaIds().includes(schema.id);
  }

  toggleSchema(schema: Schema): void {
    const ids = this.selectedSchemaIds();
    if (ids.includes(schema.id)) {
      this.selectedSchemaIds.set(ids.filter(id => id !== schema.id));
    } else {
      this.selectedSchemaIds.set([...ids, schema.id]);
    }
  }

  confirm(): void {
    const selectedIds = this.selectedSchemaIds();
    const selectedSchemas = this.schemas().filter(s => selectedIds.includes(s.id));
    this.selected.emit(selectedSchemas);
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
