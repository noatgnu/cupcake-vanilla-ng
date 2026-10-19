import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { CUPCAKE_CORE_CONFIG, WebSocketService } from '@noatgnu/cupcake-core';
import { Subject, of } from 'rxjs';
import { ExternalVocabularyUpdatedMessage } from '../models';
import { OntologySearchService, OntologySuggestResponse } from './ontology-search';
import { OntologyType, OntologyTypeLabels } from '../models/enums';
import { ONTOLOGY_TYPE_CONFIGS } from '../models/ontology-config';

describe('OntologySearchService', () => {
  let service: jasmine.SpyObj<OntologySearchService>;

  beforeEach(() => {
    service = jasmine.createSpyObj('OntologySearchService', [
      'suggest',
      'suggestWithFilters',
      'searchAll',
      'searchType'
    ]);
  });

  describe('suggest', () => {
    it('should search with required query parameter', (done) => {
      const mockResponse: OntologySuggestResponse = {
        ontologyType: 'species',
        suggestions: [{ id: 1, term: 'Homo sapiens', ontologyId: 'NCBITaxon:9606' } as any],
        searchTerm: 'homo',
        searchType: 'contains',
        limit: 50,
        count: 1,
        hasMore: false
      };
      service.suggest.and.returnValue(of(mockResponse));

      service.suggest({ q: 'homo' }).subscribe(response => {
        expect(response.suggestions.length).toBe(1);
        expect(response.searchTerm).toBe('homo');
        done();
      });

      expect(service.suggest).toHaveBeenCalledWith({ q: 'homo' });
    });

    it('should include optional type parameter', (done) => {
      const mockResponse: OntologySuggestResponse = {
        ontologyType: 'tissue',
        suggestions: [],
        searchTerm: 'liver',
        searchType: 'contains',
        limit: 50,
        count: 0,
        hasMore: false
      };
      service.suggest.and.returnValue(of(mockResponse));

      service.suggest({ q: 'liver', type: 'tissue' }).subscribe(() => {
        done();
      });

      expect(service.suggest).toHaveBeenCalledWith({ q: 'liver', type: 'tissue' });
    });
  });

  describe('searchAll', () => {
    it('should search across all ontology types', (done) => {
      const mockResponse: OntologySuggestResponse = {
        ontologyType: '',
        suggestions: [],
        searchTerm: 'heart',
        searchType: 'contains',
        limit: 50,
        count: 0,
        hasMore: false
      };
      service.searchAll.and.returnValue(of(mockResponse));

      service.searchAll('heart').subscribe(() => {
        done();
      });

      expect(service.searchAll).toHaveBeenCalledWith('heart');
    });
  });

  describe('searchType', () => {
    it('should search specific ontology type', (done) => {
      const mockResponse: OntologySuggestResponse = {
        ontologyType: 'tissue',
        suggestions: [],
        searchTerm: 'brain',
        searchType: 'contains',
        limit: 50,
        count: 0,
        hasMore: false
      };
      service.searchType.and.returnValue(of(mockResponse));

      service.searchType('brain', 'tissue').subscribe(() => {
        done();
      });

      expect(service.searchType).toHaveBeenCalledWith('brain', 'tissue');
    });

    it('should search BTO ontology type', (done) => {
      const mockResponse: OntologySuggestResponse = {
        ontologyType: 'bto',
        suggestions: [{ id: 'BTO:0000567', value: 'liver', displayName: 'liver', ontologyType: 'bto' }],
        searchTerm: 'liver',
        searchType: 'contains',
        limit: 10,
        count: 1,
        hasMore: false
      };
      service.searchType.and.returnValue(of(mockResponse));

      service.searchType('liver', OntologyType.BTO, 10).subscribe(response => {
        expect(response.ontologyType).toBe('bto');
        expect(response.suggestions.length).toBe(1);
        done();
      });

      expect(service.searchType).toHaveBeenCalledWith('liver', OntologyType.BTO, 10);
    });

    it('should search DOID ontology type', (done) => {
      const mockResponse: OntologySuggestResponse = {
        ontologyType: 'doid',
        suggestions: [{ id: 'DOID:9351', value: 'diabetes mellitus', displayName: 'diabetes mellitus', ontologyType: 'doid' }],
        searchTerm: 'diabetes',
        searchType: 'contains',
        limit: 10,
        count: 1,
        hasMore: false
      };
      service.searchType.and.returnValue(of(mockResponse));

      service.searchType('diabetes', OntologyType.DOID, 10).subscribe(response => {
        expect(response.ontologyType).toBe('doid');
        expect(response.suggestions.length).toBe(1);
        done();
      });

      expect(service.searchType).toHaveBeenCalledWith('diabetes', OntologyType.DOID, 10);
    });
  });
});

