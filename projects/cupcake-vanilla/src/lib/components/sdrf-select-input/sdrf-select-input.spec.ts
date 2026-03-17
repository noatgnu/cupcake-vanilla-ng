import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { SdrfSelectInput } from './sdrf-select-input';

describe('SdrfSelectInput', () => {
  let component: SdrfSelectInput;
  let fixture: ComponentFixture<SdrfSelectInput>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SdrfSelectInput, FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(SdrfSelectInput);
    component = fixture.componentInstance;
    component.options = ['option1', 'option2', 'option3'];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with provided value', () => {
    component.value = 'option2';
    component.ngOnInit();
    expect(component.selectedValue()).toBe('option2');
  });

  it('should emit value on selection change', () => {
    const spy = spyOn(component.valueChange, 'emit');
    component.onSelectionChange('option1');
    expect(spy).toHaveBeenCalledWith('option1');
  });

  it('should switch to custom mode when allowCustom is true', () => {
    component.allowCustom = true;
    component.onSelectionChange('__custom__');
    expect(component.isCustomMode()).toBe(true);
  });

  it('should emit custom value', () => {
    const spy = spyOn(component.valueChange, 'emit');
    component.isCustomMode.set(true);
    component.onCustomValueChange('custom value');
    expect(spy).toHaveBeenCalledWith('custom value');
  });
});
