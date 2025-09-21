import { Component, inject, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { AsyncTaskUIService } from '../async-task-ui';
import { ToastService } from '@cupcake/core';
import { MetadataValidationRequest, MetadataValidationConfig, AsyncTaskCreateResponse } from '@cupcake/vanilla';

@Component({
  selector: 'ccv-metadata-validation-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbModule],
  templateUrl: './metadata-validation-modal.html',
  styleUrl: './metadata-validation-modal.scss'
})
export class MetadataValidationModal {
  @Input() config?: MetadataValidationConfig;
  
  private fb = inject(FormBuilder);
  private asyncTaskService = inject(AsyncTaskUIService);
  private toastService = inject(ToastService);
  
  activeModal = inject(NgbActiveModal);
  
  isValidating = signal(false);
  validationError = signal<string | null>(null);
  
  validationForm = this.fb.group({
    validate_sdrf_format: [true]
  });
  
  onSubmit(): void {
    if (this.validationForm.invalid || !this.config) {
      return;
    }
    
    this.isValidating.set(true);
    this.validationError.set(null);
    
    const formValue = this.validationForm.value;
    const request: MetadataValidationRequest = {
      metadataTableId: this.config.metadataTableId,
      validateSdrfFormat: formValue.validate_sdrf_format ?? true
    };
    
    this.asyncTaskService.validateMetadataTable(request).subscribe({
      next: (response) => {
        this.toastService.success(
          `Validation started successfully for "${this.config?.metadataTableName}"`
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