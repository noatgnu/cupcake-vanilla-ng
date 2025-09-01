import { Component, inject, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { AsyncTaskService } from '../../services/async-task';
import { ToastService } from '../../services/toast';
import { ValidationTaskCreateRequest, MetadataValidationConfig } from '../../models/async-task';

@Component({
  selector: 'app-metadata-validation-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbModule],
  templateUrl: './metadata-validation-modal.html',
  styleUrl: './metadata-validation-modal.scss'
})
export class MetadataValidationModal {
  @Input() config?: MetadataValidationConfig;
  
  private fb = inject(FormBuilder);
  private asyncTaskService = inject(AsyncTaskService);
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
    const request: ValidationTaskCreateRequest = {
      metadata_table_id: this.config.metadata_table_id,
      validate_sdrf_format: formValue.validate_sdrf_format ?? true
    };
    
    this.asyncTaskService.validateMetadataTable(request).subscribe({
      next: (response) => {
        this.toastService.success(
          `Validation started successfully for "${this.config?.metadata_table_name}"`
        );
        this.activeModal.close({
          success: true,
          task_id: response.task_id,
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