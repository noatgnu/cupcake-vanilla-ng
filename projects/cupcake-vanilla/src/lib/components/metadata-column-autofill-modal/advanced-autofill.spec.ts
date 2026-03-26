import { FormBuilder, FormArray } from '@angular/forms';

describe('AdvancedAutofillComponent', () => {
  let fb: FormBuilder;
  let advancedForm: ReturnType<FormBuilder['group']>;
  let variations: FormArray;

  beforeEach(() => {
    fb = new FormBuilder();
    advancedForm = fb.group({
      templateSamples: [''],
      targetSampleCount: [null],
      fillStrategy: ['cartesian_product'],
      variations: fb.array([])
    });
    variations = advancedForm.get('variations') as FormArray;
  });

  function addVariation(type: 'range' | 'list' | 'pattern' = 'range'): void {
    const variationGroup = fb.group({
      columnId: [null],
      type: [type],
      start: [1],
      end: [10],
      step: [1],
      values: [''],
      pattern: ['{i}'],
      count: [10]
    });
    variations.push(variationGroup);
  }

  function removeVariation(index: number): void {
    variations.removeAt(index);
  }

  function parseTemplateSamples(value: string): number[] {
    if (!value) return [];
    return value.split(',')
      .map(v => v.trim())
      .filter(v => v)
      .flatMap(v => {
        if (v.includes('-')) {
          const [start, end] = v.split('-').map(n => parseInt(n.trim(), 10));
          if (!isNaN(start) && !isNaN(end) && start <= end) {
            return Array.from({ length: end - start + 1 }, (_, i) => start + i);
          }
        } else {
          const num = parseInt(v, 10);
          if (!isNaN(num)) return [num];
        }
        return [];
      });
  }

  it('should initialize form with default values', () => {
    expect(advancedForm).toBeDefined();
    expect(advancedForm.get('templateSamples')?.value).toBe('');
    expect(advancedForm.get('targetSampleCount')?.value).toBeNull();
    expect(advancedForm.get('fillStrategy')?.value).toBe('cartesian_product');
    expect(variations.length).toBe(0);
  });

  it('should add range variation', () => {
    addVariation('range');
    expect(variations.length).toBe(1);
    expect(variations.at(0).get('type')?.value).toBe('range');
  });

  it('should add list variation', () => {
    addVariation('list');
    expect(variations.length).toBe(1);
    expect(variations.at(0).get('type')?.value).toBe('list');
  });

  it('should remove variation', () => {
    addVariation('range');
    addVariation('list');
    expect(variations.length).toBe(2);
    removeVariation(0);
    expect(variations.length).toBe(1);
    expect(variations.at(0).get('type')?.value).toBe('list');
  });

  it('should parse comma-separated samples', () => {
    const result = parseTemplateSamples('1,2,3');
    expect(result).toEqual([1, 2, 3]);
  });

  it('should parse range notation', () => {
    const result = parseTemplateSamples('1-5');
    expect(result).toEqual([1, 2, 3, 4, 5]);
  });

  it('should handle empty string', () => {
    const result = parseTemplateSamples('');
    expect(result).toEqual([]);
  });
});
