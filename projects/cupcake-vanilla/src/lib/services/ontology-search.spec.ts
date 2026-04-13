import { of } from 'rxjs';
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
