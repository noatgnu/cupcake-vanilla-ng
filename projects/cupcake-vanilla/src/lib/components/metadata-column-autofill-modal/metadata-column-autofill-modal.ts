import { Component, Input, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { MetadataColumn } from '../../models';

export interface MetadataColumnAutofillConfig {
  column: MetadataColumn;
  metadataTableId: number;
  sampleCount: number;
  selectedSampleIndices?: number[];
}

@Component({
  selector: 'ccv-metadata-column-autofill-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './metadata-column-autofill-modal.html',
  styleUrl: './metadata-column-autofill-modal.scss'
})
export class MetadataColumnAutofillModal implements OnInit {
  @Input() config!: MetadataColumnAutofillConfig;

  autofillForm: FormGroup;
  isSubmitting = signal(false);
  fillMode = signal<'template' | 'range'>('template');

  sampleIndices = signal<number[]>([]);

  allSampleNumbers = computed(() => {
    return Array.from({ length: this.config.sampleCount }, (_, idx) => idx + 1);
  });

  previewValues = computed(() => {
    const mode = this.fillMode();
    const indices = this.sampleIndices();

    if (indices.length === 0) {
      return [];
    }

    if (mode === 'template') {
      const template = this.autofillForm?.get('template')?.value || '';
      if (!template) return [];

      return indices.map(index => ({
        index,
        value: this.generateValue(template, index)
      }));
    } else {
      const startValue = this.autofillForm?.get('rangeStart')?.value;
      const increment = this.autofillForm?.get('rangeIncrement')?.value || 1;

      if (startValue === null || startValue === undefined) return [];

      return indices.map((index, i) => ({
        index,
        value: (startValue + (i * increment)).toString()
      }));
    }
  });

  constructor(
    private fb: FormBuilder,
    private activeModal: NgbActiveModal
  ) {
    this.autofillForm = this.fb.group({
      fillMode: ['template'],
      template: ['run {sample_index}', [Validators.required]],
      rangeStart: [1],
      rangeIncrement: [1],
      applyToSelection: [true],
      selectedIndices: [[]]
    });
  }

  ngOnInit(): void {
    const indices = this.config.selectedSampleIndices && this.config.selectedSampleIndices.length > 0
      ? this.config.selectedSampleIndices
      : Array.from({ length: this.config.sampleCount }, (_, i) => i + 1);

    this.sampleIndices.set(indices);
    this.autofillForm.patchValue({ selectedIndices: indices });

    this.autofillForm.get('template')?.valueChanges.subscribe(() => {
      this.previewValues();
    });

    this.autofillForm.get('rangeStart')?.valueChanges.subscribe(() => {
      this.previewValues();
    });

    this.autofillForm.get('rangeIncrement')?.valueChanges.subscribe(() => {
      this.previewValues();
    });
  }

  private generateValue(template: string, sampleIndex: number): string {
    return template
      .replace(/{sample_index}/g, sampleIndex.toString())
      .replace(/{index}/g, sampleIndex.toString())
      .replace(/{n}/g, sampleIndex.toString());
  }

  toggleSample(index: number): void {
    const current = this.sampleIndices();
    const newIndices = current.includes(index)
      ? current.filter(i => i !== index)
      : [...current, index].sort((a, b) => a - b);

    this.sampleIndices.set(newIndices);
    this.autofillForm.patchValue({ selectedIndices: newIndices });
  }

  selectAllSamples(): void {
    const allIndices = Array.from({ length: this.config.sampleCount }, (_, i) => i + 1);
    this.sampleIndices.set(allIndices);
    this.autofillForm.patchValue({ selectedIndices: allIndices });
  }

  clearSelection(): void {
    this.sampleIndices.set([]);
    this.autofillForm.patchValue({ selectedIndices: [] });
  }

  isSampleSelected(index: number): boolean {
    return this.sampleIndices().includes(index);
  }

  onSubmit(): void {
    if (this.autofillForm.invalid || this.isSubmitting()) {
      return;
    }

    const indices = this.sampleIndices();
    if (indices.length === 0) {
      return;
    }

    const mode = this.fillMode();
    let values;

    if (mode === 'template') {
      const template = this.autofillForm.get('template')?.value;
      values = indices.map(index => ({
        sampleIndex: index,
        value: this.generateValue(template, index)
      }));
    } else {
      const startValue = this.autofillForm.get('rangeStart')?.value;
      const increment = this.autofillForm.get('rangeIncrement')?.value || 1;
      values = indices.map((index, i) => ({
        sampleIndex: index,
        value: (startValue + (i * increment)).toString()
      }));
    }

    this.activeModal.close({
      fillMode: mode,
      sampleIndices: indices,
      values
    });
  }

  close(): void {
    this.activeModal.dismiss('cancel');
  }

  useTemplate(template: string): void {
    this.autofillForm.patchValue({ template });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.autofillForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  protected readonly Array = Array;
  protected readonly Math = Math;
}
