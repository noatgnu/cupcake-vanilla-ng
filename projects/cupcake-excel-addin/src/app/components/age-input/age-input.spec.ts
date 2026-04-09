import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AgeInput } from './age-input';
import { SdrfSyntaxService } from '@noatgnu/cupcake-vanilla';

describe('AgeInput', () => {
  let component: AgeInput;
  let fixture: ComponentFixture<AgeInput>;
  let sdrfSyntaxService: SdrfSyntaxService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgeInput],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        SdrfSyntaxService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AgeInput);
    component = fixture.componentInstance;
    sdrfSyntaxService = TestBed.inject(SdrfSyntaxService);
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
  });

  it('should parse single age value on init', fakeAsync(() => {
    fixture.componentRef.setInput('value', '30Y6M');
    component.ngOnInit();
    tick();

    expect(component.isRange()).toBeFalse();
    expect(component.years()).toBe(30);
    expect(component.months()).toBe(6);
  }));

  it('should parse age range value on init', fakeAsync(() => {
    fixture.componentRef.setInput('value', '25Y-35Y');
    component.ngOnInit();
    tick();

    expect(component.isRange()).toBeTrue();
    expect(component.rangeStartYears()).toBe(25);
    expect(component.rangeEndYears()).toBe(35);
  }));

  it('should toggle between single and range mode', () => {
    expect(component.isRange()).toBeFalse();

    component.toggleRange();
    expect(component.isRange()).toBeTrue();

    component.toggleRange();
    expect(component.isRange()).toBeFalse();
  });

  it('should emit formatted value when years is set', fakeAsync(() => {
    const emitSpy = spyOn(component.valueChange, 'emit');

    component.years.set(25);
    tick();
    fixture.detectChanges();

    expect(emitSpy).toHaveBeenCalled();
    const emittedValue = emitSpy.calls.mostRecent().args[0];
    expect(emittedValue).toContain('25Y');
  }));

  it('should emit formatted range value', fakeAsync(() => {
    const emitSpy = spyOn(component.valueChange, 'emit');

    component.isRange.set(true);
    component.rangeStartYears.set(20);
    component.rangeEndYears.set(30);
    tick();
    fixture.detectChanges();

    expect(emitSpy).toHaveBeenCalled();
  }));

  it('should handle days input', fakeAsync(() => {
    const emitSpy = spyOn(component.valueChange, 'emit');

    component.days.set(15);
    tick();
    fixture.detectChanges();

    expect(emitSpy).toHaveBeenCalled();
    const emittedValue = emitSpy.calls.mostRecent().args[0];
    expect(emittedValue).toContain('15D');
  }));

  it('should handle combined years, months, days', fakeAsync(() => {
    const emitSpy = spyOn(component.valueChange, 'emit');

    component.years.set(30);
    component.months.set(6);
    component.days.set(15);
    tick();
    fixture.detectChanges();

    expect(emitSpy).toHaveBeenCalled();
  }));
});
