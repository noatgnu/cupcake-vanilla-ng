import { Component, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MetadataColumn, PaginatedResponse, MetadataColumnTemplate, ONTOLOGY_TYPE_CONFIGS, COLUMN_TYPE_CONFIGS, OntologyTypeConfig, ColumnTypeConfig, ColumnType, OntologyType, OFFICIAL_SDRF_COLUMNS, SdrfColumnConfig, getSdrfColumnsByCategory, getSdrfColumnByName } from '../../../models';
import { MetadataValueEditModal, MetadataValueEditConfig } from '../../metadata-value-edit-modal/metadata-value-edit-modal';
import { MetadataColumnTemplateService, MetadataColumnTemplateQueryParams } from '../../../services/metadata-column-template';
import { SdrfSyntaxService } from '../../../services/sdrf-syntax';

@Component({
  selector: 'ccv-column-edit-modal',
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
    private metadataColumnTemplateService: MetadataColumnTemplateService,
    private sdrfSyntaxService: SdrfSyntaxService
  ) {
    this.editForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(1)]],
      type: [ColumnType.CHARACTERISTICS, Validators.required],
      value: [''],
      ontologyType: ['0'],
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
      const ontologyTypeIndex = this.column.ontologyType
        ? this.ontologyTypes.findIndex(o => o.value === this.column!.ontologyType)
        : 0;

      this.editForm.patchValue({
        name: this.column.name,
        type: this.getCorrectedColumnType(this.column.name, this.column.type),
        value: this.column.value || '',
        ontologyType: ontologyTypeIndex >= 0 ? ontologyTypeIndex.toString() : '0',
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
      const formValue = this.editForm.getRawValue();

      const ontologyTypeIndex = parseInt(formValue.ontologyType);
      const ontologyTypeValue = ontologyTypeIndex > 0 ? this.ontologyTypes[ontologyTypeIndex]?.value as OntologyType : undefined;

      const columnData: Partial<MetadataColumn> = {
        name: formValue.name,
        type: formValue.type,
        value: formValue.value || '',
        ontologyType: ontologyTypeValue,
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
    return !!(ontologyTypeIndex && ontologyTypeIndex !== '0');
  }

  get hasTypeaheadEnabled(): boolean {
    return this.hasOntologyType && this.editForm.get('enableTypeahead')?.value === true;
  }

  openValueEditModal(): void {
    const ontologyTypeIndexStr = this.editForm.get('ontologyType')?.value;
    const ontologyTypeIndex = parseInt(ontologyTypeIndexStr || '0');
    const enableTypeahead = this.editForm.get('enableTypeahead')?.value || false;

    let ontologyType = '';
    if (ontologyTypeIndex > 0 && ontologyTypeIndex < this.ontologyTypes.length) {
      ontologyType = this.ontologyTypes[ontologyTypeIndex].value;
    }

    const config: MetadataValueEditConfig = {
      columnName: this.editForm.get('name')?.value || 'Column',
      columnType: this.editForm.get('type')?.value || '',
      ontologyType: ontologyType,
      enableTypeahead: enableTypeahead,
      currentValue: this.editForm.get('value')?.value || '',
      context: this.isEdit ? 'table' : 'template'
    };

    const hasTemplate = this.selectedTemplate || this.column?.template || this.templateId;

    if (hasTemplate) {
      if (this.isEdit && this.column?.id) {
        config.columnId = this.column.id;
      }
      config.templateId = this.selectedTemplate?.id || this.column?.template || this.templateId || undefined;
    } else {
      const columnName = this.editForm.get('name')?.value;
      if (columnName) {
        const ontologyConfig = this.getOntologyConfigForColumn(columnName);
        config.customOntologyFilters = ontologyConfig.customFilters;
      }
    }

    const modalRef = this.modalService.open(MetadataValueEditModal, {
      size: 'lg',
      backdrop: 'static'
    });

    modalRef.componentInstance.config = config;
    modalRef.componentInstance.valueSaved.subscribe((result: string | { value: string; sampleIndices: number[] }) => {
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
        const ontologyTypeIndex = template.ontologyType
          ? this.ontologyTypes.findIndex(o => o.value === template.ontologyType)
          : 0;

        this.editForm.patchValue({
          name: template.columnName,
          type: template.columnType,
          value: template.defaultValue || '',
          ontologyType: ontologyTypeIndex >= 0 ? ontologyTypeIndex.toString() : '0',
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
      ontologyType: '0',
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

    const ontologyConfig = this.getOntologyConfigForColumn(column.name);
    const ontologyTypeIndex = ontologyConfig.index;

    this.editForm.patchValue({
      name: column.name,
      type: column.type,
      value: '',
      ontologyType: ontologyTypeIndex.toString(),
      enableTypeahead: ontologyTypeIndex > 0,
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

  private getOntologyConfigForColumn(columnName: string): { index: number; ontologyType: string; customFilters?: any } {
    const lowerName = columnName.toLowerCase();
    const MSTermType = {
      INSTRUMENT: 'instrument',
      MASS_ANALYZER_TYPE: 'mass analyzer type',
      CLEAVAGE_AGENT: 'cleavage agent',
      SAMPLE_ATTRIBUTE: 'sample attribute',
      ANCESTRAL_CATEGORY: 'ancestral category',
      SEX: 'sex',
      DEVELOPMENTAL_STAGE: 'developmental stage'
    };

    let ontologyType = '';
    let customFilters: any = undefined;

    switch (lowerName) {
      case 'characteristics[organism]':
        ontologyType = 'species';
        break;
      case 'characteristics[disease]':
        ontologyType = 'human_disease';
        break;
      case 'characteristics[organism part]':
        ontologyType = 'tissue';
        break;
      case 'characteristics[cell type]':
        ontologyType = 'cell_ontology';
        break;
      case 'comment[instrument]':
        ontologyType = 'ms_unique_vocabularies';
        customFilters = { ms_unique_vocabularies: { term_type: MSTermType.INSTRUMENT } };
        break;
      case 'comment[modification parameters]':
        ontologyType = 'unimod';
        break;
      case 'comment[ms2 analyzer type]':
        ontologyType = 'ms_unique_vocabularies';
        customFilters = { ms_unique_vocabularies: { term_type: MSTermType.MASS_ANALYZER_TYPE } };
        break;
      case 'comment[cleavage agent details]':
        ontologyType = 'ms_unique_vocabularies';
        customFilters = { ms_unique_vocabularies: { term_type: MSTermType.CLEAVAGE_AGENT } };
        break;
      case 'characteristics[ancestry category]':
        ontologyType = 'ms_unique_vocabularies';
        customFilters = { ms_unique_vocabularies: { term_type: MSTermType.ANCESTRAL_CATEGORY } };
        break;
      case 'characteristics[sex]':
        ontologyType = 'ms_unique_vocabularies';
        customFilters = { ms_unique_vocabularies: { term_type: MSTermType.SEX } };
        break;
      case 'characteristics[developmental stage]':
        ontologyType = 'ms_unique_vocabularies';
        customFilters = { ms_unique_vocabularies: { term_type: MSTermType.DEVELOPMENTAL_STAGE } };
        break;
      case 'comment[label]':
        ontologyType = 'ms_unique_vocabularies';
        customFilters = { ms_unique_vocabularies: { term_type: MSTermType.SAMPLE_ATTRIBUTE } };
        break;
    }

    if (!ontologyType) {
      return { index: 0, ontologyType: '', customFilters: undefined };
    }

    // Find the matching ontology type config with the correct custom filters
    const index = this.ontologyTypes.findIndex(config => {
      if (config.value !== ontologyType) return false;
      if (!customFilters) return !config.customFilters || Object.keys(config.customFilters).length === 0;

      // Match custom filters
      if (!config.customFilters) return false;
      const configFilterKey = Object.keys(config.customFilters)[0];
      const customFilterKey = Object.keys(customFilters)[0];
      if (configFilterKey !== customFilterKey) return false;

      const configTermType = config.customFilters[configFilterKey]?.['term_type'];
      const customTermType = customFilters[customFilterKey]?.['term_type'];
      return configTermType === customTermType;
    });

    return {
      index: index >= 0 ? index : 0,
      ontologyType,
      customFilters
    };
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

    const ontologyTypeIndex = template.ontologyType
      ? this.ontologyTypes.findIndex(o => o.value === template.ontologyType)
      : 0;

    this.editForm.patchValue({
      name: template.columnName,
      type: template.columnType,
      value: currentValue,
      ontologyType: ontologyTypeIndex >= 0 ? ontologyTypeIndex.toString() : '0',
      enableTypeahead: template.enableTypeahead || false,
      mandatory: this.editForm.get('mandatory')?.value || false,
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
        ontologyType: '0',
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

  private getCorrectedColumnType(columnName: string, columnType: string): string {
    const syntaxType = this.sdrfSyntaxService.detectSpecialSyntax(columnName, columnType);
    if (syntaxType) {
      // Return a specific type based on SDRF syntax detection
      switch (syntaxType) {
        case 'age':
          return 'characteristics[age]';
        case 'modification':
          return 'comment[modification parameters]';
        case 'cleavage':
          return 'comment[cleavage agent details]';
        case 'spiked_compound':
          return 'characteristics[spiked compound]';
        default:
          return columnType;
      }
    }
    return columnType;
  }
}
