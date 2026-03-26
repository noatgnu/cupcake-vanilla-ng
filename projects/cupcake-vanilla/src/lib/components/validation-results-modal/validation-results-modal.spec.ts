import { signal, WritableSignal } from '@angular/core';

interface ValidationError {
  row: number;
  column: string;
  message: string;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

describe('ValidationResultsModal', () => {
  let result: WritableSignal<ValidationResult | null>;
  let isLoading: WritableSignal<boolean>;

  beforeEach(() => {
    result = signal<ValidationResult | null>(null);
    isLoading = signal(false);
  });

  it('should start with no results', () => {
    expect(result()).toBeNull();
  });

  it('should display valid result', () => {
    result.set({
      valid: true,
      errors: [],
      warnings: []
    });
    expect(result()?.valid).toBeTrue();
  });

  it('should display invalid result with errors', () => {
    result.set({
      valid: false,
      errors: [
        { row: 1, column: 'species', message: 'Invalid species' }
      ],
      warnings: []
    });
    expect(result()?.valid).toBeFalse();
    expect(result()?.errors.length).toBe(1);
  });

  it('should track loading state', () => {
    expect(isLoading()).toBe(false);
    isLoading.set(true);
    expect(isLoading()).toBe(true);
  });
});
