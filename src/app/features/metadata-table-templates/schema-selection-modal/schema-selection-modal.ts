import { Component, EventEmitter, Input, Output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ResourceVisibility } from '../../../shared/models';

export interface SchemaSelectionResult {
  name: string;
  description: string;
  schema_ids: number[];
  lab_group_id?: number;
  visibility: ResourceVisibility;
  is_default: boolean;
}

@Component({
  selector: 'app-schema-selection-modal',
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
      lab_group_id: [null],
      visibility: [ResourceVisibility.PRIVATE],
      is_default: [false]
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
    return Array.from(this.selectedSchemas());
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
    return schema?.display_name || schema?.name || `Schema ${schemaId}`;
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
    return this.templateForm.valid && this.selectedSchemasCount() > 0;
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
      schema_ids: this.getSelectedSchemas(),
      lab_group_id: formValue.lab_group_id || undefined,
      visibility: formValue.visibility || ResourceVisibility.PRIVATE,
      is_default: formValue.is_default || false
    };

    this.templateCreated.emit(result);
  }

  onCancel() {
    this.activeModal.dismiss();
  }
}
