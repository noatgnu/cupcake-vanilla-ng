import { FormBuilder, FormGroup, Validators } from '@angular/forms';

describe('ColumnEditModal', () => {
  let fb: FormBuilder;
  let form: FormGroup;

  beforeEach(() => {
    fb = new FormBuilder();
    form = fb.group({
      columnName: ['', [Validators.required]],
      columnType: ['characteristic'],
      position: [0]
    });
  });

  it('should initialize form with default values', () => {
    expect(form.get('columnName')?.value).toBe('');
    expect(form.get('columnType')?.value).toBe('characteristic');
    expect(form.get('position')?.value).toBe(0);
  });

  it('should validate required column name', () => {
    expect(form.valid).toBeFalse();
    form.patchValue({ columnName: 'test_column' });
    expect(form.valid).toBeTrue();
  });
});
