import { Component, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MetadataColumn } from '../../../shared/models';
import { MetadataValueEditModal, MetadataValueEditConfig } from '../../../shared/components/metadata-value-edit-modal/metadata-value-edit-modal';
import {
  MetadataColumnTemplateService,
  MetadataColumnTemplate,
  PaginatedResponse,
  MetadataColumnTemplateQueryParams,
  ONTOLOGY_TYPE_CONFIGS,
  COLUMN_TYPE_CONFIGS,
  OntologyTypeConfig,
  ColumnTypeConfig,
  ColumnType,
  OFFICIAL_SDRF_COLUMNS,
  SdrfColumnConfig,
  getSdrfColumnsByCategory,
  getSdrfColumnByName
} from '@cupcake/vanilla';

@Component({
  selector: 'app-column-edit-modal',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgbModule],
  templateUrl: './column-edit-modal.html',
  styleUrl: './column-edit-modal.scss'
})
export class ColumnEditModal implements OnInit {
  @Input() column: MetadataColumn | null = null;
  @Input() templateId: number | null = null; // Add template ID for API calls
  @Input() isEdit = false;
  @Output() columnSaved = new EventEmitter<Partial<MetadataColumn>>();

  editForm: FormGroup;
  isLoading = signal(false);
  showAdvancedMode = signal(false);

  // Selected ontology configuration (includes custom filters)
  selectedOntologyConfig: OntologyTypeConfig | null = null;

  // Available options for dropdowns from library
  columnTypes: ColumnTypeConfig[] = COLUMN_TYPE_CONFIGS;
  ontologyTypes: OntologyTypeConfig[] = ONTOLOGY_TYPE_CONFIGS;

  // Template selection properties
  templateFilter = '';
  selectedTemplateId: number | string = '';
  selectedTemplate: MetadataColumnTemplate | null = null;
  templates: MetadataColumnTemplate[] = [];
  isLoadingTemplates = false;

  // Pagination
  currentTemplatePage = 1;
  templatePageSize = 5;
  totalTemplates = 0;
  totalTemplatePages = 0;
  Math = Math;

  // Official SDRF column configurations from library
  officialSdrfColumns: SdrfColumnConfig[] = OFFICIAL_SDRF_COLUMNS;

  // Column selection mode
  showOfficialColumns = false;
  selectedOfficialColumn: SdrfColumnConfig | null = null;
  availableOfficialColumns: SdrfColumnConfig[] = [];

  // Template swapping for existing columns
  showTemplateSwap = false;
  showCreateCustomTemplate = false;

