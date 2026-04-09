import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ModificationInput } from './modification-input';
import { SdrfSyntaxService, OntologySearchService, OntologySuggestion, OntologyType } from '@noatgnu/cupcake-vanilla';

describe('ModificationInput', () => {
  let component: ModificationInput;
  let fixture: ComponentFixture<ModificationInput>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModificationInput],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        SdrfSyntaxService,
        OntologySearchService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ModificationInput);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty values', () => {
    expect(component.NT()).toBe('');
    expect(component.AC()).toBe('');
    expect(component.CF()).toBe('');
    expect(component.MT()).toBe('');
    expect(component.PP()).toBe('');
    expect(component.TA()).toBe('');
    expect(component.MM()).toBe('');
  });

  it('should parse modification value on init', fakeAsync(() => {
    fixture.componentRef.setInput('value', 'NT=Carbamidomethyl;AC=UNIMOD:4;TA=C');
    component.ngOnInit();
    tick();

    expect(component.NT()).toBe('Carbamidomethyl');
    expect(component.AC()).toBe('UNIMOD:4');
    expect(component.TA()).toBe('C');
  }));

  it('should have predefined modification types', () => {
    expect(component.modificationTypes).toContain('Fixed');
    expect(component.modificationTypes).toContain('Variable');
    expect(component.modificationTypes).toContain('Annotated');
  });

  it('should have predefined positions', () => {
    expect(component.positions).toContain('Anywhere');
    expect(component.positions).toContain('Protein N-term');
    expect(component.positions).toContain('Protein C-term');
  });

  it('should emit formatted value when NT and TA are set', fakeAsync(() => {
    const emitSpy = spyOn(component.valueChange, 'emit');

    component.NT.set('Carbamidomethyl');
    component.TA.set('C');
    component.onFieldChange();
    tick();

    expect(emitSpy).toHaveBeenCalled();
    const emittedValue = emitSpy.calls.mostRecent().args[0];
    expect(emittedValue).toContain('NT=Carbamidomethyl');
    expect(emittedValue).toContain('TA=C');
  }));

  it('should emit empty when required fields are missing', fakeAsync(() => {
    const emitSpy = spyOn(component.valueChange, 'emit');

    component.NT.set('');
    component.TA.set('');
    component.onFieldChange();
    tick();

    expect(emitSpy).toHaveBeenCalledWith('');
  }));

  it('should include optional fields in output', fakeAsync(() => {
    const emitSpy = spyOn(component.valueChange, 'emit');

    component.NT.set('Carbamidomethyl');
    component.TA.set('C');
    component.AC.set('UNIMOD:4');
    component.MT.set('Fixed');
    component.onFieldChange();
    tick();

    expect(emitSpy).toHaveBeenCalled();
    const emittedValue = emitSpy.calls.mostRecent().args[0];
    expect(emittedValue).toContain('AC=UNIMOD:4');
    expect(emittedValue).toContain('MT=Fixed');
  }));

  it('should trigger search on NT input', fakeAsync(() => {
    component.onNTInput('Carb');
    tick(350);

    const req = httpMock.expectOne(req => req.url.includes('/ontology/search/suggest/'));
    expect(req.request.params.get('q')).toBe('Carb');
    expect(req.request.params.get('type')).toBe('unimod');
    req.flush({ suggestions: [] });
  }));

  it('should select suggestion and update fields', fakeAsync(() => {
    const suggestion: OntologySuggestion = {
      id: 'UNIMOD:4',
      value: 'Carbamidomethyl',
      displayName: 'Carbamidomethyl',
      ontologyType: OntologyType.UNIMOD
    };

    component.selectSuggestion(suggestion);
    tick();

    expect(component.NT()).toBe('Carbamidomethyl');
    expect(component.showSuggestions()).toBeFalse();
  }));

  it('should hide suggestions after delay', fakeAsync(() => {
    component.showSuggestions.set(true);
    component.hideSuggestions();

    expect(component.showSuggestions()).toBeTrue();
    tick(250);
    expect(component.showSuggestions()).toBeFalse();
  }));
});
