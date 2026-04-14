import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AgeInput } from './age-input';
import { SdrfSyntaxService } from '@noatgnu/cupcake-vanilla';

describe('AgeInput', () => {
  let component: AgeInput;
  let fixture: ComponentFixture<AgeInput>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgeInput],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        SdrfSyntaxService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AgeInput);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.isRange()).toBeFalse();
    expect(component.years()).toBeNull();
    expect(component.months()).toBeNull();
    expect(component.days()).toBeNull();
    expect(component.weeks()).toBeNull();
  });

  it('should parse single age value on init', async () => {
    fixture.componentRef.setInput('value', '30Y6M');
    component.ngOnInit();
    await fixture.whenStable();

    expect(component.isRange()).toBeFalse();
    expect(component.years()).toBe(30);
    expect(component.months()).toBe(6);
  });

  it('should parse age range value on init', async () => {
    fixture.componentRef.setInput('value', '25Y-35Y');
    component.ngOnInit();
    await fixture.whenStable();

    expect(component.isRange()).toBeTrue();
    expect(component.rangeStartYears()).toBe(25);
    expect(component.rangeEndYears()).toBe(35);
  });

  it('should toggle between single and range mode', () => {
    expect(component.isRange()).toBeFalse();

    component.toggleRange();
    expect(component.isRange()).toBeTrue();

    component.toggleRange();
    expect(component.isRange()).toBeFalse();
  });

  it('should emit formatted value when years is set', async () => {
    const emitSpy = spyOn(component.valueChange, 'emit');

    component.years.set(25);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(emitSpy).toHaveBeenCalled();
    const emittedValue = emitSpy.calls.mostRecent().args[0];
    expect(emittedValue).toContain('25Y');
  });

  it('should emit formatted range value', async () => {
    const emitSpy = spyOn(component.valueChange, 'emit');

    component.isRange.set(true);
    component.rangeStartYears.set(20);
    component.rangeEndYears.set(30);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(emitSpy).toHaveBeenCalled();
  });

  it('should handle days input', async () => {
    const emitSpy = spyOn(component.valueChange, 'emit');

    component.days.set(15);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(emitSpy).toHaveBeenCalled();
    const emittedValue = emitSpy.calls.mostRecent().args[0];
    expect(emittedValue).toContain('15D');
  });

  it('should handle combined years, months, days', async () => {
    const emitSpy = spyOn(component.valueChange, 'emit');

    component.years.set(30);
    component.months.set(6);
    component.days.set(15);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(emitSpy).toHaveBeenCalled();
  });

  it('should parse weeks-only age value on init', async () => {
    fixture.componentRef.setInput('value', '8W');
    component.ngOnInit();
    await fixture.whenStable();

    expect(component.weeks()).toBe(8);
    expect(component.isRange()).toBeFalse();
  });

  it('should emit weeks format when weeks is set', async () => {
    const emitSpy = spyOn(component.valueChange, 'emit');

    component.weeks.set(30);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(emitSpy).toHaveBeenCalled();
    expect(emitSpy.calls.mostRecent().args[0]).toBe('30W');
  });

  it('should prioritize weeks over years/months/days in emission', async () => {
    const emitSpy = spyOn(component.valueChange, 'emit');

    component.years.set(1);
    component.months.set(2);
    component.weeks.set(52);
    await fixture.whenStable();
    fixture.detectChanges();

    const emittedValue = emitSpy.calls.mostRecent().args[0];
    expect(emittedValue).toBe('52W');
  });
});
