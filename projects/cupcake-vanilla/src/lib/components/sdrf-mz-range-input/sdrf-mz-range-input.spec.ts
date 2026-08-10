import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';

import { SdrfMzRangeInput } from './sdrf-mz-range-input';

describe('SdrfMzRangeInput', () => {
  let component: SdrfMzRangeInput;
  let fixture: ComponentFixture<SdrfMzRangeInput>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SdrfMzRangeInput, ReactiveFormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(SdrfMzRangeInput);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should parse a valid m/z range string', () => {
    component.value = '400m/z-1250m/z';
    component.ngOnChanges({ value: { currentValue: '400m/z-1250m/z', previousValue: '', firstChange: false, isFirstChange: () => false } });
    expect(component.form.value.low).toBe('400');
    expect(component.form.value.high).toBe('1250');
  });

  it('should emit formatted value when form changes', () => {
    const emitted: string[] = [];
    component.valueChange.subscribe(v => emitted.push(v));
    component.ngOnInit();
    component.form.setValue({ low: '300', high: '1600' });
    expect(emitted).toContain('300m/z-1600m/z');
  });

  it('should emit empty string when either field is blank', () => {
    const emitted: string[] = [];
    component.valueChange.subscribe(v => emitted.push(v));
    component.ngOnInit();
    component.form.setValue({ low: '', high: '1250' });
    expect(emitted[emitted.length - 1]).toBe('');
  });
});