import { of } from 'rxjs';
import { OntologySearchService, OntologySuggestResponse } from './ontology-search';

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
  });
});
