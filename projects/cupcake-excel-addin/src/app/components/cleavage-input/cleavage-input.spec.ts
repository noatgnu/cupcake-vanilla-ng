import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { CleavageInput } from './cleavage-input';
import { SdrfSyntaxService, OntologySearchService, OntologySuggestion, OntologyType } from '@noatgnu/cupcake-vanilla';
import { CUPCAKE_CORE_CONFIG } from '@noatgnu/cupcake-core';

describe('CleavageInput', () => {
  let component: CleavageInput;
  let fixture: ComponentFixture<CleavageInput>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    jasmine.clock().install();

    await TestBed.configureTestingModule({
      imports: [CleavageInput],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        SdrfSyntaxService,
        OntologySearchService,
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: 'http://localhost:8000/api/v1' } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CleavageInput);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
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

  it('should parse cleavage value on init', async () => {
    fixture.componentRef.setInput('value', 'NT=Trypsin;AC=MS:1001251');
    component.ngOnInit();
    await fixture.whenStable();

    expect(component.NT()).toBe('Trypsin');
    expect(component.AC()).toBe('MS:1001251');
  });

  it('should emit formatted value when NT is set', () => {
    const emitSpy = spyOn(component.valueChange, 'emit');

    component.NT.set('Trypsin');
    component.onFieldChange();

    expect(emitSpy).toHaveBeenCalled();
    const emittedValue = emitSpy.calls.mostRecent().args[0];
    expect(emittedValue).toContain('NT=Trypsin');
  });

  it('should emit empty when NT is empty', () => {
    const emitSpy = spyOn(component.valueChange, 'emit');

    component.NT.set('');
    component.onFieldChange();

    expect(emitSpy).toHaveBeenCalledWith('');
  });

  it('should include optional fields in output', () => {
    const emitSpy = spyOn(component.valueChange, 'emit');

    component.NT.set('Trypsin');
    component.AC.set('MS:1001251');
    component.CS.set('(?<=[KR])(?!P)');
    component.onFieldChange();

    expect(emitSpy).toHaveBeenCalled();
    const emittedValue = emitSpy.calls.mostRecent().args[0];
    expect(emittedValue).toContain('AC=MS:1001251');
    expect(emittedValue).toContain('CS=(?<=[KR])(?!P)');
  });

  it('should trigger search on NT input', () => {
    component.onNTInput('Tryp');
    jasmine.clock().tick(351);

    const req = httpMock.expectOne(req => req.url.includes('/ontology/search/suggest/'));
    expect(req.request.params.get('q')).toBe('Tryp');
    expect(req.request.params.get('type')).toBe('ms_unique_vocabularies');
    req.flush({ suggestions: [] });
  });

  it('should select suggestion and update fields', async () => {
    const suggestion: OntologySuggestion = {
      id: 'MS:1001251',
      value: 'Trypsin',
      displayName: 'Trypsin',
      ontologyType: OntologyType.MS_UNIQUE_VOCABULARIES
    };

    component.selectSuggestion(suggestion);
    await fixture.whenStable();

    expect(component.NT()).toBe('Trypsin');
    expect(component.AC()).toBe('MS:1001251');
    expect(component.showSuggestions()).toBeFalse();
  });

  it('should hide suggestions after delay', () => {
    component.showSuggestions.set(true);
    component.hideSuggestions();

    expect(component.showSuggestions()).toBeTrue();
    jasmine.clock().tick(251);
    expect(component.showSuggestions()).toBeFalse();
  });

  it('should not search for short queries', () => {
    component.onNTInput('T');
    jasmine.clock().tick(351);

    httpMock.expectNone(req => req.url.includes('/ontology/search/suggest/'));
  });
});
