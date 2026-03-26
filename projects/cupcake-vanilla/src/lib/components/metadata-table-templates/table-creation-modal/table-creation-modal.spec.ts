import { FormBuilder, FormGroup, Validators } from '@angular/forms';

describe('TableCreationModalComponent', () => {
  let fb: FormBuilder;
  let form: FormGroup;

  beforeEach(() => {
    fb = new FormBuilder();
    form = fb.group({
      tableName: ['', [Validators.required]],
      sampleCount: [1, [Validators.required, Validators.min(1)]],
      description: ['']
    });
  });

  it('should initialize form with default values', () => {
    expect(form.get('tableName')?.value).toBe('');
    expect(form.get('sampleCount')?.value).toBe(1);
  });

  it('should validate required table name', () => {
    expect(form.valid).toBeFalse();
    form.patchValue({ tableName: 'New Table' });
    expect(form.valid).toBeTrue();
  });

  it('should validate minimum sample count', () => {
    form.patchValue({ tableName: 'Test' });
    expect(form.valid).toBeTrue();

    form.patchValue({ sampleCount: 0 });
    expect(form.valid).toBeFalse();
  });
});
