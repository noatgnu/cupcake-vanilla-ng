import { Component, inject, signal, input, output, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MetadataTable,
  MetadataColumn,
  MetadataTableService,
  MetadataColumnService,
  OntologyType,
  OntologyTypeLabels,
  ColumnType
} from '@noatgnu/cupcake-vanilla';
import { ToastService } from '../../core/services/toast.service';

interface ColumnForm {
  name: string;
  type: string;
  value: string;
  mandatory: boolean;
  hidden: boolean;
  ontologyType: OntologyType;
}

@Component({
  selector: 'app-column-editor',
  imports: [FormsModule],
  templateUrl: './column-editor.html',
  styleUrl: './column-editor.scss',
})
export class ColumnEditor implements OnInit {
  private tableService = inject(MetadataTableService);
  private columnService = inject(MetadataColumnService);
  private toastService = inject(ToastService);

  readonly table = input.required<MetadataTable>();
  readonly column = input<MetadataColumn | null>(null);
  readonly isCreating = input<boolean>(false);
  readonly saved = output<void>();
  readonly cancel = output<void>();

  readonly form = signal<ColumnForm>({
    name: '',
    type: ColumnType.CHARACTERISTICS,
    value: '',
    mandatory: false,
    hidden: false,
    ontologyType: OntologyType.NONE
  });

  readonly isSaving = signal(false);
  readonly columnTypes = Object.values(ColumnType);
  readonly ontologyTypes = Object.values(OntologyType);
  readonly ontologyLabels = OntologyTypeLabels;

  ngOnInit(): void {
    const col = this.column();
    if (col) {
      this.form.set({
        name: col.name,
        type: col.type || ColumnType.CHARACTERISTICS,
        value: col.value || '',
        mandatory: col.mandatory,
        hidden: col.hidden,
        ontologyType: col.ontologyType || OntologyType.NONE
      });
    }
  }

  updateForm<K extends keyof ColumnForm>(field: K, value: ColumnForm[K]): void {
    this.form.update(f => ({ ...f, [field]: value }));
  }

  save(): void {
    const formData = this.form();

    if (!formData.name.trim()) {
      this.toastService.warning('Column name is required');
      return;
    }

    this.isSaving.set(true);

    if (this.isCreating()) {
      this.createColumn(formData);
    } else {
      this.updateColumn(formData);
    }
  }

  private createColumn(formData: ColumnForm): void {
    const columnData: any = {
      name: formData.name.trim(),
      type: formData.type,
      value: formData.value,
      mandatory: formData.mandatory,
      hidden: formData.hidden
    };

    if (formData.ontologyType) {
      columnData.ontologyType = formData.ontologyType;
    }

    this.tableService.addColumn(this.table().id, columnData).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.toastService.success('Column created');
        this.saved.emit();
      },
      error: () => {
        this.isSaving.set(false);
        this.toastService.error('Failed to create column');
      }
    });
  }

  private updateColumn(formData: ColumnForm): void {
    const col = this.column();
    if (!col) return;

    const updateData: any = {
      name: formData.name.trim(),
      type: formData.type,
      value: formData.value,
      mandatory: formData.mandatory,
      hidden: formData.hidden
    };

    if (formData.ontologyType) {
      updateData.ontologyType = formData.ontologyType;
    } else {
      updateData.ontologyType = null;
    }

    this.columnService.patchMetadataColumn(col.id, updateData).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.toastService.success('Column updated');
        this.saved.emit();
      },
      error: () => {
        this.isSaving.set(false);
        this.toastService.error('Failed to update column');
      }
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