describe('OntologyType BTO and DOID', () => {
  it('should have BTO enum value', () => {
    expect(OntologyType.BTO).toBe('bto');
  });

  it('should have DOID enum value', () => {
    expect(OntologyType.DOID).toBe('doid');
  });

  it('should have BTO label in OntologyTypeLabels', () => {
    expect(OntologyTypeLabels[OntologyType.BTO]).toBe('BTO Tissue');
  });

  it('should have DOID label in OntologyTypeLabels', () => {
    expect(OntologyTypeLabels[OntologyType.DOID]).toBe('Disease Ontology (DOID)');
  });

  it('should include BTO in ONTOLOGY_TYPE_CONFIGS', () => {
    const btoConfig = ONTOLOGY_TYPE_CONFIGS.find(c => c.value === OntologyType.BTO);
    expect(btoConfig).toBeDefined();
    expect(btoConfig?.label).toBe('BTO Tissue (BRENDA)');
  });

  it('should include DOID in ONTOLOGY_TYPE_CONFIGS', () => {
    const doidConfig = ONTOLOGY_TYPE_CONFIGS.find(c => c.value === OntologyType.DOID);
    expect(doidConfig).toBeDefined();
    expect(doidConfig?.label).toBe('Disease Ontology (DOID)');
  });
});

describe('OntologyType protocols.io vocabularies', () => {
  it('should match the backend type keys', () => {
    expect(OntologyType.PROTOCOLS_IO_REAGENT).toBe('protocols_io_reagent');
    expect(OntologyType.PROTOCOLS_IO_UNIT).toBe('protocols_io_unit');
  });

  it('should have labels in OntologyTypeLabels', () => {
    expect(OntologyTypeLabels[OntologyType.PROTOCOLS_IO_REAGENT]).toBe('protocols.io Reagent');
    expect(OntologyTypeLabels[OntologyType.PROTOCOLS_IO_UNIT]).toBe('protocols.io Unit');
  });

  it('should be selectable in ONTOLOGY_TYPE_CONFIGS', () => {
    const reagent = ONTOLOGY_TYPE_CONFIGS.find(c => c.value === OntologyType.PROTOCOLS_IO_REAGENT);
    const unit = ONTOLOGY_TYPE_CONFIGS.find(c => c.value === OntologyType.PROTOCOLS_IO_UNIT);
    expect(reagent?.label).toBe('Reagent (protocols.io)');
    expect(unit?.label).toBe('Unit (protocols.io)');
  });
});

describe('OntologySearchService external vocabulary updates', () => {
  let service: OntologySearchService;
  let httpMock: HttpTestingController;
  let messages: Subject<ExternalVocabularyUpdatedMessage>;
  let websocket: jasmine.SpyObj<WebSocketService>;

  beforeEach(() => {
    messages = new Subject<ExternalVocabularyUpdatedMessage>();
    websocket = jasmine.createSpyObj('WebSocketService', ['filterMessages']);
    websocket.filterMessages.and.returnValue(messages.asObservable() as any);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: 'http://localhost:8000/api' } },
        { provide: WebSocketService, useValue: websocket },
        OntologySearchService
      ]
    });
    service = TestBed.inject(OntologySearchService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should listen for external vocabulary updates on the websocket', () => {
    const received: ExternalVocabularyUpdatedMessage[] = [];
    service.vocabularyUpdates().subscribe(message => received.push(message));
    messages.next({ type: 'external_vocabulary.updated', ontology_type: 'protocols_io_reagent', search_term: 'RIPA', stored: 2 });

    expect(websocket.filterMessages).toHaveBeenCalledWith('external_vocabulary.updated');
    expect(received.map(message => message.stored)).toEqual([2]);
  });

  it('should expose remotePending from the suggest response', () => {
    let response: OntologySuggestResponse | undefined;
    service.suggest({ q: 'ripa', type: 'protocols_io_reagent' }).subscribe(result => response = result);

    const request = httpMock.expectOne(req => req.url === 'http://localhost:8000/api/ontology/search/suggest/');
    expect(request.request.params.get('type')).toBe('protocols_io_reagent');
    request.flush({ ontology_type: 'protocols_io_reagent', suggestions: [], remote_pending: true, has_more: false });

    expect(response?.remotePending).toBeTrue();
  });
});