  constructor(
    private fb: FormBuilder,
    private activeModal: NgbActiveModal,
    private modalService: NgbModal,
    private metadataColumnTemplateService: MetadataColumnTemplateService
  ) {
    this.editForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(1)]],
      type: [ColumnType.CHARACTERISTICS, Validators.required],
      value: [''],
      ontologyType: ['0'], // Default to 'None' (index 0)
      enableTypeahead: [false],
      mandatory: [false],
      hidden: [false],
      readonly: [false],
      notApplicable: [false]
    });
  }

  ngOnInit() {
    // Always disable name and type fields since they're managed through templates
    this.editForm.get('name')?.disable();
    this.editForm.get('type')?.disable();

    if (this.column && this.isEdit) {
      this.populateForm();
    }

    if (!this.isEdit) {
      this.loadColumnTemplates();
    }
  }

  private populateForm() {
    if (this.column) {
      this.editForm.patchValue({
        name: this.column.name,
        type: this.column.type,
        value: this.column.value || '',
        ontologyType: this.column.ontologyType || '',
        enableTypeahead: this.column.enableTypeahead || false,
        mandatory: this.column.mandatory || false,
        hidden: this.column.hidden || false,
        readonly: this.column.readonly || false,
        notApplicable: this.column.notApplicable || false
      });
    }
  }

  onSubmit() {
    // For new columns, require either template or official column selection
    if (!this.isEdit && !this.selectedTemplate && !this.selectedOfficialColumn) {
      alert('Please select from official SDRF columns or choose an existing template before proceeding.');
      return;
    }

    if (this.editForm.valid) {
      this.isLoading.set(true);
      const formValue = this.editForm.getRawValue(); // getRawValue() includes disabled controls

      const columnData: Partial<MetadataColumn> = {
        name: formValue.name,
        type: formValue.type,
        value: formValue.value || '',
        ontologyType: formValue.ontologyType || null,
        enableTypeahead: formValue.enableTypeahead || false,
        mandatory: formValue.mandatory || false,
        hidden: formValue.hidden || false,
        readonly: formValue.readonly || false,
        notApplicable: formValue.notApplicable || false
      };

      this.columnSaved.emit(columnData);
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.editForm.controls).forEach(key => {
      const control = this.editForm.get(key);
      control?.markAsTouched();
    });
  }

  onCancel() {
    this.activeModal.dismiss();
  }

  onClose() {
    this.isLoading.set(false);
    this.activeModal.close();
  }

  getFieldError(fieldName: string): string {
    const control = this.editForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) return `${fieldName} is required`;
      if (control.errors['minlength']) return `${fieldName} must be at least ${control.errors['minlength'].requiredLength} characters`;
    }
    return '';
  }

  get title(): string {
    return this.isEdit ? 'Edit Column' : 'Add Column';
  }

  get hasOntologyType(): boolean {
    const ontologyTypeIndex = this.editForm.get('ontologyType')?.value;
    return !!(ontologyTypeIndex && ontologyTypeIndex !== '0'); // '0' is the 'None' option
  }

  get hasTypeaheadEnabled(): boolean {
    return this.hasOntologyType && this.editForm.get('enableTypeahead')?.value === true;
  }

  openValueEditModal(): void {
    // Get custom filters from selected ontology type or template
    let customFilters = this.selectedTemplate?.customOntologyFilters;
    let ontologyType = '';

    // If in advanced mode and an ontology type is selected, use its custom filters
    if (this.showAdvancedMode() && this.selectedOntologyConfig) {
      ontologyType = this.selectedOntologyConfig.value;
      if (this.selectedOntologyConfig.customFilters) {
        customFilters = this.selectedOntologyConfig.customFilters;
      }
    }

    const config: MetadataValueEditConfig = {
      columnId: this.column?.id,
      columnName: this.editForm.get('name')?.value || 'Column',
      columnType: this.editForm.get('type')?.value || '',
      ontologyType: ontologyType,
      enableTypeahead: this.editForm.get('enableTypeahead')?.value || false,
      currentValue: this.editForm.get('value')?.value || '',
      context: this.isEdit ? 'table' : 'template',
      templateId: this.selectedTemplate?.id || this.templateId || undefined,
      customOntologyFilters: customFilters
    };

    const modalRef = this.modalService.open(MetadataValueEditModal, {
      size: 'lg',
      backdrop: 'static'
    });

    modalRef.componentInstance.config = config;
    modalRef.componentInstance.valueSaved.subscribe((result: string | { value: string; sampleIndices: number[] }) => {
      // Extract the actual value from the result
      const newValue = typeof result === 'string' ? result : result.value;
      this.editForm.get('value')?.setValue(newValue);
      this.editForm.get('value')?.markAsTouched();
      modalRef.componentInstance.onClose();
    });
  }

  // Template selection methods
  private loadColumnTemplates(): void {
    this.isLoadingTemplates = true;
    const offset = (this.currentTemplatePage - 1) * this.templatePageSize;
    const params: MetadataColumnTemplateQueryParams = {
      limit: this.templatePageSize,
      offset: offset,
      isActive: true,
      search: this.templateFilter || undefined
    };

    this.metadataColumnTemplateService.getMetadataColumnTemplates(params).subscribe({
      next: (response: PaginatedResponse<MetadataColumnTemplate>) => {
        this.templates = response.results || [];
        this.totalTemplates = response.count || 0;
        this.totalTemplatePages = Math.ceil(this.totalTemplates / this.templatePageSize);
        this.isLoadingTemplates = false;
      },
      error: (error: any) => {
        console.error('Error loading column templates:', error);
        this.isLoadingTemplates = false;
      }
    });
  }

  onTemplateFilterChange(): void {
    this.currentTemplatePage = 1;
    this.loadColumnTemplates();
  }

  clearTemplateFilter(): void {
    this.templateFilter = '';
    this.currentTemplatePage = 1;
    this.loadColumnTemplates();
  }

  onTemplatePageChange(page: number): void {
    this.currentTemplatePage = page;
    this.loadColumnTemplates();
  }

  onTemplateSelectionChange(): void {
    if (this.selectedTemplateId) {
      const template = this.templates.find(t => t.id === Number(this.selectedTemplateId));
      if (template) {
        this.selectedTemplate = template;

        // Enable controls to update values, then disable again
        this.editForm.get('name')?.enable();
        this.editForm.get('type')?.enable();

        // Auto-fill form with template data
        this.editForm.patchValue({
          name: template.columnName,
          type: template.columnType,
          value: template.defaultValue || '',
          ontologyType: template.ontologyType || '',
          enableTypeahead: template.enableTypeahead || false,
          mandatory: false,
          hidden: false,
          readonly: false,
          notApplicable: false
        });

        // Disable controls again
        this.editForm.get('name')?.disable();
        this.editForm.get('type')?.disable();

        // Mark form as touched to trigger validation display
        Object.keys(this.editForm.controls).forEach(key => {
          this.editForm.get(key)?.markAsTouched();
        });
      }
    } else {
      this.clearTemplate();
    }
  }

  clearTemplate(): void {
    this.selectedTemplate = null;
    this.selectedTemplateId = '';

    // Enable controls to reset values, then disable again
    this.editForm.get('name')?.enable();
    this.editForm.get('type')?.enable();

    // Reset form to default values
    this.editForm.reset({
      name: '',
      type: ColumnType.CHARACTERISTICS,
      value: '',
      ontologyType: '',
      enableTypeahead: false,
      mandatory: false,
      hidden: false,
      readonly: false,
      notApplicable: false
    });

    // Disable controls again
    this.editForm.get('name')?.disable();
    this.editForm.get('type')?.disable();
  }

  getOntologyTypeLabel(ontologyType: string): string {
    const ontology = this.ontologyTypes.find(o => o.value === ontologyType);
    return ontology ? ontology.label : ontologyType;
  }

  // Official column selection methods
  toggleOfficialColumns(): void {
    this.showOfficialColumns = !this.showOfficialColumns;
    if (this.showOfficialColumns) {
      this.filterOfficialColumns();
    }
  }

  selectOfficialColumn(column: SdrfColumnConfig): void {
    this.selectedOfficialColumn = column;

    // Enable controls to update values, then disable again
    this.editForm.get('name')?.enable();
    this.editForm.get('type')?.enable();

    this.editForm.patchValue({
      name: column.name,
      type: column.type,
      value: '',
      ontologyType: this.getDefaultOntologyTypeForColumn(column.name),
      enableTypeahead: this.shouldEnableTypeaheadForColumn(column.name),
      mandatory: this.isColumnMandatory(column.name),
      hidden: false,
      readonly: false,
      notApplicable: false
    });

    // Disable controls again
    this.editForm.get('name')?.disable();
    this.editForm.get('type')?.disable();

    // Mark form as touched
    Object.keys(this.editForm.controls).forEach(key => {
      this.editForm.get(key)?.markAsTouched();
    });

    this.showOfficialColumns = false;
  }

  private filterOfficialColumns(): void {
    // Filter out columns that already have templates with the same name
    this.availableOfficialColumns = this.officialSdrfColumns.filter(officialCol => {
      return !this.templates.some(template =>
        template.columnName.toLowerCase() === officialCol.name.toLowerCase()
      );
    });
  }

  private getDefaultOntologyTypeForColumn(columnName: string): string {
    const lowerName = columnName.toLowerCase();

    // Based on backend configure_ontology_options method - use exact matches
    switch (lowerName) {
      case 'characteristics[organism]':
        return 'species';
      case 'characteristics[disease]':
        return 'human_disease';
      case 'characteristics[organism part]':
        return 'tissue';
      case 'characteristics[cell type]':
        return 'cell_ontology';
      case 'comment[instrument]':
        return 'ms_unique_vocabularies';
      case 'comment[modification parameters]':
        return 'unimod';
      case 'comment[ms2 analyzer type]':
        return 'ms_unique_vocabularies';
      case 'comment[cleavage agent details]':
        return 'ms_unique_vocabularies';
      case 'characteristics[ancestry category]':
        return 'ms_unique_vocabularies';
      case 'characteristics[sex]':
        return 'ms_unique_vocabularies';
      case 'characteristics[developmental stage]':
        return 'ms_unique_vocabularies';
      case 'comment[label]':
        return 'ms_unique_vocabularies';
      default:
        return '';
    }
  }

  private shouldEnableTypeaheadForColumn(columnName: string): boolean {
    const ontologyType = this.getDefaultOntologyTypeForColumn(columnName);
    return ontologyType.length > 0;
  }

  private isColumnMandatory(columnName: string): boolean {
    const lowerName = columnName.toLowerCase();

    switch (lowerName) {
      case 'source name':
      case 'characteristics[organism]':
      case 'characteristics[disease]':
      case 'characteristics[organism part]':
      case 'characteristics[cell type]':
      case 'assay name':
      case 'comment[fraction identifier]':
      case 'comment[label]':
      case 'comment[data file]':
      case 'comment[instrument]':
      case 'comment[technical replicate]':
      case 'characteristics[biological replicate]':
        return true;
      default:
        return false;
    }
  }


  // Template swapping methods
  showTemplateSwapOptions(): void {
    if (!this.isEdit) return;

    this.showTemplateSwap = true;
    this.loadColumnTemplates();
  }

  swapToTemplate(template: MetadataColumnTemplate): void {
    this.selectedTemplate = template;
    this.selectedTemplateId = template.id;

    // Update form with template data, preserving current value
    const currentValue = this.editForm.get('value')?.value || '';

    // Enable controls to update values, then disable again
    this.editForm.get('name')?.enable();
    this.editForm.get('type')?.enable();

    this.editForm.patchValue({
      name: template.columnName,
      type: template.columnType,
      value: currentValue, // Preserve current value
      ontologyType: template.ontologyType || '',
      enableTypeahead: template.enableTypeahead || false,
      mandatory: this.editForm.get('mandatory')?.value || false, // Preserve current settings
      hidden: this.editForm.get('hidden')?.value || false,
      readonly: this.editForm.get('readonly')?.value || false,
      notApplicable: this.editForm.get('notApplicable')?.value || false
    });

    // Disable controls again
    this.editForm.get('name')?.disable();
    this.editForm.get('type')?.disable();

    // Mark form as touched
    Object.keys(this.editForm.controls).forEach(key => {
      this.editForm.get(key)?.markAsTouched();
    });

    this.showTemplateSwap = false;
  }

  showCreateCustomTemplateOption(): void {
    this.showCreateCustomTemplate = true;
  }

  createCustomTemplate(): void {
    // This would open a new modal to create a custom template
    // For now, we'll just enable manual editing
    this.editForm.get('name')?.enable();
    this.showCreateCustomTemplate = false;

    // Show info message
    alert('Custom template creation would open a new dialog. For now, you can manually edit the column name.');
  }

  cancelTemplateSwap(): void {
    this.showTemplateSwap = false;
    this.showCreateCustomTemplate = false;
  }

  // Toggle advanced mode
  toggleAdvancedMode(): void {
    this.showAdvancedMode.set(!this.showAdvancedMode());

    // Reset ontology type when disabling advanced mode
    if (!this.showAdvancedMode()) {
      this.editForm.patchValue({
        ontologyType: '0', // Reset to 'None'
        enableTypeahead: false
      });
      this.selectedOntologyConfig = null;
    }
  }

  // Handle ontology type selection change
  onOntologyTypeChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const selectedIndex = parseInt(selectElement.value);
    this.selectedOntologyConfig = this.ontologyTypes[selectedIndex] || null;
  }
}
