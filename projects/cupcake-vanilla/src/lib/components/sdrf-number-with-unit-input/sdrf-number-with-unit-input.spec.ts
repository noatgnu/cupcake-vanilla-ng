import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { SdrfNumberWithUnitInput } from './sdrf-number-with-unit-input';

describe('SdrfNumberWithUnitInput', () => {
  let component: SdrfNumberWithUnitInput;
  let fixture: ComponentFixture<SdrfNumberWithUnitInput>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SdrfNumberWithUnitInput, ReactiveFormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(SdrfNumberWithUnitInput);
    component = fixture.componentInstance;
    component.units = ['mg', 'g', 'kg'];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should parse value with unit', () => {
    component.value = '50 mg';
    component.ngOnInit();
    expect(component.form.get('number')?.value).toBe('50');
    expect(component.form.get('unit')?.value).toBe('mg');
  });

  it('should emit formatted value on change', () => {
    const spy = spyOn(component.valueChange, 'emit');
    component.form.patchValue({ number: '100', unit: 'g' });
    expect(spy).toHaveBeenCalledWith('100 g');
  });

  it('should select example value', () => {
    const spy = spyOn(component.valueChange, 'emit');
    component.selectExample('25 mg');
    expect(spy).toHaveBeenCalledWith('25 mg');
  });
});
