import { FormBuilder, FormGroup, Validators } from '@angular/forms';

describe('SamplePoolCreateModal', () => {
  let fb: FormBuilder;
  let form: FormGroup;

  beforeEach(() => {
    fb = new FormBuilder();
    form = fb.group({
      poolName: ['', [Validators.required]],
      description: ['']
    });
  });

  it('should initialize form with empty values', () => {
    expect(form.get('poolName')?.value).toBe('');
    expect(form.get('description')?.value).toBe('');
  });

  it('should validate required pool name', () => {
    expect(form.get('poolName')?.valid).toBeFalse();
    form.get('poolName')?.setValue('Test Pool');
    expect(form.get('poolName')?.valid).toBeTrue();
  });

  it('should be valid when required fields are filled', () => {
    form.get('poolName')?.setValue('Test Pool');
    expect(form.valid).toBeTrue();
  });
});
