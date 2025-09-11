import { Component, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SamplePool, SamplePoolCreateRequest, MetadataTable, SamplePoolService } from '../../models';
import { ToastService } from '../../services/toast';

interface SampleSelectionItem {
  sampleNumber: number;
  selected: boolean;
  pooled: boolean; // Track if already in a pool
}

@Component({
  selector: 'app-sample-pool-create-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbModule],
  templateUrl: './sample-pool-create-modal.html',
  styleUrl: './sample-pool-create-modal.scss'
})
export class SamplePoolCreateModal implements OnInit {
  @Input() metadataTable!: MetadataTable;
  @Output() poolCreated = new EventEmitter<SamplePool>();

  // Expose Math to template
  Math = Math;

  createForm: FormGroup;
  isLoading = signal(false);
  
  // Sample selection management
  samples = signal<SampleSelectionItem[]>([]);
  pooledOnlySamples = signal<number[]>([]);
  pooledAndIndependentSamples = signal<number[]>([]);
  
  // UI state
  selectionMode = signal<'manual' | 'range'>('manual');
  currentPage = signal(1);
  samplesPerPage = 20;

  constructor(
    private fb: FormBuilder,
    private activeModal: NgbActiveModal,
    private samplePoolService: SamplePoolService,
    private toastService: ToastService
  ) {
    this.createForm = this.fb.group({
      poolName: ['', [Validators.required, Validators.maxLength(255)]],
      poolDescription: [''],
      isReference: [false],
      range_start: [1, [Validators.min(1)]],
      range_end: [10, [Validators.min(1)]],
      pooled_only_samples_text: [''],
      pooled_and_independent_samples_text: ['']
    });
  }

  ngOnInit() {
    if (!this.metadataTable) {
      this.activeModal.dismiss('No metadata table provided');
      return;
    }

    // Initialize sample list
    this.initializeSamples();
    
    // Update range end validator based on sample count
    const rangeEndControl = this.createForm.get('range_end');
    if (rangeEndControl) {
      rangeEndControl.setValidators([
        Validators.min(1), 
        Validators.max(this.metadataTable.sampleCount)
      ]);
      rangeEndControl.updateValueAndValidity();
    }

    const rangeStartControl = this.createForm.get('range_start');
    if (rangeStartControl) {
      rangeStartControl.setValidators([
        Validators.min(1), 
        Validators.max(this.metadataTable.sampleCount)
      ]);
      rangeStartControl.updateValueAndValidity();
    }
  }

  private initializeSamples(): void {
    const sampleItems: SampleSelectionItem[] = [];
    const existingPooledSamples = this.getExistingPooledSamples();
    
    for (let i = 1; i <= this.metadataTable.sampleCount; i++) {
      sampleItems.push({
        sampleNumber: i,
        selected: false,
        pooled: existingPooledSamples.includes(i)
      });
    }
    
    this.samples.set(sampleItems);
  }

  private getExistingPooledSamples(): number[] {
    if (!this.metadataTable.samplePools) return [];
    
    const pooledSamples: number[] = [];
    this.metadataTable.samplePools.forEach((pool: any) => {
      pooledSamples.push(...pool.pooled_only_samples || []);
      pooledSamples.push(...pool.pooled_and_independent_samples || []);
    });
    
    return [...new Set(pooledSamples)]; // Remove duplicates
  }

  // Sample selection methods
  toggleSampleSelection(sampleNumber: number): void {
    const samples = this.samples();
    const sampleIndex = samples.findIndex(s => s.sampleNumber === sampleNumber);
    if (sampleIndex >= 0) {
      samples[sampleIndex].selected = !samples[sampleIndex].selected;
      this.samples.set([...samples]);
      this.updateSampleTextInputs();
    }
  }

  selectSamplesInRange(): void {
    const start = this.createForm.get('range_start')?.value || 1;
    const end = this.createForm.get('range_end')?.value || 1;
    
    if (start > end) {
      this.toastService.error('Start sample must be less than or equal to end sample');
      return;
    }

    const samples = this.samples();
    for (let i = start; i <= end; i++) {
      const sampleIndex = samples.findIndex(s => s.sampleNumber === i);
      if (sampleIndex >= 0) {
        samples[sampleIndex].selected = true;
      }
    }
    
    this.samples.set([...samples]);
    this.updateSampleTextInputs();
    this.toastService.success(`Selected samples ${start} to ${end}`);
  }

  clearAllSelections(): void {
    const samples = this.samples();
    samples.forEach(s => s.selected = false);
    this.samples.set([...samples]);
    this.updateSampleTextInputs();
  }

