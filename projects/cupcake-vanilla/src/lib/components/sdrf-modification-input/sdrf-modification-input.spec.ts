import { FormBuilder, FormGroup } from '@angular/forms';

describe('SdrfModificationInput', () => {
  let fb: FormBuilder;
  let form: FormGroup;

  beforeEach(() => {
    fb = new FormBuilder();
    form = fb.group({
      modification: [''],
      position: [''],
      targetAminoAcid: ['']
    });
  });

  it('should initialize form with empty values', () => {
    expect(form.get('modification')?.value).toBe('');
    expect(form.get('position')?.value).toBe('');
    expect(form.get('targetAminoAcid')?.value).toBe('');
  });

  it('should update modification', () => {
    form.patchValue({ modification: 'Acetyl' });
    expect(form.get('modification')?.value).toBe('Acetyl');
  });

  it('should update position', () => {
    form.patchValue({ position: '1' });
    expect(form.get('position')?.value).toBe('1');
  });

  it('should update target amino acid', () => {
    form.patchValue({ targetAminoAcid: 'K' });
    expect(form.get('targetAminoAcid')?.value).toBe('K');
  });
});
