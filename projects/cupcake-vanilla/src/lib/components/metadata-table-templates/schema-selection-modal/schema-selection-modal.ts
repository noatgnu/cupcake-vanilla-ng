import { Component, EventEmitter, Input, Output, signal, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule, SlicePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ResourceVisibility } from '@noatgnu/cupcake-core';
import { Schema, SchemaLayer } from '../../../models';

export interface TemplateSchemaSelectionResult {
  name: string;
  description: string;
  schemaIds: number[];
  labGroup?: number;
  visibility: ResourceVisibility;
  isDefault: boolean;
}

export interface SchemasByLayer {
  technology: Schema[];
  sample: Schema[];
  experiment: Schema[];
  other: Schema[];
}

@Component({
  selector: 'ccv-template-schema-selection-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbModule],
  templateUrl: './schema-selection-modal.html',
  styleUrl: './schema-selection-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TemplateSchemaSelectionModal implements OnInit {
  @Input() availableSchemas: Schema[] = [];
  @Input() labGroups: any[] = [];
  @Output() templateCreated = new EventEmitter<TemplateSchemaSelectionResult>();

  templateForm: FormGroup;
  selectedSchemas = signal<Set<number>>(new Set());

  schemasByLayer = signal<SchemasByLayer>({
    technology: [],
    sample: [],
    experiment: [],
    other: []
  });

  layerInfo: Record<string, { label: string; icon: string; description: string; color: string }> = {
    technology: {
      label: 'Technology',
      icon: 'bi-cpu',
      description: 'Core technology schemas (e.g., MS proteomics, affinity proteomics)',
      color: 'primary'
    },
    sample: {
      label: 'Sample/Organism',
      icon: 'bi-droplet',
      description: 'Sample type and organism-specific schemas',
      color: 'success'
    },
    experiment: {
      label: 'Experiment',
      icon: 'bi-flask',
      description: 'Experiment-specific extensions (e.g., DIA, single-cell)',
      color: 'info'
    },
    other: {
      label: 'Other',
      icon: 'bi-grid',
      description: 'Base and utility schemas',
      color: 'secondary'
    }
  };

  selectedSchemasCount = computed(() => this.selectedSchemas().size);

  constructor(
    private fb: FormBuilder,
    public activeModal: NgbActiveModal
  ) {
    this.templateForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(1)]],
      description: [''],
      labGroup: [null],
      visibility: [ResourceVisibility.PRIVATE],
      isDefault: [false]
    });
  }

  ngOnInit() {
    this.groupSchemasByLayer();
  }

  private groupSchemasByLayer() {
    const grouped: SchemasByLayer = {
      technology: [],
      sample: [],
      experiment: [],
      other: []
    };

    for (const schema of this.availableSchemas) {
      const layer = schema.layer as SchemaLayer;
      if (layer === 'technology') {
        grouped.technology.push(schema);
      } else if (layer === 'sample') {
        grouped.sample.push(schema);
      } else if (layer === 'experiment') {
        grouped.experiment.push(schema);
      } else {
        grouped.other.push(schema);
      }
    }

    grouped.technology.sort((a, b) => (b.usableAlone ? 1 : 0) - (a.usableAlone ? 1 : 0));
    grouped.sample.sort((a, b) => (a.displayName || a.name).localeCompare(b.displayName || b.name));
    grouped.experiment.sort((a, b) => (a.displayName || a.name).localeCompare(b.displayName || b.name));
    grouped.other.sort((a, b) => (a.displayName || a.name).localeCompare(b.displayName || b.name));

    this.schemasByLayer.set(grouped);
  }

  getLayerKeys(): string[] {
    return ['technology', 'sample', 'experiment', 'other'];
  }

  hasLayerSchemas(layer: string): boolean {
    const grouped = this.schemasByLayer();
    return (grouped[layer as keyof SchemasByLayer] || []).length > 0;
  }

  getLayerSchemas(layer: string): Schema[] {
    const grouped = this.schemasByLayer();
    return grouped[layer as keyof SchemasByLayer] || [];
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
    // Toggle the schema selection when checkbox is clicked
    this.toggleSchema(schemaId);
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

  getSchemaById(schemaId: number): Schema | undefined {
    return this.availableSchemas.find(s => s.id === schemaId);
  }

  getSchemaDisplayName(schemaId: number): string {
    const schema = this.getSchemaById(schemaId);
    return schema?.displayName || schema?.name || `Schema ${schemaId}`;
  }

  getSchemaLayer(schemaId: number): string {
    const schema = this.getSchemaById(schemaId);
    return schema?.layer || 'other';
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
    const result: TemplateSchemaSelectionResult = {
      name: formValue.name,
      description: formValue.description || '',
      schemaIds: this.getSelectedSchemas(),
      labGroup: formValue.labGroup || undefined,
      visibility: formValue.visibility || ResourceVisibility.PRIVATE,
      isDefault: formValue.isDefault || false
    };

    this.templateCreated.emit(result);
  }

  onCancel() {
    this.activeModal.dismiss();
  }
}
