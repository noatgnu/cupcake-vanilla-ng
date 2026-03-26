import { FormBuilder, FormGroup } from '@angular/forms';

describe('SdrfCleavageInput', () => {
  let fb: FormBuilder;
  let form: FormGroup;

  beforeEach(() => {
    fb = new FormBuilder();
    form = fb.group({
      cleavageAgent: [''],
      missedCleavages: [null]
    });
  });

  it('should initialize form with empty values', () => {
    expect(form.get('cleavageAgent')?.value).toBe('');
    expect(form.get('missedCleavages')?.value).toBeNull();
  });

  it('should update cleavage agent', () => {
    form.patchValue({ cleavageAgent: 'Trypsin' });
    expect(form.get('cleavageAgent')?.value).toBe('Trypsin');
  });

  it('should update missed cleavages', () => {
    form.patchValue({ missedCleavages: 2 });
    expect(form.get('missedCleavages')?.value).toBe(2);
  });
});
