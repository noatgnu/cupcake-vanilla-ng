import { Component, EventEmitter, Input, Output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ResourceVisibility } from '../../../shared/models';

export interface SchemaSelectionResult {
  name: string;
  description: string;
  schemaIds: number[];
  labGroupId?: number;
  visibility: ResourceVisibility;
  isDefault: boolean;
}

@Component({
  selector: 'app-schema-selection-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbModule],
  templateUrl: './schema-selection-modal.html',
  styleUrl: './schema-selection-modal.scss'
})
export class SchemaSelectionModal {
  @Input() availableSchemas: any[] = [];
  @Input() labGroups: any[] = [];
  @Output() templateCreated = new EventEmitter<SchemaSelectionResult>();

  templateForm: FormGroup;
  selectedSchemas = signal<Set<number>>(new Set());

  // Computed values
  selectedSchemasCount = computed(() => this.selectedSchemas().size);

  constructor(
    private fb: FormBuilder,
    public activeModal: NgbActiveModal
  ) {
    this.templateForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(1)]],
      description: [''],
      labGroupId: [null],
      visibility: [ResourceVisibility.PRIVATE],
      isDefault: [false]
    });
  }

  toggleSchema(schemaId: number) {
    const current = this.selectedSchemas();
    const updated = new Set(current);
    
    if (updated.has(schemaId)) {
      updated.delete(schemaId);
    } else {
      updated.add(schemaId);
    }
    
    this.selectedSchemas.set(updated);
    this.updateDescription();
  }

  onSchemaCheckChange(event: Event, schemaId: number) {
    // Prevent event propagation to avoid double-toggle from card click
    event.stopPropagation();
    // The checkbox state will be handled by the card click
  }

  isSchemaSelected(schemaId: number): boolean {
    return this.selectedSchemas().has(schemaId);
  }

  getSelectedSchemas(): number[] {
    return [...this.selectedSchemas()];
  }

  removeSchema(schemaId: number) {
    const current = this.selectedSchemas();
    const updated = new Set(current);
    updated.delete(schemaId);
    this.selectedSchemas.set(updated);
    this.updateDescription();
  }

  getSchemaDisplayName(schemaId: number): string {
    const schema = this.availableSchemas.find(s => s.id === schemaId);
    return schema?.displayName || schema?.name || `Schema ${schemaId}`;
  }

  private updateDescription() {
    const selectedSchemas = this.getSelectedSchemas();
    if (selectedSchemas.length > 0 && !this.templateForm.get('description')?.dirty) {
      const schemaNames = selectedSchemas.map(id => this.getSchemaDisplayName(id)).join(', ');
      this.templateForm.patchValue({
        description: `Template created from schemas: ${schemaNames}`
      });
    }
  }

  canCreateTemplate(): boolean {
    const formValid = this.templateForm.valid;
    const hasSchemas = this.selectedSchemasCount() > 0;
    
    // Debug logging
    if (!formValid) {
      console.log('Form errors:', this.templateForm.errors);
      console.log('Form controls errors:', Object.keys(this.templateForm.controls).reduce((acc, key) => {
        const control = this.templateForm.get(key);
        if (control?.errors) {
          acc[key] = control.errors;
        }
        return acc;
      }, {} as any));
    }
    
    console.log('canCreateTemplate:', { formValid, hasSchemas, result: formValid && hasSchemas });
    return formValid && hasSchemas;
  }

  onCreateTemplate() {
    if (!this.canCreateTemplate()) {
      // Mark all fields as touched to show validation errors
      this.templateForm.markAllAsTouched();
      return;
    }

    const formValue = this.templateForm.value;
    const result: SchemaSelectionResult = {
      name: formValue.name,
      description: formValue.description || '',
      schemaIds: this.getSelectedSchemas(),
      labGroupId: formValue.labGroupId || undefined,
      visibility: formValue.visibility || ResourceVisibility.PRIVATE,
      isDefault: formValue.isDefault || false
    };

    this.templateCreated.emit(result);
  }

  onCancel() {
    this.activeModal.dismiss();
  }
}
