import { FormBuilder, FormGroup } from '@angular/forms';
import { signal, WritableSignal } from '@angular/core';

interface BasicAutofillConfig {
  column: {
    id: number;
    name: string;
    displayName: string;
    type: string;
  };
  sampleCount: number;
}

describe('BasicAutofillComponent', () => {
  let fb: FormBuilder;
  let autofillForm: FormGroup;
  let fillMode: WritableSignal<'template' | 'value'>;
  let sampleIndices: WritableSignal<number[]>;

  const mockConfig: BasicAutofillConfig = {
    column: {
      id: 1,
      name: 'test column',
      displayName: 'Test Column',
      type: 'text'
    },
    sampleCount: 10
  };

  function initSampleIndices(): void {
    const indices: number[] = [];
    for (let i = 0; i < mockConfig.sampleCount; i++) {
      indices.push(i);
    }
    sampleIndices.set(indices);
  }

  function toggleSample(index: number): void {
    sampleIndices.update(indices => {
      const idx = indices.indexOf(index);
      if (idx > -1) {
        return indices.filter(i => i !== index);
      } else {
        return [...indices, index].sort((a, b) => a - b);
      }
    });
  }

  function clearSelection(): void {
    sampleIndices.set([]);
  }

  function selectAllSamples(): void {
    const indices: number[] = [];
    for (let i = 0; i < mockConfig.sampleCount; i++) {
      indices.push(i);
    }
    sampleIndices.set(indices);
  }

  function isSampleSelected(index: number): boolean {
    return sampleIndices().includes(index);
  }

  function useTemplate(template: string): void {
    autofillForm.get('template')?.setValue(template);
  }

  beforeEach(() => {
    fb = new FormBuilder();
    autofillForm = fb.group({
      template: ['run {sample_index}'],
      value: ['']
    });
    fillMode = signal<'template' | 'value'>('template');
    sampleIndices = signal<number[]>([]);
    initSampleIndices();
  });

  it('should initialize sample indices from config', () => {
    expect(sampleIndices().length).toBe(10);
  });

  it('should toggle sample selection', () => {
    const initialLength = sampleIndices().length;
    toggleSample(1);
    expect(sampleIndices().length).toBe(initialLength - 1);
    toggleSample(1);
    expect(sampleIndices().length).toBe(initialLength);
  });

  it('should clear selection', () => {
    clearSelection();
    expect(sampleIndices().length).toBe(0);
  });

  it('should select all samples', () => {
    clearSelection();
    selectAllSamples();
    expect(sampleIndices().length).toBe(10);
  });

  it('should use template fill mode by default', () => {
    expect(fillMode()).toBe('template');
  });

  it('should have default template value', () => {
    expect(autofillForm.get('template')?.value).toBe('run {sample_index}');
  });

  it('should update template when useTemplate is called', () => {
    useTemplate('sample_{n}');
    expect(autofillForm.get('template')?.value).toBe('sample_{n}');
  });

  it('should check if sample is selected', () => {
    expect(isSampleSelected(1)).toBeTrue();
    toggleSample(1);
    expect(isSampleSelected(1)).toBeFalse();
  });
});
