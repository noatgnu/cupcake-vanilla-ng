import { Component, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MetadataColumnTemplate, LabGroup } from '../../../shared/models';

@Component({
  selector: 'app-column-template-edit-modal',
  imports: [CommonModule, ReactiveFormsModule, NgbModule],
  templateUrl: './column-template-edit-modal.html',
  styleUrl: './column-template-edit-modal.scss'
})
export class ColumnTemplateEditModal implements OnInit {
  @Input() template: MetadataColumnTemplate | null = null;
  @Input() labGroups: LabGroup[] = [];
  @Input() isEdit = false;
  @Output() templateSaved = new EventEmitter<Partial<MetadataColumnTemplate>>();

  editForm: FormGroup;
  isLoading = signal(false);

  // Make Object available in template
  Object = Object;

  // Available options for dropdowns
  columnTypes = [
    { value: 'characteristics', label: 'Characteristics' },
    { value: 'comment', label: 'Comment' },
    { value: 'factor_value', label: 'Factor Value' },
    { value: 'source_name', label: 'Source Name' },
    { value: 'special', label: 'Special' }
  ];

  visibilityOptions = [
    { value: 'private', label: 'Private' },
    { value: 'labGroup', label: 'Lab Group' },
    { value: 'public', label: 'Public' },
    { value: 'global', label: 'Global' }
  ];

  ontologyTypes = [
    { value: '', label: 'None', customFilter: {} },
    { value: 'species', label: 'Species (UniProt)', customFilter: {} },
    { value: 'ncbi_taxonomy', label: 'NCBI Taxonomy', customFilter: {} },
    { value: 'tissue', label: 'Tissue (UniProt)', customFilter: {} },
    { value: 'human_disease', label: 'Human Disease (UniProt)', customFilter: {} },
    { value: 'mondo', label: 'MONDO Disease', customFilter: {} },
    { value: 'ms_unique_vocabularies', label: 'Sample Attribute (MS)', customFilter: { 'ms_unique_vocabularies': {'term_type': 'sample attribute'} } },
    { value: 'ms_unique_vocabularies', label: 'MS2 Analyzer Type (MS)', customFilter: { 'ms_unique_vocabularies': {'term_type': 'ms analyzer type'} } },
    { value: 'ms_unique_vocabularies', label: 'Cleavage Agent (MS)', customFilter: { 'ms_unique_vocabularies': {'term_type': 'cleavage agent'} } },
    { value: 'ms_unique_vocabularies', label: 'Ancestry category (MS)', customFilter: { 'ms_unique_vocabularies': {'term_type': 'ancestral category'} } },
    { value: 'ms_unique_vocabularies', label: 'Developmental stage (MS)', customFilter: { 'ms_unique_vocabularies': {'term_type': 'developmental stage'} } },
    { value: 'ms_unique_vocabularies', label: 'Sex (MS)', customFilter: { 'ms_unique_vocabularies': {'term_type': 'sex'} } },
    { value: 'unimod', label: 'Modification (Unimod)', customFilter: {} },
    { value: 'uberon', label: 'Uberon Anatomy', customFilter: {} },
    { value: 'subcellular_location', label: 'Subcellular Location (UniProt)', customFilter: {} },
    { value: 'chebi', label: 'ChEbi', customFilter: {} },
    { value: 'cell_ontology', label: 'Cell Ontology', customFilter: {} },
    { value: 'go', label: 'Gene Ontology', customFilter: {} },
    { value: 'instrument', label: 'Instrument', customFilter: {} }
  ];

  constructor(
    private fb: FormBuilder,
    private activeModal: NgbActiveModal
  ) {
    this.editForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      columnName: ['', [Validators.required, Validators.pattern(/^[a-zA-Z_][a-zA-Z0-9_]*$/)]],
      columnType: ['text', Validators.required],
      defaultValue: [''],
      defaultPosition: [0, [Validators.min(0)]],
      ontologyType: [''],
      customOntologyFilters: [{}],
      visibility: ['private', Validators.required],
      labGroup: [null],
      enableTypeahead: [false],
      excelValidation: [false],
      isActive: [true],
      tags: [''],
      category: ['']
    });
  }

  ngOnInit() {
    // Set initial disabled state for labGroup field
    this.onVisibilityChange();

    if (this.template && this.isEdit) {
      this.populateForm();
      // Reapply visibility logic after populating form
      this.onVisibilityChange();
      // Apply ontology filters if ontology type is set
      this.onOntologyTypeChange();
    }
  }

  private populateForm() {
    if (this.template) {
      this.editForm.patchValue({
        name: this.template.name,
        description: this.template.description || '',
        columnName: this.template.columnName,
        columnType: this.template.columnType,
        defaultValue: this.template.defaultValue || '',
        defaultPosition: this.template.defaultPosition || 0,
        ontologyType: this.template.ontologyType || '',
        customOntologyFilters: this.template.customOntologyFilters || {},
        visibility: this.template.visibility || 'private',
        labGroup: this.template.labGroup || null,
        enableTypeahead: this.template.enableTypeahead || false,
        excelValidation: this.template.excelValidation || false,
        isActive: this.template.isActive !== false,
        tags: this.template.tags || '',
        category: this.template.category || ''
      });
    }
  }

  onVisibilityChange() {
    const visibility = this.editForm.get('visibility')?.value;
    const labGroupControl = this.editForm.get('labGroup');

    if (visibility === 'labGroup') {
      labGroupControl?.setValidators([Validators.required]);
      labGroupControl?.enable();
    } else {
      labGroupControl?.clearValidators();
      labGroupControl?.setValue(null);
      labGroupControl?.disable();
    }
    labGroupControl?.updateValueAndValidity();
  }

  onOntologyTypeChange() {
    const ontologyType = this.editForm.get('ontologyType')?.value;
    const customFiltersControl = this.editForm.get('customOntologyFilters');
    
    // Find the selected ontology type configuration
    const selectedOntology = this.ontologyTypes.find(ont => ont.value === ontologyType);
    
    if (selectedOntology && selectedOntology.customFilter) {
      // Apply the custom filter from the ontology type
      customFiltersControl?.setValue(selectedOntology.customFilter);
    } else {
      // Clear custom filters if no ontology type selected or no custom filter defined
      customFiltersControl?.setValue({});
    }
    
    customFiltersControl?.markAsDirty();
  }

  onSubmit() {
    if (this.editForm.valid) {
      this.isLoading.set(true);
      const formValue = this.editForm.value;

      // Clean up form data
      const templateData: Partial<MetadataColumnTemplate> = {
        ...formValue,
        labGroup: formValue.visibility === 'labGroup' ? formValue.labGroup : null,
        defaultPosition: Number(formValue.defaultPosition) || 0
      };

      this.templateSaved.emit(templateData);
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
      if (control.errors['pattern']) return `${fieldName} must be a valid identifier (letters, numbers, underscore)`;
      if (control.errors['min']) return `${fieldName} must be at least ${control.errors['min'].min}`;
    }
    return '';
  }

  get title(): string {
    return this.isEdit ? 'Edit Column Template' : 'Create Column Template';
  }
}
