import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { CleavageInput } from './cleavage-input';
import { SdrfSyntaxService, OntologySearchService, OntologySuggestion, OntologyType } from '@noatgnu/cupcake-vanilla';

describe('CleavageInput', () => {
  let component: CleavageInput;
  let fixture: ComponentFixture<CleavageInput>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CleavageInput],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        SdrfSyntaxService,
        OntologySearchService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CleavageInput);
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
    expect(component.CS()).toBe('');
  });

  it('should parse cleavage value on init', fakeAsync(() => {
    fixture.componentRef.setInput('value', 'NT=Trypsin;AC=MS:1001251');
    component.ngOnInit();
    tick();

    expect(component.NT()).toBe('Trypsin');
    expect(component.AC()).toBe('MS:1001251');
  }));

  it('should emit formatted value when NT is set', fakeAsync(() => {
    const emitSpy = spyOn(component.valueChange, 'emit');

    component.NT.set('Trypsin');
    component.onFieldChange();
    tick();

    expect(emitSpy).toHaveBeenCalled();
    const emittedValue = emitSpy.calls.mostRecent().args[0];
    expect(emittedValue).toContain('NT=Trypsin');
  }));

  it('should emit empty when NT is empty', fakeAsync(() => {
    const emitSpy = spyOn(component.valueChange, 'emit');

    component.NT.set('');
    component.onFieldChange();
    tick();

    expect(emitSpy).toHaveBeenCalledWith('');
  }));

  it('should include optional fields in output', fakeAsync(() => {
    const emitSpy = spyOn(component.valueChange, 'emit');

    component.NT.set('Trypsin');
    component.AC.set('MS:1001251');
    component.CS.set('(?<=[KR])(?!P)');
    component.onFieldChange();
    tick();

    expect(emitSpy).toHaveBeenCalled();
    const emittedValue = emitSpy.calls.mostRecent().args[0];
    expect(emittedValue).toContain('AC=MS:1001251');
    expect(emittedValue).toContain('CS=(?<=[KR])(?!P)');
  }));

  it('should trigger search on NT input', fakeAsync(() => {
    component.onNTInput('Tryp');
    tick(350);

    const req = httpMock.expectOne(req => req.url.includes('/ontology/search/suggest/'));
    expect(req.request.params.get('q')).toBe('Tryp');
    expect(req.request.params.get('type')).toBe('ms_unique_vocabularies');
    req.flush({ suggestions: [] });
  }));

  it('should select suggestion and update fields', fakeAsync(() => {
    const suggestion: OntologySuggestion = {
      id: 'MS:1001251',
      value: 'Trypsin',
      displayName: 'Trypsin',
      ontologyType: OntologyType.MS_UNIQUE_VOCABULARIES
    };

    component.selectSuggestion(suggestion);
    tick();

    expect(component.NT()).toBe('Trypsin');
    expect(component.AC()).toBe('MS:1001251');
    expect(component.showSuggestions()).toBeFalse();
  }));

  it('should hide suggestions after delay', fakeAsync(() => {
    component.showSuggestions.set(true);
    component.hideSuggestions();

    expect(component.showSuggestions()).toBeTrue();
    tick(250);
    expect(component.showSuggestions()).toBeFalse();
  }));

  it('should not search for short queries', fakeAsync(() => {
    component.onNTInput('T');
    tick(350);

    httpMock.expectNone(req => req.url.includes('/ontology/search/suggest/'));
  }));
});
