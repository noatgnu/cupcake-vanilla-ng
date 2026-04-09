import { Component, inject, signal, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MetadataTableService,
  MetadataTableTemplateService,
  MetadataTable,
  Schema
} from '@noatgnu/cupcake-vanilla';
import { LabGroupService, LabGroup } from '@noatgnu/cupcake-core';
import { ExcelService } from '../../core/services/excel.service';
import { ToastService } from '../../core/services/toast.service';
import { SchemaSelector } from '../schema-selector/schema-selector';

type CreateStep = 'form' | 'schema' | 'mapping';

interface TableForm {
  name: string;
  description: string;
  sampleCount: number;
  labGroupId: number | null;
}

@Component({
  selector: 'app-create-table',
  imports: [FormsModule, SchemaSelector],
  templateUrl: './create-table.html',
  styleUrl: './create-table.scss',
})
export class CreateTable {
  private tableService = inject(MetadataTableService);
  private templateService = inject(MetadataTableTemplateService);
  private labGroupService = inject(LabGroupService);
  private excelService = inject(ExcelService);
  private toastService = inject(ToastService);

  readonly created = output<MetadataTable>();
  readonly cancel = output<void>();

  readonly currentStep = signal<CreateStep>('form');
  readonly form = signal<TableForm>({
    name: '',
    description: '',
    sampleCount: 10,
    labGroupId: null
  });

  readonly labGroups = signal<LabGroup[]>([]);
  readonly selectedSchemas = signal<Schema[]>([]);
  readonly excelHeaders = signal<string[]>([]);
  readonly isCreating = signal(false);
  readonly isLoadingLabGroups = signal(false);
  readonly useExcelData = signal(false);

  constructor() {
    this.loadLabGroups();
  }

  loadLabGroups(): void {
    this.isLoadingLabGroups.set(true);
    this.labGroupService.getMyLabGroups({ limit: 10 }).subscribe({
      next: (response) => {
        this.labGroups.set(response.results);
        this.isLoadingLabGroups.set(false);
      },
      error: () => {
        this.isLoadingLabGroups.set(false);
      }
    });
  }

  updateForm<K extends keyof TableForm>(field: K, value: TableForm[K]): void {
    this.form.update(f => ({ ...f, [field]: value }));
  }

  async loadFromExcel(): Promise<void> {
    try {
      const data = await this.excelService.readWorksheetData();
      if (data.headers.length > 0) {
        this.excelHeaders.set(data.headers);
        this.form.update(f => ({
          ...f,
          sampleCount: data.rows.length || 10
        }));
        this.useExcelData.set(true);
        this.toastService.success(`Loaded ${data.headers.length} columns, ${data.rows.length} rows`);
      } else {
        this.toastService.warning('No data found in worksheet');
      }
    } catch {
      this.toastService.error('Failed to read worksheet');
    }
  }

  goToSchemaSelection(): void {
    const formData = this.form();
    if (!formData.name.trim()) {
      this.toastService.warning('Table name is required');
      return;
    }
    if (formData.sampleCount < 1) {
      this.toastService.warning('Sample count must be at least 1');
      return;
    }
    this.currentStep.set('schema');
  }

  onSchemasSelected(schemas: Schema[]): void {
    this.selectedSchemas.set(schemas);
    this.createTable();
  }

  onSchemaCancel(): void {
    this.currentStep.set('form');
  }

  createTable(): void {
    const formData = this.form();
    const schemas = this.selectedSchemas();

    this.isCreating.set(true);

    if (schemas.length > 0) {
      this.templateService.createTableFromSchemas({
        schemaIds: schemas.map(s => s.id),
        name: formData.name.trim(),
        description: formData.description,
        sampleCount: formData.sampleCount
      }).subscribe({
        next: (table) => {
          this.handleTableCreated(table);
        },
        error: () => {
          this.isCreating.set(false);
          this.toastService.error('Failed to create table');
        }
      });
    } else {
      const request: any = {
        name: formData.name.trim(),
        description: formData.description,
        sampleCount: formData.sampleCount,
        sourceApp: 'excel-addin'
      };

      if (formData.labGroupId) {
        request.labGroup = formData.labGroupId;
      }

      this.tableService.createMetadataTable(request).subscribe({
        next: (table) => {
          this.handleTableCreated(table);
        },
        error: () => {
          this.isCreating.set(false);
          this.toastService.error('Failed to create table');
        }
      });
    }
  }

  private handleTableCreated(table: MetadataTable): void {
    this.isCreating.set(false);
    this.toastService.success(`Table "${table.name}" created`);
    this.created.emit(table);
  }

  skipSchemas(): void {
    this.selectedSchemas.set([]);
    this.createTable();
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
