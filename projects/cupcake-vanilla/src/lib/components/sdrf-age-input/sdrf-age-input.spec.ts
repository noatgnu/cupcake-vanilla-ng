import { FormBuilder, FormGroup } from '@angular/forms';

describe('SdrfAgeInput', () => {
  let fb: FormBuilder;
  let ageForm: FormGroup;

  function getIsRange(): boolean {
    return ageForm.get('isRange')?.value ?? false;
  }

  beforeEach(() => {
    fb = new FormBuilder();
    ageForm = fb.group({
      isRange: [false],
      singleValue: [''],
      singleUnit: ['year'],
      rangeStart: [''],
      rangeEnd: [''],
      rangeUnit: ['year']
    });
  });

  it('should initialize form with default values', () => {
    expect(ageForm.get('isRange')?.value).toBe(false);
    expect(getIsRange()).toBe(false);
  });

  it('should toggle range mode', () => {
    ageForm.patchValue({ isRange: true });
    expect(getIsRange()).toBe(true);
  });

  it('should have default unit as year', () => {
    expect(ageForm.get('singleUnit')?.value).toBe('year');
    expect(ageForm.get('rangeUnit')?.value).toBe('year');
  });

  it('should update single value', () => {
    ageForm.patchValue({ singleValue: '25' });
    expect(ageForm.get('singleValue')?.value).toBe('25');
  });

  it('should update range values', () => {
    ageForm.patchValue({ rangeStart: '18', rangeEnd: '65' });
    expect(ageForm.get('rangeStart')?.value).toBe('18');
    expect(ageForm.get('rangeEnd')?.value).toBe('65');
  });
});
