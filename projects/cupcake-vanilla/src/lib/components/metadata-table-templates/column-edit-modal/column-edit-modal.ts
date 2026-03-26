import { Component, Input, Output, EventEmitter, OnInit, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MetadataColumn, PaginatedResponse, MetadataColumnTemplate, ONTOLOGY_TYPE_CONFIGS, COLUMN_TYPE_CONFIGS, OntologyTypeConfig, ColumnTypeConfig, ColumnType, OntologyType, Schema } from '../../../models';
import { MetadataValueEditModal, MetadataValueEditConfig } from '../../metadata-value-edit-modal/metadata-value-edit-modal';
import { MetadataColumnTemplateService, MetadataColumnTemplateQueryParams } from '../../../services/metadata-column-template';
import { SchemaService } from '../../../services/schema';
import { SdrfSyntaxService } from '../../../services/sdrf-syntax';
import { OfficialColumnCacheService } from '../../../services/official-column-cache';

@Component({
  selector: 'ccv-column-edit-modal',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgbModule],
  templateUrl: './column-edit-modal.html',
  styleUrl: './column-edit-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
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

  // Template filters
  showSystemTemplatesOnly = false;
  selectedSchemaFilter = '';
  availableSchemas: Schema[] = [];

  // Validation
  validationError = signal<string | null>(null);

  // Template swapping for existing columns
  showTemplateSwap = false;
  showCreateCustomTemplate = false;

  constructor(
    private fb: FormBuilder,
    private activeModal: NgbActiveModal,
    private modalService: NgbModal,
    private metadataColumnTemplateService: MetadataColumnTemplateService,
    private schemaService: SchemaService,
    private sdrfSyntaxService: SdrfSyntaxService,
    private officialColumnCache: OfficialColumnCacheService
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
      notApplicable: [false],
      notAvailable: [false],
      staffOnly: [false]
    });
  }

  ngOnInit() {
    this.editForm.get('name')?.disable();
    this.editForm.get('type')?.disable();

    if (this.column && this.isEdit) {
      this.populateForm();
    }

    if (!this.isEdit) {
      this.loadColumnTemplates();
      this.loadAvailableSchemas();
    }
  }

  private populateForm() {
    if (this.column) {
      const customFilters = this.column.customOntologyFilters || undefined;
      const ontologyTypeIndex = this.getOntologyTypeIndex(
        this.column.ontologyType,
        customFilters
      );

      this.editForm.patchValue({
        name: this.column.name,
        type: this.getCorrectedColumnType(this.column.name, this.column.type),
        value: this.column.value || '',
        ontologyType: ontologyTypeIndex.toString(),
        enableTypeahead: this.column.enableTypeahead || false,
        mandatory: this.column.mandatory || false,
        hidden: this.column.hidden || false,
        readonly: this.column.readonly || false,
        notApplicable: this.column.notApplicable || false,
        notAvailable: this.column.notAvailable || false,
        staffOnly: this.column.staffOnly || false
      });
    }
  }

  private getOntologyTypeIndex(ontologyType?: string, customFilters?: any): number {
    if (!ontologyType) return 0;

    if (!customFilters || Object.keys(customFilters).length === 0) {
      const index = this.ontologyTypes.findIndex(o => o.value === ontologyType && (!o.customFilters || Object.keys(o.customFilters).length === 0));
      return index >= 0 ? index : 0;
    }

    console.log('[Column] Looking for ontology match:', {
      ontologyType,
      customFilters,
      keys: Object.keys(customFilters)
    });

    // Handle both wrapped and unwrapped formats
    // Also handle camelCase from API vs snake_case in config
    // API returns: {"msUniqueVocabularies": {"termType": "cell line"}}
    // Config has: {"ms_unique_vocabularies": {"term_type": "cell line"}}

    // Convert ontologyType to camelCase to match API format
    const camelOntologyType = ontologyType.replace(/_([a-z])/g, (g) => g[1].toUpperCase());

    let actualFilters = customFilters[ontologyType] || customFilters[camelOntologyType] || customFilters;

    console.log('[Column] Actual filters after unwrapping:', actualFilters);

    const matchingIndex = this.ontologyTypes.findIndex(opt => {
      if (opt.value !== ontologyType) return false;

      if (!opt.customFilters) return false;

      // Get the filter value from config (wrapped with snake_case key)
      const optFilterValue = opt.customFilters[ontologyType];
      if (!optFilterValue) return false;

      // Compare term_type values (handle both snake_case and camelCase)
      const optTermType = optFilterValue['term_type'];
      const actualTermType = actualFilters['term_type'] || actualFilters['termType'];

      const matches = optTermType === actualTermType;

      console.log('[Column] Comparing:', {
        label: opt.label,
        optTermType,
        actualTermType,
        matches
      });

      return matches;
    });

    if (matchingIndex >= 0) {
      console.log('[Column] Found match at index:', matchingIndex, this.ontologyTypes[matchingIndex].label);
    } else {
      console.warn('[Column] No match found for:', { ontologyType, customFilters });
    }

    return matchingIndex >= 0 ? matchingIndex : 0;
  }

  onSubmit() {
    this.validationError.set(null);

    // For new columns, require template selection
    if (!this.isEdit && !this.selectedTemplate) {
      this.validationError.set('Please select a template before proceeding.');
      return;
    }

    if (this.editForm.valid) {
      this.isLoading.set(true);
      const formValue = this.editForm.getRawValue();

      const ontologyTypeIndex = parseInt(formValue.ontologyType);
      const selectedOntology = ontologyTypeIndex > 0 ? this.ontologyTypes[ontologyTypeIndex] : null;
      const ontologyTypeValue = selectedOntology?.value as OntologyType | undefined;

      // Extract custom filters from the selected ontology config
      const customOntologyFilters = selectedOntology?.customFilters || {};

      console.log('[Column Edit] Submitting column:', {
        ontologyTypeIndex,
        selectedOntology,
        ontologyTypeValue,
        customOntologyFilters
      });

      const columnData: Partial<MetadataColumn> = {
        name: formValue.name,
        type: formValue.type,
        value: formValue.value || '',
        ontologyType: ontologyTypeValue,
        customOntologyFilters: customOntologyFilters,
        enableTypeahead: formValue.enableTypeahead || false,
        mandatory: formValue.mandatory || false,
        hidden: formValue.hidden || false,
        readonly: formValue.readonly || false,
        notApplicable: formValue.notApplicable || false,
        notAvailable: formValue.notAvailable || false,
        staffOnly: formValue.staffOnly || false
      };

      console.log('[Column Edit] Final columnData:', columnData);

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
      context: this.isEdit ? 'table' : 'template',
      allowNotApplicable: this.editForm.get('notApplicable')?.value || false,
      allowNotAvailable: this.editForm.get('notAvailable')?.value || false
    };

    const hasTemplate = this.selectedTemplate || this.column?.template || this.templateId;

    if (hasTemplate) {
      if (this.isEdit && this.column?.id) {
        config.columnId = this.column.id;
      }
      config.templateId = this.selectedTemplate?.id || this.column?.template || this.templateId || undefined;
    } else if (this.isEdit && this.column?.customOntologyFilters) {
      config.customOntologyFilters = this.column.customOntologyFilters;
    } else {
      const columnName = this.editForm.get('name')?.value;
      if (columnName) {
        const ontologyConfig = this.getOntologyConfigForColumn(columnName);
        if (ontologyConfig.customFilters) {
          config.customOntologyFilters = ontologyConfig.customFilters;
        }
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

  setDefaultValue(value: string): void {
    this.editForm.get('value')?.setValue(value);
    this.editForm.get('value')?.markAsTouched();
  }

  // Template selection methods
  private loadColumnTemplates(): void {
    // Don't load if search filter is between 1-2 characters
    if (this.templateFilter && this.templateFilter.length > 0 && this.templateFilter.length < 3) {
      this.templates = [];
      this.totalTemplates = 0;
      this.totalTemplatePages = 0;
      this.isLoadingTemplates = false;
      return;
    }

    this.isLoadingTemplates = true;
    const offset = (this.currentTemplatePage - 1) * this.templatePageSize;
    const params: MetadataColumnTemplateQueryParams = {
      limit: this.templatePageSize,
      offset: offset,
      isActive: true,
      search: this.templateFilter || undefined,
      isSystemTemplate: this.showSystemTemplatesOnly ? true : undefined,
      sourceSchema: this.selectedSchemaFilter || undefined
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

  private loadAvailableSchemas(): void {
    this.schemaService.getAvailableSchemas().subscribe({
      next: (schemas: Schema[]) => {
        this.availableSchemas = schemas;
      },
      error: (error: any) => {
        console.error('Error loading schemas:', error);
      }
    });
  }

  toggleSystemTemplatesFilter(systemOnly: boolean): void {
    this.showSystemTemplatesOnly = systemOnly;
    this.currentTemplatePage = 1;
    this.loadColumnTemplates();
  }

  onSchemaFilterChange(schema: string): void {
    this.selectedSchemaFilter = schema;
    this.currentTemplatePage = 1;
    this.loadColumnTemplates();
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

        this.editForm.get('name')?.enable();
        this.editForm.get('type')?.enable();

        const ontologyTypeIndex = this.getOntologyTypeIndex(
          template.ontologyType,
          template.customOntologyFilters
        );

        this.editForm.patchValue({
          name: template.columnName,
          type: template.columnType,
          value: template.defaultValue || '',
          ontologyType: ontologyTypeIndex.toString(),
          enableTypeahead: template.enableTypeahead || false,
          mandatory: false,
          hidden: false,
          readonly: false,
          notApplicable: false
        });

        this.editForm.get('name')?.disable();
        this.editForm.get('type')?.disable();

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

  // Template swapping methods
  showTemplateSwapOptions(): void {
    if (!this.isEdit) return;

    this.showTemplateSwap = true;
    this.loadColumnTemplates();
  }

  swapToTemplate(template: MetadataColumnTemplate): void {
    this.selectedTemplate = template;
    this.selectedTemplateId = template.id;

    const currentValue = this.editForm.get('value')?.value || '';

    this.editForm.get('name')?.enable();
    this.editForm.get('type')?.enable();

    const ontologyTypeIndex = this.getOntologyTypeIndex(
      template.ontologyType,
      template.customOntologyFilters
    );

    this.editForm.patchValue({
      name: template.columnName,
      type: template.columnType,
      value: currentValue,
      ontologyType: ontologyTypeIndex.toString(),
      enableTypeahead: template.enableTypeahead || false,
      mandatory: this.editForm.get('mandatory')?.value || false,
      hidden: this.editForm.get('hidden')?.value || false,
      readonly: this.editForm.get('readonly')?.value || false,
      notApplicable: this.editForm.get('notApplicable')?.value || false
    });

    this.editForm.get('name')?.disable();
    this.editForm.get('type')?.disable();

    Object.keys(this.editForm.controls).forEach(key => {
      this.editForm.get(key)?.markAsTouched();
    });

    this.showTemplateSwap = false;
  }

  showCreateCustomTemplateOption(): void {
    this.showCreateCustomTemplate = true;
  }

  createCustomTemplate(): void {
    this.editForm.get('name')?.enable();
    this.showCreateCustomTemplate = false;
  }

  cancelTemplateSwap(): void {
    this.showTemplateSwap = false;
    this.showCreateCustomTemplate = false;
  }

  toggleAdvancedMode(): void {
    this.showAdvancedMode.set(!this.showAdvancedMode());
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

  private getOntologyConfigForColumn(columnName: string): { index: number; ontologyType: string; customFilters?: any } {
    const template = this.officialColumnCache.getColumn(columnName);
    if (!template || !template.ontologyType) {
      return { index: 0, ontologyType: '', customFilters: undefined };
    }

    const ontologyType = template.ontologyType;
    const customFilters = template.customOntologyFilters;

    const index = this.ontologyTypes.findIndex(config => {
      if (config.value !== ontologyType) return false;
      if (!customFilters || Object.keys(customFilters).length === 0) {
        return !config.customFilters || Object.keys(config.customFilters).length === 0;
      }

      if (!config.customFilters) return false;
      const configFilterKey = Object.keys(config.customFilters)[0];
      const customFilterKey = Object.keys(customFilters)[0];
      if (configFilterKey !== customFilterKey) return false;

      const configTermType = config.customFilters[configFilterKey]?.['term_type'];
      const customTermType = customFilters[customFilterKey]?.['term_type'] || customFilters[customFilterKey]?.['termType'];
      return configTermType === customTermType;
    });

    return {
      index: index >= 0 ? index : 0,
      ontologyType,
      customFilters
    };
  }
}
