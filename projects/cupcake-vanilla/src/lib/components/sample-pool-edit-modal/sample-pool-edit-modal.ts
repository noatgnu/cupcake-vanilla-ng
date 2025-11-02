import { Component, Input, Output, EventEmitter, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SamplePool } from '../../models';
import { SamplePoolService } from '../../services';

@Component({
  selector: 'ccv-sample-pool-edit-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbModule],
  templateUrl: './sample-pool-edit-modal.html',
  styleUrl: './sample-pool-edit-modal.scss'
})
export class SamplePoolEditModal implements OnInit {
  @Input() pool!: SamplePool;
  @Input() maxSampleCount: number = 100;
  @Output() poolSaved = new EventEmitter<SamplePool>();

  editForm: FormGroup;
  isLoading = signal(false);

  private fb = inject(FormBuilder);
  private activeModal = inject(NgbActiveModal);
  private samplePoolService = inject(SamplePoolService);

  constructor() {
    this.editForm = this.fb.group({
      poolName: ['', [Validators.required, Validators.maxLength(255)]],
      poolDescription: [''],
      isReference: [false],
      pooledOnlySamplesText: [''],
      pooledAndIndependentSamplesText: ['']
    });
  }

  ngOnInit() {
    if (this.pool) {
      this.editForm.patchValue({
        poolName: this.pool.poolName,
        poolDescription: this.pool.poolDescription || '',
        isReference: this.pool.isReference,
        pooledOnlySamplesText: this.pool.pooledOnlySamples?.join(', ') || '',
        pooledAndIndependentSamplesText: this.pool.pooledAndIndependentSamples?.join(', ') || ''
      });
    }
  }

  onSubmit(): void {
    if (this.editForm.valid && this.pool.id) {
      this.isLoading.set(true);
      
      const formValue = this.editForm.value;
      
      // Parse sample arrays from text input
      const pooledOnlySamples = this.parseSampleNumbers(formValue.pooledOnlySamplesText);
      const pooledAndIndependentSamples = this.parseSampleNumbers(formValue.pooledAndIndependentSamplesText);
      
      const updateData: Partial<SamplePool> = {
        poolName: formValue.poolName.trim(),
        poolDescription: formValue.poolDescription?.trim() || undefined,
        isReference: formValue.isReference,
        pooledOnlySamples: pooledOnlySamples,
        pooledAndIndependentSamples: pooledAndIndependentSamples
      };

      this.samplePoolService.updateSamplePool(this.pool.id, updateData).subscribe({
        next: (updatedPool) => {
          this.poolSaved.emit(updatedPool);
          this.activeModal.close(updatedPool);
        },
        error: (error) => {
          console.error('Error updating sample pool:', error);
          this.isLoading.set(false);
        }
      });
    }
  }

  onCancel(): void {
    this.activeModal.dismiss();
  }

  get title(): string {
    return `Edit ${this.pool?.poolName || 'Sample Pool'}`;
  }

  get hasChanges(): boolean {
    if (!this.pool) return false;
    
    const formValue = this.editForm.value;
    return (
      formValue.poolName !== this.pool.poolName ||
      formValue.poolDescription !== (this.pool.poolDescription || '') ||
      formValue.isReference !== this.pool.isReference ||
      formValue.pooledOnlySamplesText !== (this.pool.pooledOnlySamples?.join(', ') || '') ||
      formValue.pooledAndIndependentSamplesText !== (this.pool.pooledAndIndependentSamples?.join(', ') || '')
    );
  }

  private parseSampleNumbers(text: string): number[] {
    if (!text?.trim()) return [];
    
    const results: number[] = [];
    
    text
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .forEach(s => {
        // Check if it's a range (e.g., "9-12")
        if (s.includes('-')) {
          const parts = s.split('-').map(p => p.trim());
          if (parts.length === 2) {
            const start = parseInt(parts[0], 10);
            const end = parseInt(parts[1], 10);
            
            if (!isNaN(start) && !isNaN(end) && start > 0 && end > 0 && start <= end && end <= this.maxSampleCount) {
              // Add all numbers in the range
              for (let i = start; i <= end; i++) {
                results.push(i);
              }
            }
          }
        } else {
          // Single number
          const num = parseInt(s, 10);
          if (!isNaN(num) && num > 0 && num <= this.maxSampleCount) {
            results.push(num);
          }
        }
      });
    
    // Remove duplicates and sort
    return [...new Set(results)].sort((a, b) => a - b);
  }

  // Form validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.editForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.editForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) {
      return `${this.getFieldDisplayName(fieldName)} is required`;
    }
    if (field.errors['maxlength']) {
      return `${this.getFieldDisplayName(fieldName)} must be less than ${field.errors['maxlength'].requiredLength} characters`;
    }

    return 'Invalid value';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      'poolName': 'Pool name',
      'poolDescription': 'Description',
      'pooledOnlySamplesText': 'Pooled only samples',
      'pooledAndIndependentSamplesText': 'Pooled and independent samples'
    };
    return displayNames[fieldName] || fieldName;
  }

  // Helper methods for template
  get pooledOnlySamplesCount(): number {
    const text = this.editForm.get('pooledOnlySamplesText')?.value || '';
    return this.parseSampleNumbers(text).length;
  }

  get pooledAndIndependentSamplesCount(): number {
    const text = this.editForm.get('pooledAndIndependentSamplesText')?.value || '';
    return this.parseSampleNumbers(text).length;
  }

  get totalSamplesCount(): number {
    return this.pooledOnlySamplesCount + this.pooledAndIndependentSamplesCount;
  }
}