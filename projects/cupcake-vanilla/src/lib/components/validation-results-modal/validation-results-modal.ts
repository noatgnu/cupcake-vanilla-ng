import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';

export interface ValidationResults {
  success: boolean;
  metadata_table_id: number;
  metadata_table_name: string;
  validation_timestamp: string;
  errors: string[];
  warnings: string[];
}

@Component({
  selector: 'ccv-validation-results-modal',
  imports: [CommonModule, NgbModule],
  templateUrl: './validation-results-modal.html',
  styleUrl: './validation-results-modal.scss'
})
export class ValidationResultsModal {
  @Input() results?: ValidationResults;
  
  activeModal = inject(NgbActiveModal);
  
  formatTimestamp(timestamp: string): string {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (error) {
      return timestamp;
    }
  }
}
