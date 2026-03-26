import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { signal, WritableSignal } from '@angular/core';

describe('SearchReplaceModal', () => {
  let fb: FormBuilder;
  let form: FormGroup;
  let isProcessing: WritableSignal<boolean>;

  beforeEach(() => {
    fb = new FormBuilder();
    form = fb.group({
      searchValue: ['', [Validators.required]],
      replaceValue: ['']
    });
    isProcessing = signal(false);
  });

  it('should initialize form with empty values', () => {
    expect(form.get('searchValue')?.value).toBe('');
    expect(form.get('replaceValue')?.value).toBe('');
  });

  it('should validate required search value', () => {
    expect(form.get('searchValue')?.valid).toBeFalse();
    form.get('searchValue')?.setValue('old value');
    expect(form.get('searchValue')?.valid).toBeTrue();
  });

  it('should track processing state', () => {
    expect(isProcessing()).toBe(false);
    isProcessing.set(true);
    expect(isProcessing()).toBe(true);
  });
});
