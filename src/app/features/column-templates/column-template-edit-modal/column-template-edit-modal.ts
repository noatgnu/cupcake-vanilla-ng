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
    { value: 'lab_group', label: 'Lab Group' },
    { value: 'public', label: 'Public' },
    { value: 'global', label: 'Global' }
  ];

  ontologyTypes = [
    { value: '', label: 'None' },
    { value: 'species', label: 'Species' },
    { value: 'tissue', label: 'Tissue' },
    { value: 'disease', label: 'Disease' },
    { value: 'compound', label: 'Compound' },
    { value: 'modification', label: 'Modification' },
    { value: 'instrument', label: 'Instrument' }
  ];

  constructor(
    private fb: FormBuilder,
    private activeModal: NgbActiveModal
  ) {
    this.editForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      column_name: ['', [Validators.required, Validators.pattern(/^[a-zA-Z_][a-zA-Z0-9_]*$/)]],
      column_type: ['text', Validators.required],
      default_value: [''],
      default_position: [0, [Validators.min(0)]],
      ontology_type: [''],
      visibility: ['private', Validators.required],
      lab_group: [null],
      enable_typeahead: [false],
      excel_validation: [false],
      is_active: [true],
      tags: [''],
      category: ['']
    });
  }

  ngOnInit() {
    // Set initial disabled state for lab_group field
    this.onVisibilityChange();

    if (this.template && this.isEdit) {
      this.populateForm();
      // Reapply visibility logic after populating form
      this.onVisibilityChange();
    }
  }

  private populateForm() {
    if (this.template) {
      this.editForm.patchValue({
        name: this.template.name,
        description: this.template.description || '',
        column_name: this.template.column_name,
        column_type: this.template.column_type,
        default_value: this.template.default_value || '',
        default_position: this.template.default_position || 0,
        ontology_type: this.template.ontology_type || '',
        visibility: this.template.visibility || 'private',
        lab_group: this.template.lab_group || null,
        enable_typeahead: this.template.enable_typeahead || false,
        excel_validation: this.template.excel_validation || false,
        is_active: this.template.is_active !== false,
        tags: this.template.tags || '',
        category: this.template.category || ''
      });
    }
  }

  onVisibilityChange() {
    const visibility = this.editForm.get('visibility')?.value;
    const labGroupControl = this.editForm.get('lab_group');

    if (visibility === 'lab_group') {
      labGroupControl?.setValidators([Validators.required]);
      labGroupControl?.enable();
    } else {
      labGroupControl?.clearValidators();
      labGroupControl?.setValue(null);
      labGroupControl?.disable();
    }
    labGroupControl?.updateValueAndValidity();
  }

  onSubmit() {
    if (this.editForm.valid) {
      this.isLoading.set(true);
      const formValue = this.editForm.value;

      // Clean up form data
      const templateData: Partial<MetadataColumnTemplate> = {
        ...formValue,
        lab_group: formValue.visibility === 'lab_group' ? formValue.lab_group : null,
        default_position: Number(formValue.default_position) || 0
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
