import { FormBuilder, FormGroup } from '@angular/forms';
import { EventEmitter } from '@angular/core';

describe('SdrfNumberWithUnitInput', () => {
  let fb: FormBuilder;
  let form: FormGroup;
  let units: string[];
  let valueChange: EventEmitter<string>;

  function parseValue(value: string): { number: string; unit: string } {
    if (!value) return { number: '', unit: units[0] || '' };
    const parts = value.split(' ');
    if (parts.length >= 2) {
      return { number: parts[0], unit: parts[1] };
    }
    return { number: value, unit: units[0] || '' };
  }

  function formatValue(): string {
    const number = form.get('number')?.value || '';
    const unit = form.get('unit')?.value || '';
    return number ? `${number} ${unit}` : '';
  }

  function selectExample(example: string): void {
    const { number, unit } = parseValue(example);
    form.patchValue({ number, unit });
    valueChange.emit(formatValue());
  }

  beforeEach(() => {
    fb = new FormBuilder();
    units = ['mg', 'g', 'kg'];
    form = fb.group({
      number: [''],
      unit: [units[0]]
    });
    valueChange = new EventEmitter<string>();

    form.valueChanges.subscribe(() => {
      valueChange.emit(formatValue());
    });
  });

  it('should parse value with unit', () => {
    const parsed = parseValue('50 mg');
    form.patchValue(parsed);
    expect(form.get('number')?.value).toBe('50');
    expect(form.get('unit')?.value).toBe('mg');
  });

  it('should format value correctly', () => {
    form.patchValue({ number: '100', unit: 'g' });
    expect(formatValue()).toBe('100 g');
  });

  it('should emit formatted value on change', () => {
    let emittedValue: string | undefined;
    const subscription = valueChange.subscribe(value => {
      emittedValue = value;
    });
    form.patchValue({ number: '100', unit: 'g' });
    expect(emittedValue).toBe('100 g');
    subscription.unsubscribe();
  });

  it('should select example value', () => {
    let emittedValue: string | undefined;
    const subscription = valueChange.subscribe(value => {
      emittedValue = value;
    });
    selectExample('25 mg');
    expect(emittedValue).toBe('25 mg');
    subscription.unsubscribe();
  });
});
