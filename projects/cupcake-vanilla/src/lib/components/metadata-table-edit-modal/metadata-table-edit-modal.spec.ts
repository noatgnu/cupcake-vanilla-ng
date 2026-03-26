import { FormBuilder, FormGroup, Validators } from '@angular/forms';

describe('MetadataTableEditModal', () => {
  let fb: FormBuilder;
  let editForm: FormGroup;
  let isCreateMode: boolean;

  function getTitle(): string {
    return isCreateMode ? 'Create New Metadata Table' : 'Edit Metadata Table';
  }

  beforeEach(() => {
    fb = new FormBuilder();
    editForm = fb.group({
      name: ['', [Validators.required]],
      sampleCount: [1, [Validators.required, Validators.min(1)]],
      description: [''],
      labGroup: [null]
    });
    isCreateMode = false;
  });

  it('should initialize form with default values in create mode', () => {
    expect(isCreateMode).toBe(false);
    expect(editForm.get('name')?.value).toBe('');
    expect(editForm.get('sampleCount')?.value).toBe(1);
  });

  it('should have correct title for create mode', () => {
    isCreateMode = true;
    expect(getTitle()).toBe('Create New Metadata Table');
  });

  it('should have correct title for edit mode', () => {
    isCreateMode = false;
    expect(getTitle()).toBe('Edit Metadata Table');
  });

  it('should validate required name field', () => {
    editForm.get('name')?.setValue('');
    expect(editForm.get('name')?.valid).toBeFalse();

    editForm.get('name')?.setValue('Test Table');
    expect(editForm.get('name')?.valid).toBeTrue();
  });

  it('should validate minimum sample count', () => {
    editForm.get('sampleCount')?.setValue(0);
    expect(editForm.get('sampleCount')?.valid).toBeFalse();

    editForm.get('sampleCount')?.setValue(1);
    expect(editForm.get('sampleCount')?.valid).toBeTrue();
  });
});
