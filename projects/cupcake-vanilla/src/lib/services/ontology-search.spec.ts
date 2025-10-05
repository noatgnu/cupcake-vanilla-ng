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

  describe('General Search', () => {
    it('should search ontology terms with query', (done) => {
      const query = 'liver';
      const mockResponse = {
        count: 2,
        results: [
          { id: 1, term: 'liver', ontology: 'UBERON', description: 'A large organ in vertebrates' },
          { id: 2, term: 'liver cell', ontology: 'CL', description: 'A cell found in liver tissue' }
        ]
      };

      service.searchOntology(query).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(req => 
        req.url === `${mockConfig.apiUrl}/ontology-search/` && 
        req.params.get('q') === 'liver'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should search with additional parameters', (done) => {
      const query = 'brain';
      const params = { 
        ontology: 'UBERON',
        limit: 10,
        exact: true
      };

      service.searchOntology(query, params).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(req => 
        req.url === `${mockConfig.apiUrl}/ontology-search/` && 
        req.params.get('q') === 'brain' &&
        req.params.get('ontology') === 'UBERON' &&
        req.params.get('limit') === '10' &&
        req.params.get('exact') === 'true'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ count: 0, results: [] });
    });
  });

  describe('Tissue Search', () => {
    it('should search tissues', (done) => {
      const query = 'heart';
      const mockResponse = {
        count: 3,
        results: [
          { id: 1, term: 'heart', ontologyId: 'UBERON:0000948', description: 'Hollow muscular organ' },
          { id: 2, term: 'heart muscle', ontologyId: 'UBERON:0001133', description: 'Cardiac muscle tissue' }
        ]
      };

      service.searchTissues(query).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(req => 
        req.url === `${mockConfig.apiUrl}/ontology-search/tissues/` && 
        req.params.get('q') === 'heart'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should search tissues with limit', (done) => {
      const query = 'lung';
      const limit = 5;

      service.searchTissues(query, { limit }).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(req => 
        req.params.get('q') === 'lung' &&
        req.params.get('limit') === '5'
      );
      req.flush({ count: 0, results: [] });
    });
  });

  describe('Species Search', () => {
    it('should search species', (done) => {
      const query = 'homo';
      const mockResponse = {
        count: 1,
        results: [
          { 
            id: 1, 
            term: 'Homo sapiens', 
            ontologyId: 'NCBITaxon:9606',
            commonName: 'human',
            scientificName: 'Homo sapiens'
          }
        ]
      };

      service.searchSpecies(query).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(req => 
        req.url === `${mockConfig.apiUrl}/ontology-search/species/` && 
        req.params.get('q') === 'homo'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should search species with exact match', (done) => {
      const query = 'mouse';
      const params = { exact: true };

      service.searchSpecies(query, params).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(req => 
        req.params.get('q') === 'mouse' &&
        req.params.get('exact') === 'true'
      );
      req.flush({ count: 0, results: [] });
    });
  });

  describe('Disease Search', () => {
    it('should search diseases', (done) => {
      const query = 'cancer';
      const mockResponse = {
        count: 5,
        results: [
          { id: 1, term: 'cancer', ontologyId: 'DOID:162', description: 'A disease of cellular proliferation' },
          { id: 2, term: 'lung cancer', ontologyId: 'DOID:1324', description: 'A respiratory system cancer' }
        ]
      };

      service.searchDiseases(query).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(req => 
        req.url === `${mockConfig.apiUrl}/ontology-search/diseases/` && 
        req.params.get('q') === 'cancer'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('Mass Spectrometry Terms', () => {
    it('should search MS terms', (done) => {
      const query = 'ionization';
      const mockResponse = {
        count: 3,
        results: [
          { id: 1, term: 'electrospray ionization', ontologyId: 'MS:1000073' },
          { id: 2, term: 'matrix-assisted laser desorption ionization', ontologyId: 'MS:1000075' }
        ]
      };

      service.searchMSTerms(query).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(req => 
        req.url === `${mockConfig.apiUrl}/ontology-search/ms-terms/` && 
        req.params.get('q') === 'ionization'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should search modifications', (done) => {
      const query = 'phosphorylation';
      const mockResponse = {
        count: 2,
        results: [
          { id: 1, term: 'phosphorylation', ontologyId: 'MOD:00696', deltaMass: 79.966331 },
          { id: 2, term: 'serine phosphorylation', ontologyId: 'MOD:00046', deltaMass: 79.966331 }
        ]
      };

      service.searchModifications(query).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(req => 
        req.url === `${mockConfig.apiUrl}/ontology-search/modifications/` && 
        req.params.get('q') === 'phosphorylation'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('Subcellular Location Search', () => {
    it('should search subcellular locations', (done) => {
      const query = 'nucleus';
      const mockResponse = {
        count: 2,
        results: [
          { id: 1, term: 'nucleus', ontologyId: 'GO:0005634', description: 'Membrane-bounded organelle' },
          { id: 2, term: 'nuclear envelope', ontologyId: 'GO:0005635', description: 'Nuclear membrane' }
        ]
      };

      service.searchSubcellularLocations(query).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(req => 
        req.url === `${mockConfig.apiUrl}/ontology-search/subcellular-locations/` && 
        req.params.get('q') === 'nucleus'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('Parameter Handling', () => {
    it('should handle empty query gracefully', (done) => {
      service.searchOntology('').subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(req => req.params.get('q') === '');
      req.flush({ count: 0, results: [] });
    });

    it('should handle special characters in query', (done) => {
      const query = 'α-synuclein & β-amyloid';
      
      service.searchOntology(query).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(req => 
        req.params.get('q') === 'α-synuclein & β-amyloid'
      );
      req.flush({ count: 0, results: [] });
    });

    it('should handle numeric limits properly', (done) => {
      service.searchTissues('heart', { limit: 25 }).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(req => 
        req.params.get('limit') === '25'
      );
      req.flush({ count: 0, results: [] });
    });

    it('should handle boolean parameters', (done) => {
      service.searchSpecies('mouse', { exact: false }).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(req => 
        req.params.get('exact') === 'false'
      );
      req.flush({ count: 0, results: [] });
    });
  });

  describe('Error Handling', () => {
    it('should handle search timeout', (done) => {
      service.searchOntology('timeout-test').subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(408);
          done();
        }
      );

      const req = httpMock.expectOne(req => req.params.get('q') === 'timeout-test');
      req.flush({ error: 'Request timeout' }, { status: 408, statusText: 'Request Timeout' });
    });

    it('should handle invalid ontology parameter', (done) => {
      service.searchOntology('test', { ontology: 'INVALID' }).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(400);
          expect(error.error.ontology).toContain('Invalid ontology');
          done();
        }
      );

      const req = httpMock.expectOne(req => req.params.get('ontology') === 'INVALID');
      req.flush(
        { ontology: ['Invalid ontology specified'] }, 
        { status: 400, statusText: 'Bad Request' }
      );
    });

    it('should handle server errors', (done) => {
      service.searchTissues('liver').subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(503);
          done();
        }
      );

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/ontology-search/tissues/`);
      req.flush({ error: 'Service unavailable' }, { status: 503, statusText: 'Service Unavailable' });
    });

    it('should handle empty results gracefully', (done) => {
      const mockResponse = { count: 0, results: [] };

      service.searchSpecies('nonexistent-species').subscribe(response => {
        expect(response.count).toBe(0);
        expect(response.results).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(req => req.params.get('q') === 'nonexistent-species');
      req.flush(mockResponse);
    });
  });

  describe('Data Transformation', () => {
    it('should transform snake_case response to camelCase', (done) => {
      const mockResponse = {
        count: 1,
        results: [{
          id: 1,
          ontology_id: 'UBERON:0000948',
          common_name: 'heart',
          scientific_name: 'cardiac organ',
          created_at: '2023-01-01T00:00:00Z'
        }]
      };

      const expectedResponse = {
        count: 1,
        results: [{
          id: 1,
          ontologyId: 'UBERON:0000948',
          commonName: 'heart',
          scientificName: 'cardiac organ',
          createdAt: '2023-01-01T00:00:00Z'
        }]
      };

      service.searchTissues('heart').subscribe(response => {
        expect(response).toEqual(expectedResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/ontology-search/tissues/`);
      req.flush(mockResponse);
    });

    it('should transform camelCase parameters to snake_case', (done) => {
      const params = { 
        ontologyType: 'UBERON',
        includeObsolete: false,
        maxResults: 10
      };

      service.searchOntology('test', params).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(req => 
        req.params.get('ontology_type') === 'UBERON' &&
        req.params.get('include_obsolete') === 'false' &&
        req.params.get('max_results') === '10'
      );
      req.flush({ count: 0, results: [] });
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complex search with multiple filters', (done) => {
      const query = 'brain tissue';
      const params = {
        ontology: 'UBERON',
        exact: false,
        limit: 20,
        includeDefinitions: true
      };

      const mockResponse = {
        count: 15,
        results: [
          { 
            id: 1, 
            term: 'brain', 
            ontologyId: 'UBERON:0000955',
            definition: 'The part of the central nervous system...',
            synonyms: ['encephalon', 'cerebrum']
          }
        ]
      };

      service.searchOntology(query, params).subscribe(response => {
        expect(response.results[0].synonyms).toEqual(['encephalon', 'cerebrum']);
        expect(response.results[0].definition).toContain('central nervous system');
        done();
      });

      const req = httpMock.expectOne(req => 
        req.params.get('q') === 'brain tissue' &&
        req.params.get('ontology') === 'UBERON' &&
        req.params.get('exact') === 'false' &&
        req.params.get('limit') === '20' &&
        req.params.get('include_definitions') === 'true'
      );
      req.flush(mockResponse);
    });

    it('should handle cascading search dependencies', (done) => {
      // First search for species
      service.searchSpecies('human').subscribe(speciesResponse => {
        expect(speciesResponse.results.length).toBeGreaterThan(0);
        
        // Then search for diseases in that species context
        service.searchDiseases('diabetes', { species: speciesResponse.results[0].ontologyId }).subscribe(diseaseResponse => {
          expect(diseaseResponse.count).toBeGreaterThan(0);
          done();
        });

        const diseaseReq = httpMock.expectOne(req => 
          req.url.includes('/diseases/') &&
          req.params.get('species') === 'NCBITaxon:9606'
        );
        diseaseReq.flush({
          count: 2,
          results: [
            { id: 1, term: 'diabetes mellitus', ontologyId: 'DOID:9351' }
          ]
        });
      });

      const speciesReq = httpMock.expectOne(req => req.url.includes('/species/'));
      speciesReq.flush({
        count: 1,
        results: [
          { id: 1, term: 'Homo sapiens', ontologyId: 'NCBITaxon:9606' }
        ]
      });
    });
  });
});