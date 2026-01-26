import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { AsyncTaskUIService } from '../async-task-ui';
import { AsyncValidationService } from '../../services/async-validation';
import { ToastService } from '@noatgnu/cupcake-core';
import { MetadataValidationRequest, MetadataValidationConfig, ValidationSchema } from '@noatgnu/cupcake-core';

@Component({
  selector: 'ccv-metadata-validation-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbModule],
  templateUrl: './metadata-validation-modal.html',
  styleUrl: './metadata-validation-modal.scss'
})
export class MetadataValidationModal implements OnInit {
  @Input() config?: MetadataValidationConfig;

  private fb = inject(FormBuilder);
  private asyncTaskService = inject(AsyncTaskUIService);
  private asyncValidationService = inject(AsyncValidationService);
  private toastService = inject(ToastService);

  activeModal = inject(NgbActiveModal);

  isValidating = signal(false);
  isLoadingSchemas = signal(false);
  validationError = signal<string | null>(null);
  availableSchemas = signal<ValidationSchema[]>([]);
  selectedSchemas = signal<Set<string>>(new Set(['default']));

  validationForm = this.fb.group({
    validate_sdrf_format: [true],
    skip_ontology: [false],
    include_pools: [true]
  });

  ngOnInit(): void {
    this.loadAvailableSchemas();
  }

  loadAvailableSchemas(): void {
    this.isLoadingSchemas.set(true);
    this.asyncValidationService.getAvailableSchemas().subscribe({
      next: (schemas) => {
        this.availableSchemas.set(schemas);
        this.isLoadingSchemas.set(false);
      },
      error: (error) => {
        console.error('Failed to load schemas:', error);
        this.isLoadingSchemas.set(false);
        this.availableSchemas.set([
          { name: 'default', displayName: 'Default', description: 'Standard proteomics schema', columnCount: 0 },
          { name: 'minimum', displayName: 'Minimum', description: 'Minimum required columns', columnCount: 0 }
        ]);
      }
    });
  }

  toggleSchema(schemaName: string): void {
    const current = new Set(this.selectedSchemas());
    if (current.has(schemaName)) {
      current.delete(schemaName);
    } else {
      current.add(schemaName);
    }
    this.selectedSchemas.set(current);
  }

  isSchemaSelected(schemaName: string): boolean {
    return this.selectedSchemas().has(schemaName);
  }

  selectAllSchemas(): void {
    const allNames = new Set(this.availableSchemas().map(s => s.name));
    this.selectedSchemas.set(allNames);
  }

  clearAllSchemas(): void {
    this.selectedSchemas.set(new Set());
  }

  onSubmit(): void {
    if (this.validationForm.invalid || !this.config) {
      return;
    }

    const selectedSchemasList = Array.from(this.selectedSchemas());
    if (selectedSchemasList.length === 0) {
      this.validationError.set('Please select at least one schema to validate against.');
      return;
    }

    this.isValidating.set(true);
    this.validationError.set(null);

    const formValue = this.validationForm.value;
    const request: MetadataValidationRequest = {
      metadataTableId: this.config.metadataTableId,
      validateSdrfFormat: formValue.validate_sdrf_format ?? true,
      includePools: formValue.include_pools ?? true,
      schemaNames: selectedSchemasList,
      skipOntology: formValue.skip_ontology ?? false
    };

    this.asyncTaskService.validateMetadataTable(request).subscribe({
      next: (response) => {
        const schemaText = selectedSchemasList.length === 1
          ? selectedSchemasList[0]
          : `${selectedSchemasList.length} schemas`;
        this.toastService.success(
          `Validation started for "${this.config?.metadataTableName}" against ${schemaText}`
        );
        this.activeModal.close({
          success: true,
          task_id: response.taskId,
          message: response.message
        });
      },
      error: (error) => {
        this.isValidating.set(false);
        const errorMessage = error?.error?.error || error?.message || 'Failed to start validation';
        this.validationError.set(errorMessage);
        this.toastService.error(`Validation failed: ${errorMessage}`);
      }
    });
  }
}