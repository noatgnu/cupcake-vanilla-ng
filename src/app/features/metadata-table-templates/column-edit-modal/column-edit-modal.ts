import { Component, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal, NgbModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MetadataColumn } from '../../../shared/models';
import { MetadataValueEditModal, MetadataValueEditConfig } from '../../../shared/components/metadata-value-edit-modal/metadata-value-edit-modal';

@Component({
  selector: 'app-column-edit-modal',
  imports: [CommonModule, ReactiveFormsModule, NgbModule],
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

  // Available options for dropdowns
  columnTypes = [
    { value: 'characteristics', label: 'Characteristics' },
    { value: 'comment', label: 'Comment' },
    { value: 'factor_value', label: 'Factor Value' },
    { value: 'source_name', label: 'Source Name' },
    { value: 'special', label: 'Special' }
  ];

  ontologyTypes = [
    { value: '', label: 'None' },
    { value: 'species', label: 'Species' },
    { value: 'tissue', label: 'Tissue' },
    { value: 'human_disease', label: 'Human Disease' },
    { value: 'subcellular_location', label: 'Subcellular Location' },
    { value: 'ms_unique_vocabularies', label: 'MS Unique Vocabularies' },
    { value: 'unimod', label: 'Unimod Modifications' },
    { value: 'ncbi_taxonomy', label: 'NCBI Taxonomy' },
    { value: 'mondo', label: 'MONDO Disease' },
    { value: 'uberon', label: 'UBERON Anatomy' },
    { value: 'chebi', label: 'ChEBI' },
    { value: 'cell_ontology', label: 'Cell Ontology' },
    { value: 'psi_ms', label: 'PSI-MS Controlled Vocabulary' }
  ];

  
  constructor(
    private fb: FormBuilder,
    private activeModal: NgbActiveModal,
    private modalService: NgbModal
  ) {
    this.editForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(1)]],
      type: ['characteristics', Validators.required],
      value: [''],
      ontology_type: [''],
      enable_typeahead: [false],
      mandatory: [false],
      hidden: [false],
      readonly: [false],
      not_applicable: [false]
    });
  }

  ngOnInit() {
    if (this.column && this.isEdit) {
      this.populateForm();
    }
  }

  private populateForm() {
    if (this.column) {
      this.editForm.patchValue({
        name: this.column.name,
        type: this.column.type,
        value: this.column.value || '',
        ontology_type: this.column.ontology_type || '',
        enable_typeahead: this.column.enable_typeahead || false,
        mandatory: this.column.mandatory || false,
        hidden: this.column.hidden || false,
        readonly: this.column.readonly || false,
        not_applicable: this.column.not_applicable || false
      });
    }
  }

  onSubmit() {
    if (this.editForm.valid) {
      this.isLoading.set(true);
      const formValue = this.editForm.value;
      
      const columnData: Partial<MetadataColumn> = {
        name: formValue.name,
        type: formValue.type,
        value: formValue.value || '',
        ontology_type: formValue.ontology_type || null,
        enable_typeahead: formValue.enable_typeahead || false,
        mandatory: formValue.mandatory || false,
        hidden: formValue.hidden || false,
        readonly: formValue.readonly || false,
        not_applicable: formValue.not_applicable || false
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
    const ontologyType = this.editForm.get('ontology_type')?.value;
    return !!(ontologyType && ontologyType.length > 0);
  }

  get hasTypeaheadEnabled(): boolean {
    return this.hasOntologyType && this.editForm.get('enable_typeahead')?.value === true;
  }

  openValueEditModal(): void {
    const config: MetadataValueEditConfig = {
      columnId: this.column?.id,
      columnName: this.editForm.get('name')?.value || 'Column',
      columnType: this.editForm.get('type')?.value || '',
      ontologyType: this.editForm.get('ontology_type')?.value || '',
      enableTypeahead: this.editForm.get('enable_typeahead')?.value || false,
      currentValue: this.editForm.get('value')?.value || '',
      context: 'template',
      templateId: this.templateId || undefined
    };

    const modalRef = this.modalService.open(MetadataValueEditModal, {
      size: 'lg',
      backdrop: 'static'
    });

    modalRef.componentInstance.config = config;
    modalRef.componentInstance.valueSaved.subscribe((newValue: string) => {
      this.editForm.get('value')?.setValue(newValue);
      this.editForm.get('value')?.markAsTouched();
      modalRef.componentInstance.onClose();
    });
  }
}
