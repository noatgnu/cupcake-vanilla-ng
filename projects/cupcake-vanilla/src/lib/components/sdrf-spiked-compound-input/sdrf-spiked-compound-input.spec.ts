import { FormBuilder, FormGroup } from '@angular/forms';

describe('SdrfSpikedCompoundInput', () => {
  let fb: FormBuilder;
  let form: FormGroup;

  beforeEach(() => {
    fb = new FormBuilder();
    form = fb.group({
      compound: [''],
      concentration: [''],
      unit: ['']
    });
  });

  it('should initialize form with empty values', () => {
    expect(form.get('compound')?.value).toBe('');
    expect(form.get('concentration')?.value).toBe('');
    expect(form.get('unit')?.value).toBe('');
  });

  it('should update compound', () => {
    form.patchValue({ compound: 'BSA' });
    expect(form.get('compound')?.value).toBe('BSA');
  });

  it('should update concentration and unit', () => {
    form.patchValue({ concentration: '1', unit: 'ug/ml' });
    expect(form.get('concentration')?.value).toBe('1');
    expect(form.get('unit')?.value).toBe('ug/ml');
  });
});
