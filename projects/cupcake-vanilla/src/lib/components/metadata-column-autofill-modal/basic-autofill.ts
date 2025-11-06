import { Component, Input, OnInit, signal, computed, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { MetadataColumn } from '../../models';

export interface BasicAutofillConfig {
  column: MetadataColumn;
  sampleCount: number;
  selectedSampleIndices?: number[];
  allColumns?: MetadataColumn[];
}

export interface BasicAutofillResult {
  fillMode: 'template' | 'range';
  sampleIndices: number[];
  values: Array<{ sampleIndex: number; value: string }>;
}

@Component({
  selector: 'ccv-basic-autofill',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbPaginationModule],
  templateUrl: './basic-autofill.html',
  styleUrl: './basic-autofill.scss'
})
export class BasicAutofillComponent implements OnInit {
  @Input() config!: BasicAutofillConfig;
  @Output() submit = new EventEmitter<BasicAutofillResult>();

  autofillForm: FormGroup;
  fillMode = signal<'template' | 'range'>('template');
  sampleIndices = signal<number[]>([]);
  currentPage = signal(1);
  pageSize = 10;

  allSampleNumbers = computed(() => {
    return Array.from({ length: this.config.sampleCount }, (_, idx) => idx + 1);
  });

  paginatedSampleNumbers = computed(() => {
    const all = this.allSampleNumbers();
    const start = (this.currentPage() - 1) * this.pageSize;
    return all.slice(start, start + this.pageSize);
  });

  sourceNameColumn = computed(() => {
    return this.config.allColumns?.find(c => c.name.toLowerCase() === 'source name');
  });

  assayNameColumn = computed(() => {
    return this.config.allColumns?.find(c => c.name.toLowerCase() === 'assay name');
  });

  fractionIdentifierColumn = computed(() => {
    return this.config.allColumns?.find(c => c.name.toLowerCase() === 'comment[fraction identifier]');
  });

  labelColumn = computed(() => {
    return this.config.allColumns?.find(c => c.name.toLowerCase() === 'comment[label]');
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

  constructor(private fb: FormBuilder) {
    this.autofillForm = this.fb.group({
      fillMode: ['template'],
      template: ['run {sample_index}', [Validators.required]],
      rangeStart: [1],
      rangeIncrement: [1],
      selectedIndices: [[]]
    });
  }

  ngOnInit(): void {
    const indices = this.config.selectedSampleIndices && this.config.selectedSampleIndices.length > 0
      ? this.config.selectedSampleIndices
      : Array.from({ length: this.config.sampleCount }, (_, i) => i + 1);

    this.sampleIndices.set(indices);
    this.autofillForm.patchValue({ selectedIndices: indices });
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

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  getColumnValueForSample(column: MetadataColumn | undefined, sampleIndex: number): string {
    if (!column) return '';

    const modifier = column.modifiers?.find(m => this.isSampleInRange(sampleIndex, m.samples));
    if (modifier) {
      return modifier.value;
    }

    return column.value || '';
  }

  private isSampleInRange(sampleIndex: number, rangeStr: string): boolean {
    if (!rangeStr) return false;

    const ranges = rangeStr.split(',').map(s => s.trim());
    for (const range of ranges) {
      if (range.includes('-')) {
        const [start, end] = range.split('-').map(n => parseInt(n.trim(), 10));
        if (sampleIndex >= start && sampleIndex <= end) {
          return true;
        }
      } else {
        if (sampleIndex === parseInt(range, 10)) {
          return true;
        }
      }
    }
    return false;
  }

  onSubmit(): void {
    if (this.autofillForm.invalid) {
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

    this.submit.emit({
      fillMode: mode,
      sampleIndices: indices,
      values
    });
  }

  useTemplate(template: string): void {
    this.autofillForm.patchValue({ template });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.autofillForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  protected readonly Math = Math;
}
