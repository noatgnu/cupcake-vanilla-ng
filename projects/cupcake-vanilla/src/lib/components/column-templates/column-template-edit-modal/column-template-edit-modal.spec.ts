import { FormBuilder, FormGroup, Validators } from '@angular/forms';

describe('ColumnTemplateEditModal', () => {
  let fb: FormBuilder;
  let form: FormGroup;

  beforeEach(() => {
    fb = new FormBuilder();
    form = fb.group({
      name: ['', [Validators.required]],
      columnName: ['', [Validators.required]],
      columnType: ['characteristic', [Validators.required]],
      inputType: ['text'],
      description: [''],
      isActive: [true]
    });
  });

  it('should initialize form with default values', () => {
    expect(form.get('name')?.value).toBe('');
    expect(form.get('columnType')?.value).toBe('characteristic');
    expect(form.get('isActive')?.value).toBe(true);
  });

  it('should validate required fields', () => {
    expect(form.valid).toBeFalse();
    form.patchValue({
      name: 'Test Template',
      columnName: 'test_column'
    });
    expect(form.valid).toBeTrue();
  });

  it('should allow updating input type', () => {
    form.patchValue({ inputType: 'select' });
    expect(form.get('inputType')?.value).toBe('select');
  });
});
