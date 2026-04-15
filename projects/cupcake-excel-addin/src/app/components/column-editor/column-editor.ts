import { Component, inject, signal, input, output, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MetadataTable,
  MetadataColumn,
  MetadataTableService,
  MetadataColumnService,
  MetadataColumnTemplateService,
  MetadataColumnTemplate,
  OntologyType,
  OntologyTypeLabels
} from '@noatgnu/cupcake-vanilla';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { ToastService } from '../../core/services/toast.service';

interface ColumnForm {
  name: string;
  type: string;
  value: string;
  mandatory: boolean;
  hidden: boolean;
  ontologyType: OntologyType | string;
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
  private columnTemplateService = inject(MetadataColumnTemplateService);
  private toastService = inject(ToastService);

  readonly table = input.required<MetadataTable>();
  readonly column = input<MetadataColumn | null>(null);
  readonly isCreating = input<boolean>(false);
  readonly saved = output<void>();
  readonly cancel = output<void>();

  readonly form = signal<ColumnForm>({
    name: '',
    type: '',
    value: '',
    mandatory: false,
    hidden: false,
    ontologyType: OntologyType.NONE
  });

  readonly isSaving = signal(false);
  readonly ontologyLabels = OntologyTypeLabels;

  readonly templateSearch = signal('');
  readonly templateResults = signal<MetadataColumnTemplate[]>([]);
  readonly selectedTemplate = signal<MetadataColumnTemplate | null>(null);
  readonly isSearchingTemplates = signal(false);
  readonly showTemplateResults = signal(false);

  private searchSubject = new Subject<string>();

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (query.length < 2) {
          this.templateResults.set([]);
          this.showTemplateResults.set(false);
          return [];
        }
        this.isSearchingTemplates.set(true);
        return this.columnTemplateService.getMetadataColumnTemplates({ search: query, limit: 10, isActive: true });
      })
    ).subscribe({
      next: (response) => {
        this.templateResults.set(response.results || []);
        this.showTemplateResults.set(true);
        this.isSearchingTemplates.set(false);
      },
      error: () => {
        this.templateResults.set([]);
        this.isSearchingTemplates.set(false);
      }
    });
  }

  ngOnInit(): void {
    const col = this.column();
    if (col) {
      this.form.set({
        name: col.name,
        type: col.type || '',
        value: col.value || '',
        mandatory: col.mandatory,
        hidden: col.hidden,
        ontologyType: col.ontologyType || OntologyType.NONE
      });
    }
  }

  onTemplateSearchInput(value: string): void {
    this.templateSearch.set(value);
    if (!value) {
      this.selectedTemplate.set(null);
    }
    this.searchSubject.next(value);
  }

  selectTemplate(template: MetadataColumnTemplate): void {
    this.selectedTemplate.set(template);
    this.templateSearch.set(template.columnName);
    this.showTemplateResults.set(false);
    this.form.set({
      name: template.columnName,
      type: template.columnType,
      value: template.defaultValue || '',
      mandatory: false,
      hidden: false,
      ontologyType: (template.ontologyType as OntologyType) || OntologyType.NONE
    });
  }

  hideTemplateResults(): void {
    setTimeout(() => this.showTemplateResults.set(false), 200);
  }

  updateForm<K extends keyof ColumnForm>(field: K, value: ColumnForm[K]): void {
    this.form.update(f => ({ ...f, [field]: value }));
  }

  save(): void {
    const formData = this.form();

    if (this.isCreating() && !this.selectedTemplate()) {
      this.toastService.warning('Select a column template to add a column');
      return;
    }

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
    const template = this.selectedTemplate()!;
    const columnData: any = {
      name: formData.name.trim(),
      type: formData.type,
      value: formData.value || undefined,
      mandatory: formData.mandatory,
      hidden: formData.hidden,
      ontologyType: formData.ontologyType || undefined,
      customOntologyFilters: template.customOntologyFilters || undefined,
      enableTypeahead: template.enableTypeahead,
      notApplicable: template.notApplicable,
      notAvailable: template.notAvailable
    };

    this.tableService.addColumnWithAutoReorder(this.table().id, { columnData }).subscribe({
      next: (result) => {
        this.isSaving.set(false);
        const msg = result.reordered ? 'Column added and table reordered' : 'Column added';
        this.toastService.success(msg);
        this.saved.emit();
      },
      error: () => {
        this.isSaving.set(false);
        this.toastService.error('Failed to add column');
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
      hidden: formData.hidden,
      ontologyType: formData.ontologyType || null
    };

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
