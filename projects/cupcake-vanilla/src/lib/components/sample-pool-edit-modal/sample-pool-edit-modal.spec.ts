import { FormBuilder, FormGroup, Validators } from '@angular/forms';

describe('SamplePoolEditModal', () => {
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
  });

  it('should validate required pool name', () => {
    expect(form.get('poolName')?.valid).toBeFalse();
    form.get('poolName')?.setValue('Test Pool');
    expect(form.get('poolName')?.valid).toBeTrue();
  });

  it('should populate form with existing pool data', () => {
    form.patchValue({
      poolName: 'Existing Pool',
      description: 'Existing description'
    });
    expect(form.get('poolName')?.value).toBe('Existing Pool');
    expect(form.get('description')?.value).toBe('Existing description');
  });
});
