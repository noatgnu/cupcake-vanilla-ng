import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OntologySearchService } from './ontology-search';
import { CUPCAKE_CORE_CONFIG } from '@noatgnu/cupcake-core';

describe('OntologySearchService', () => {
  let service: OntologySearchService;
  let httpMock: HttpTestingController;
  const mockConfig = {
    apiUrl: 'https://api.test.com',
    siteName: 'Test Site'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        OntologySearchService,
        { provide: CUPCAKE_CORE_CONFIG, useValue: mockConfig }
      ]
    });
    service = TestBed.inject(OntologySearchService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('suggest', () => {
    it('should search with required query parameter', (done) => {
      const mockResponse = {
        ontologyType: 'species',
        suggestions: [
          { id: 1, term: 'Homo sapiens', ontologyId: 'NCBITaxon:9606' }
        ],
        searchTerm: 'homo',
        searchType: 'contains',
        limit: 50,
        count: 1,
        hasMore: false
      };

      service.suggest({ q: 'homo' }).subscribe(response => {
        expect(response.suggestions.length).toBe(1);
        expect(response.searchTerm).toBe('homo');
        done();
      });

      const req = httpMock.expectOne(req =>
        req.url === `${mockConfig.apiUrl}/ontology/search/suggest/` &&
        req.params.get('q') === 'homo'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should include optional type parameter', (done) => {
      service.suggest({ q: 'liver', type: 'tissue' }).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(req =>
        req.params.get('q') === 'liver' &&
        req.params.get('type') === 'tissue'
      );
      req.flush({ ontologyType: 'tissue', suggestions: [], searchTerm: 'liver', searchType: 'contains', limit: 50, count: 0, hasMore: false });
    });

    it('should include match type parameter', (done) => {
      service.suggest({ q: 'brain', match: 'startswith' }).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(req =>
        req.params.get('q') === 'brain' &&
        req.params.get('match') === 'startswith'
      );
      req.flush({ ontologyType: '', suggestions: [], searchTerm: 'brain', searchType: 'startswith', limit: 50, count: 0, hasMore: false });
    });

    it('should include limit parameter', (done) => {
      service.suggest({ q: 'cancer', limit: 10 }).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(req =>
        req.params.get('q') === 'cancer' &&
        req.params.get('limit') === '10'
      );
      req.flush({ ontologyType: '', suggestions: [], searchTerm: 'cancer', searchType: 'contains', limit: 10, count: 0, hasMore: false });
    });

    it('should include custom filters as JSON', (done) => {
      const customFilters = { organism: 'Homo sapiens' };

      service.suggest({ q: 'disease', customFilters }).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(req =>
        req.params.get('q') === 'disease' &&
        req.params.get('custom_filters') === JSON.stringify(customFilters)
      );
      req.flush({ ontologyType: '', suggestions: [], searchTerm: 'disease', searchType: 'contains', limit: 50, count: 0, hasMore: false });
    });
  });

  describe('suggestWithFilters', () => {
    it('should call suggest with all parameters', (done) => {
      const customFilters = { category: 'human' };

      service.suggestWithFilters('test', 'species', customFilters, 25).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(req =>
        req.params.get('q') === 'test' &&
        req.params.get('type') === 'species' &&
        req.params.get('limit') === '25' &&
        req.params.get('custom_filters') === JSON.stringify(customFilters)
      );
      req.flush({ ontologyType: 'species', suggestions: [], searchTerm: 'test', searchType: 'contains', limit: 25, count: 0, hasMore: false });
    });
  });

  describe('searchAll', () => {
    it('should search across all ontology types', (done) => {
      service.searchAll('heart').subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(req =>
        req.params.get('q') === 'heart' &&
        req.params.get('limit') === '50'
      );
      req.flush({ ontologyType: '', suggestions: [], searchTerm: 'heart', searchType: 'contains', limit: 50, count: 0, hasMore: false });
    });

    it('should respect custom limit', (done) => {
      service.searchAll('lung', 100).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(req =>
        req.params.get('q') === 'lung' &&
        req.params.get('limit') === '100'
      );
      req.flush({ ontologyType: '', suggestions: [], searchTerm: 'lung', searchType: 'contains', limit: 100, count: 0, hasMore: false });
    });
  });

  describe('searchType', () => {
    it('should search specific ontology type', (done) => {
      service.searchType('brain', 'tissue').subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(req =>
        req.params.get('q') === 'brain' &&
        req.params.get('type') === 'tissue' &&
        req.params.get('limit') === '50'
      );
      req.flush({ ontologyType: 'tissue', suggestions: [], searchTerm: 'brain', searchType: 'contains', limit: 50, count: 0, hasMore: false });
    });

    it('should respect custom limit', (done) => {
      service.searchType('mouse', 'species', 10).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(req =>
        req.params.get('q') === 'mouse' &&
        req.params.get('type') === 'species' &&
        req.params.get('limit') === '10'
      );
      req.flush({ ontologyType: 'species', suggestions: [], searchTerm: 'mouse', searchType: 'contains', limit: 10, count: 0, hasMore: false });
    });
  });

  describe('Error Handling', () => {
    it('should handle server errors', (done) => {
      service.suggest({ q: 'test' }).subscribe({
        next: () => fail('should have failed'),
        error: error => {
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(req => req.params.get('q') === 'test');
      req.flush({ error: 'Internal server error' }, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle empty results', (done) => {
      const mockResponse = {
        ontologyType: 'species',
        suggestions: [],
        searchTerm: 'nonexistent',
        searchType: 'contains',
        limit: 50,
        count: 0,
        hasMore: false
      };

      service.suggest({ q: 'nonexistent' }).subscribe(response => {
        expect(response.count).toBe(0);
        expect(response.suggestions).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(req => req.params.get('q') === 'nonexistent');
      req.flush(mockResponse);
    });
  });
});
