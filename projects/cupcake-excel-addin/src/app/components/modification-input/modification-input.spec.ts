import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ModificationInput } from './modification-input';
import { SdrfSyntaxService, OntologySearchService, OntologySuggestion, OntologyType, UnimodFullData } from '@noatgnu/cupcake-vanilla';
import { CUPCAKE_CORE_CONFIG } from '@noatgnu/cupcake-core';

describe('ModificationInput', () => {
  let component: ModificationInput;
  let fixture: ComponentFixture<ModificationInput>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModificationInput],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        SdrfSyntaxService,
        OntologySearchService,
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: 'http://localhost:8000/api/v1' } }
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
    expect(component.TS()).toBe('');
    expect(component.showSpecifications()).toBeFalse();
  });

  it('should parse modification value on init', async () => {
    fixture.componentRef.setInput('value', 'NT=Carbamidomethyl;AC=UNIMOD:4;TA=C');
    component.ngOnInit();
    await fixture.whenStable();

    expect(component.NT()).toBe('Carbamidomethyl');
    expect(component.AC()).toBe('UNIMOD:4');
    expect(component.TA()).toBe('C');
  });

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

  it('should emit formatted value when NT and TA are set', () => {
    const emitSpy = spyOn(component.valueChange, 'emit');

    component.NT.set('Carbamidomethyl');
    component.TA.set('C');
    component.onFieldChange();

    expect(emitSpy).toHaveBeenCalled();
    const emittedValue = emitSpy.calls.mostRecent().args[0];
    expect(emittedValue).toContain('NT=Carbamidomethyl');
    expect(emittedValue).toContain('TA=C');
  });

  it('should emit empty when required fields are missing', () => {
    const emitSpy = spyOn(component.valueChange, 'emit');

    component.NT.set('');
    component.TA.set('');
    component.onFieldChange();

    expect(emitSpy).toHaveBeenCalledWith('');
  });

  it('should include optional fields in output', () => {
    const emitSpy = spyOn(component.valueChange, 'emit');

    component.NT.set('Carbamidomethyl');
    component.TA.set('C');
    component.AC.set('UNIMOD:4');
    component.MT.set('Fixed');
    component.onFieldChange();

    expect(emitSpy).toHaveBeenCalled();
    const emittedValue = emitSpy.calls.mostRecent().args[0];
    expect(emittedValue).toContain('AC=UNIMOD:4');
    expect(emittedValue).toContain('MT=Fixed');
  });

  it('should emit partial value when only NT is set', () => {
    const emitSpy = spyOn(component.valueChange, 'emit');

    component.NT.set('Carbamidomethyl');
    component.AC.set('UNIMOD:4');
    component.onFieldChange();

    expect(emitSpy).toHaveBeenCalled();
    const emittedValue = emitSpy.calls.mostRecent().args[0];
    expect(emittedValue).toContain('NT=Carbamidomethyl');
    expect(emittedValue).toContain('AC=UNIMOD:4');
    expect(emittedValue).not.toContain('TA=');
  });

  it('should trigger search on NT input', async () => {
    component.onNTInput('Carb');
    await new Promise(r => setTimeout(r, 350));

    const req = httpMock.expectOne(req => req.url.includes('/ontology/search/suggest/'));
    expect(req.request.params.get('q')).toBe('Carb');
    expect(req.request.params.get('type')).toBe('unimod');
    req.flush({ suggestions: [] });
  });

  it('should select suggestion and update fields', async () => {
    const suggestion: OntologySuggestion = {
      id: 'UNIMOD:4',
      value: 'Carbamidomethyl',
      displayName: 'Carbamidomethyl',
      ontologyType: OntologyType.UNIMOD
    };

    component.selectSuggestion(suggestion);
    await fixture.whenStable();

    expect(component.NT()).toBe('Carbamidomethyl');
    expect(component.showSuggestions()).toBeFalse();
  });

  it('should show specifications when Unimod suggestion has specs', () => {
    const unimodSuggestion: OntologySuggestion = {
      id: 'UNIMOD:21',
      value: 'Phospho',
      displayName: 'Phospho',
      ontologyType: OntologyType.UNIMOD,
      fullData: {
        accession: 'UNIMOD:21',
        name: 'Phospho',
        definition: 'Phosphorylation',
        additionalData: [],
        generalProperties: {},
        deltaMonoMass: '79.966331',
        deltaAvgeMass: '79.9799',
        deltaComposition: 'H O(3) P',
        specifications: {
          '1': { site: 'S', position: 'Anywhere', classification: 'Post-translational', accession: '', name: '', definition: '', additionalData: [], generalProperties: {}, specifications: {}, deltaMonoMass: '', deltaAvgeMass: '', deltaComposition: '' },
          '2': { site: 'T', position: 'Anywhere', classification: 'Post-translational', accession: '', name: '', definition: '', additionalData: [], generalProperties: {}, specifications: {}, deltaMonoMass: '', deltaAvgeMass: '', deltaComposition: '' }
        }
      } as UnimodFullData
    };

    component.selectSuggestion(unimodSuggestion);

    expect(component.NT()).toBe('Phospho');
    expect(component.AC()).toBe('UNIMOD:21');
    expect(component.showSpecifications()).toBeTrue();
    expect(component.availableSpecifications().length).toBe(2);
  });

  it('should auto-fill fields when specification selected', () => {
    const unimodData: UnimodFullData = {
      accession: 'UNIMOD:21',
      name: 'Phospho',
      definition: '',
      additionalData: [],
      generalProperties: {},
      deltaMonoMass: '79.966331',
      deltaAvgeMass: '',
      deltaComposition: 'H O(3) P',
      specifications: {
        '1': { site: 'S', position: 'Anywhere', classification: 'Post-translational', accession: '', name: '', definition: '', additionalData: [], generalProperties: {}, specifications: {}, deltaMonoMass: '', deltaAvgeMass: '', deltaComposition: '' }
      }
    };
    component.selectedUnimodData.set(unimodData);

    component.selectSpecification('1');

    expect(component.TA()).toBe('S');
    expect(component.PP()).toBe('Anywhere');
    expect(component.MT()).toBe('Variable');
  });

  it('should format TA to uppercase on input', () => {
    component.onTAInput('s,t,y');
    expect(component.TA()).toBe('S,T,Y');
  });

  it('should strip non-amino-acid characters from TA', () => {
    component.onTAInput('S1T2Y');
    expect(component.TA()).toBe('STY');
  });

  it('should include TS in emitted value', () => {
    const emitSpy = spyOn(component.valueChange, 'emit');
    component.NT.set('Phospho');
    component.TS.set('N[^P][ST]');
    component.onFieldChange();

    const emittedValue = emitSpy.calls.mostRecent().args[0];
    expect(emittedValue).toContain('TS=N[^P][ST]');
  });

  it('should hide suggestions after delay', async () => {
    component.showSuggestions.set(true);
    component.hideSuggestions();

    expect(component.showSuggestions()).toBeTrue();
    await new Promise(r => setTimeout(r, 250));
    expect(component.showSuggestions()).toBeFalse();
  });
});