  private updateSampleTextInputs(): void {
    const selectedSamples = this.samples().filter(s => s.selected).map(s => s.sampleNumber);
    const pooledOnly = this.pooledOnlySamples();
    const pooledAndIndependent = this.pooledAndIndependentSamples();
    
    // For now, put all selected samples in pooled_only
    this.createForm.patchValue({
      pooled_only_samples_text: selectedSamples.join(', '),
      pooled_and_independent_samples_text: pooledAndIndependent.join(', ')
    });
  }

  // Pool type assignment
  assignToPooledOnly(): void {
    const selectedSamples = this.samples().filter(s => s.selected).map(s => s.sampleNumber);
    this.pooledOnlySamples.set(selectedSamples);
    this.updateSampleTextInputs();
  }

  assignToPooledAndIndependent(): void {
    const selectedSamples = this.samples().filter(s => s.selected).map(s => s.sampleNumber);
    this.pooledAndIndependentSamples.set(selectedSamples);
    this.updateSampleTextInputs();
  }

  onSubmit(): void {
    if (this.createForm.valid) {
      this.isLoading.set(true);
      
      const formValue = this.createForm.value;
      
      // Parse sample arrays from text input or use current assignments
      const pooledOnlySamples = this.parseSampleNumbers(formValue.pooled_only_samples_text);
      const pooledAndIndependentSamples = this.parseSampleNumbers(formValue.pooled_and_independent_samples_text);
      
      if (pooledOnlySamples.length === 0 && pooledAndIndependentSamples.length === 0) {
        this.toastService.error('Please select at least one sample for the pool');
        this.isLoading.set(false);
        return;
      }

      const createData: SamplePoolCreateRequest = {
        poolName: formValue.poolName.trim(),
        poolDescription: formValue.poolDescription?.trim() || undefined,
        isReference: formValue.isReference,
        pooledOnlySamples: pooledOnlySamples,
        pooledAndIndependentSamples: pooledAndIndependentSamples,
        metadataTable: this.metadataTable.id
      };

      this.samplePoolService.createSamplePool(createData).subscribe({
        next: (createdPool) => {
          this.toastService.success(`Sample pool "${createdPool.poolName}" created successfully`);
          this.poolCreated.emit(createdPool);
          this.activeModal.close(createdPool);
        },
        error: (error) => {
          console.error('Error creating sample pool:', error);
          this.toastService.error('Failed to create sample pool');
          this.isLoading.set(false);
        }
      });
    }
  }

  onCancel(): void {
    this.activeModal.dismiss();
  }

  // Helper methods
  parseSampleNumbers(text: string): number[] {
    if (!text?.trim()) return [];
    
    const numbers: number[] = [];
    const parts = text.split(',').map(s => s.trim()).filter(s => s.length > 0);
    
    parts.forEach(part => {
      if (part.includes('-')) {
        // Handle range like "5-8"
        const [start, end] = part.split('-').map(s => parseInt(s.trim(), 10));
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          for (let i = start; i <= end; i++) {
            if (i > 0 && i <= this.metadataTable.sampleCount) {
              numbers.push(i);
            }
          }
        }
      } else {
        // Handle single number
        const num = parseInt(part, 10);
        if (!isNaN(num) && num > 0 && num <= this.metadataTable.sampleCount) {
          numbers.push(num);
        }
      }
    });
    
    return [...new Set(numbers)].sort((a, b) => a - b); // Remove duplicates and sort
  }

  // Computed properties for template
  get selectedSamplesCount(): number {
    return this.samples().filter(s => s.selected).length;
  }

  get totalPooledSamplesCount(): number {
    const pooledOnly = this.parseSampleNumbers(this.createForm.get('pooled_only_samples_text')?.value || '');
    const pooledAndIndependent = this.parseSampleNumbers(this.createForm.get('pooled_and_independent_samples_text')?.value || '');
    return pooledOnly.length + pooledAndIndependent.length;
  }

  get paginatedSamples(): SampleSelectionItem[] {
    const samples = this.samples();
    const start = (this.currentPage() - 1) * this.samplesPerPage;
    return samples.slice(start, start + this.samplesPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.samples().length / this.samplesPerPage);
  }

  // Form validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.createForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.createForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) {
      return `${this.getFieldDisplayName(fieldName)} is required`;
    }
    if (field.errors['maxlength']) {
      return `${this.getFieldDisplayName(fieldName)} must be less than ${field.errors['maxlength'].requiredLength} characters`;
    }
    if (field.errors['min']) {
      return `${this.getFieldDisplayName(fieldName)} must be at least ${field.errors['min'].min}`;
    }
    if (field.errors['max']) {
      return `${this.getFieldDisplayName(fieldName)} must be no more than ${field.errors['max'].max}`;
    }

    return 'Invalid value';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      'poolName': 'Pool name',
      'poolDescription': 'Description',
      'range_start': 'Range start',
      'range_end': 'Range end'
    };
    return displayNames[fieldName] || fieldName;
  }

  // Pagination
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage.set(page);
    }
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }
}