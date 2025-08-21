import { Component, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SamplePool } from '../../models';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-sample-pool-edit-modal',
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

  constructor(
    private fb: FormBuilder,
    private activeModal: NgbActiveModal,
    private apiService: ApiService
  ) {
    this.editForm = this.fb.group({
      pool_name: ['', [Validators.required, Validators.maxLength(255)]],
      pool_description: [''],
      is_reference: [false],
      template_sample: [null],
      pooled_only_samples_text: [''],
      pooled_and_independent_samples_text: ['']
    });
  }

  ngOnInit() {
    if (this.pool) {
      this.editForm.patchValue({
        pool_name: this.pool.pool_name,
        pool_description: this.pool.pool_description || '',
        is_reference: this.pool.is_reference,
        template_sample: this.pool.template_sample || null,
        pooled_only_samples_text: this.pool.pooled_only_samples?.join(', ') || '',
        pooled_and_independent_samples_text: this.pool.pooled_and_independent_samples?.join(', ') || ''
      });
    }
  }

  onSubmit(): void {
    if (this.editForm.valid && this.pool.id) {
      this.isLoading.set(true);
      
      const formValue = this.editForm.value;
      
      // Parse sample arrays from text input
      const pooledOnlySamples = this.parseSampleNumbers(formValue.pooled_only_samples_text);
      const pooledAndIndependentSamples = this.parseSampleNumbers(formValue.pooled_and_independent_samples_text);
      
      const updateData: Partial<SamplePool> = {
        pool_name: formValue.pool_name.trim(),
        pool_description: formValue.pool_description?.trim() || undefined,
        is_reference: formValue.is_reference,
        template_sample: formValue.template_sample || undefined,
        pooled_only_samples: pooledOnlySamples,
        pooled_and_independent_samples: pooledAndIndependentSamples
      };

      this.apiService.updateSamplePool(this.pool.id, updateData).subscribe({
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
    return `Edit ${this.pool?.pool_name || 'Sample Pool'}`;
  }

  get hasChanges(): boolean {
    if (!this.pool) return false;
    
    const formValue = this.editForm.value;
    return (
      formValue.pool_name !== this.pool.pool_name ||
      formValue.pool_description !== (this.pool.pool_description || '') ||
      formValue.is_reference !== this.pool.is_reference ||
      formValue.template_sample !== this.pool.template_sample ||
      formValue.pooled_only_samples_text !== (this.pool.pooled_only_samples?.join(', ') || '') ||
      formValue.pooled_and_independent_samples_text !== (this.pool.pooled_and_independent_samples?.join(', ') || '')
    );
  }

  private parseSampleNumbers(text: string): number[] {
    if (!text?.trim()) return [];
    
    return text
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => parseInt(s, 10))
      .filter(n => !isNaN(n) && n > 0 && n <= this.maxSampleCount);
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
      'pool_name': 'Pool name',
      'pool_description': 'Description',
      'template_sample': 'Template sample',
      'pooled_only_samples_text': 'Pooled only samples',
      'pooled_and_independent_samples_text': 'Pooled and independent samples'
    };
    return displayNames[fieldName] || fieldName;
  }

  // Helper methods for template
  get pooledOnlySamplesCount(): number {
    const text = this.editForm.get('pooled_only_samples_text')?.value || '';
    return this.parseSampleNumbers(text).length;
  }

  get pooledAndIndependentSamplesCount(): number {
    const text = this.editForm.get('pooled_and_independent_samples_text')?.value || '';
    return this.parseSampleNumbers(text).length;
  }

  get totalSamplesCount(): number {
    return this.pooledOnlySamplesCount + this.pooledAndIndependentSamplesCount;
  }
}