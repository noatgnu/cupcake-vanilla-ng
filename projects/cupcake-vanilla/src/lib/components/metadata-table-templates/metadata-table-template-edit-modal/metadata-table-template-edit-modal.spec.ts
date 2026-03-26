import { FormBuilder, FormGroup, Validators } from '@angular/forms';

describe('MetadataTableTemplateEditModal', () => {
  let fb: FormBuilder;
  let form: FormGroup;

  beforeEach(() => {
    fb = new FormBuilder();
    form = fb.group({
      name: ['', [Validators.required]],
      description: [''],
      isActive: [true]
    });
  });

  it('should initialize form with default values', () => {
    expect(form.get('name')?.value).toBe('');
    expect(form.get('isActive')?.value).toBe(true);
  });

  it('should validate required name', () => {
    expect(form.valid).toBeFalse();
    form.patchValue({ name: 'Test Template' });
    expect(form.valid).toBeTrue();
  });
});
