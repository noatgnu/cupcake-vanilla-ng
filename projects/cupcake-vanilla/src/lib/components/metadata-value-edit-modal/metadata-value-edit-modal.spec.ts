import { signal, WritableSignal } from '@angular/core';

describe('MetadataValueEditModal', () => {
  let currentValue: WritableSignal<string>;
  let isLoading: WritableSignal<boolean>;

  beforeEach(() => {
    currentValue = signal('');
    isLoading = signal(false);
  });

  it('should initialize with empty value', () => {
    expect(currentValue()).toBe('');
  });

  it('should update value', () => {
    currentValue.set('new value');
    expect(currentValue()).toBe('new value');
  });

  it('should track loading state', () => {
    expect(isLoading()).toBe(false);
    isLoading.set(true);
    expect(isLoading()).toBe(true);
  });
});
