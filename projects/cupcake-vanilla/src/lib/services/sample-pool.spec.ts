import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SamplePoolService } from './sample-pool';
import { CUPCAKE_CORE_CONFIG } from '@noatgnu/cupcake-core';

describe('SamplePoolService', () => {
  let service: SamplePoolService;
  let httpMock: HttpTestingController;
  const mockConfig = {
    apiUrl: 'https://api.test.com',
    siteName: 'Test Site'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        SamplePoolService,
        { provide: CUPCAKE_CORE_CONFIG, useValue: mockConfig }
      ]
    });
    service = TestBed.inject(SamplePoolService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Basic CRUD Operations', () => {
    it('should get sample pools with parameters', (done) => {
      const params = {
        search: 'plasma',
        limit: 10,
        metadataTable: 1,
        isReference: true
      };
      const mockResponse = {
        count: 1,
        results: [{
          id: 1,
          name: 'Plasma Pool 1',
          description: 'Human plasma samples',
          isReference: true
        }]
      };

      service.getSamplePools(params).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(req =>
        req.url === `${mockConfig.apiUrl}/sample-pools/` &&
        req.params.get('search') === 'plasma' &&
        req.params.get('limit') === '10' &&
        req.params.get('metadata_table') === '1' &&
        req.params.get('is_reference') === 'true'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should get sample pools without parameters', (done) => {
      const mockResponse = {
        count: 2,
        results: [
          { id: 1, name: 'Pool 1', description: 'First pool' },
          { id: 2, name: 'Pool 2', description: 'Second pool' }
        ]
      };

      service.getSamplePools().subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/sample-pools/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should get single sample pool', (done) => {
      const poolId = 1;
      const mockResponse = {
        id: 1,
        name: 'Test Pool',
        description: 'Test description',
        metadataTable: { id: 1, name: 'Associated Table' },
        sampleCount: 25
      };

      service.getSamplePool(poolId).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/sample-pools/1/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should create sample pool', (done) => {
      const poolData = {
        name: 'New Pool',
        description: 'New pool description',
        metadataTable: 1,
        isReference: false
      };
      const mockResponse = {
        id: 1,
        name: 'New Pool',
        description: 'New pool description',
        metadataTable: { id: 1, name: 'Table' },
        isReference: false
      };

      service.createSamplePool(poolData).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/sample-pools/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        name: 'New Pool',
        description: 'New pool description',
        metadata_table: 1,
        is_reference: false
      });
      req.flush(mockResponse);
    });

    it('should update sample pool with PUT', (done) => {
      const poolId = 1;
      const updateData = {
        name: 'Updated Pool',
        description: 'Updated description',
        isReference: true
      };
      const mockResponse = {
        id: 1,
        name: 'Updated Pool',
        description: 'Updated description',
        isReference: true
      };

      service.updateSamplePool(poolId, updateData).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/sample-pools/1/`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({
        name: 'Updated Pool',
        description: 'Updated description',
        is_reference: true
      });
      req.flush(mockResponse);
    });

    it('should partially update sample pool with PATCH', (done) => {
      const poolId = 1;
      const patchData = { name: 'Patched Pool' };
      const mockResponse = {
        id: 1,
        name: 'Patched Pool',
        description: 'Original description'
      };

      service.patchSamplePool(poolId, patchData).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/sample-pools/1/`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ name: 'Patched Pool' });
      req.flush(mockResponse);
    });

    it('should delete sample pool', (done) => {
      const poolId = 1;

      service.deleteSamplePool(poolId).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/sample-pools/1/`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('Related Data Operations', () => {
    it('should get metadata columns for sample pool', (done) => {
      const poolId = 1;
      const mockResponse = [
        { id: 1, name: 'Sample ID', type: 'text', required: true },
        { id: 2, name: 'Age', type: 'number', required: false },
        { id: 3, name: 'Gender', type: 'choice', required: true }
      ];

      service.getMetadataColumns(poolId).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/sample-pools/1/metadata_columns/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('Query Parameters Handling', () => {
    it('should handle all query parameters correctly', (done) => {
      const params = {
        search: 'biobank',
        metadataTable: 5,
        isReference: false,
        limit: 50,
        offset: 100,
        ordering: '-created_at'
      };

      service.getSamplePools(params).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(req => {
        const urlParams = req.params;
        return urlParams.get('search') === 'biobank' &&
               urlParams.get('metadata_table') === '5' &&
               urlParams.get('is_reference') === 'false' &&
               urlParams.get('limit') === '50' &&
               urlParams.get('offset') === '100' &&
               urlParams.get('ordering') === '-created_at';
      });
      expect(req.request.method).toBe('GET');
      req.flush({ count: 0, results: [] });
    });

    it('should handle boolean parameters correctly', (done) => {
      const params = { isReference: true };

      service.getSamplePools(params).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(req =>
        req.params.get('is_reference') === 'true'
      );
      req.flush({ count: 0, results: [] });
    });

    it('should handle empty parameters object', (done) => {
      service.getSamplePools({}).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/sample-pools/`);
      expect(req.request.params.keys().length).toBe(0);
      req.flush({ count: 0, results: [] });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 error when pool not found', (done) => {
      service.getSamplePool(999).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(404);
          expect(error.error.detail).toBe('Not found');
          done();
        }
      );

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/sample-pools/999/`);
      req.flush({ detail: 'Not found' }, { status: 404, statusText: 'Not Found' });
    });

    it('should handle validation errors on create', (done) => {
      const invalidData = { name: '', description: 'Invalid pool' };

      service.createSamplePool(invalidData).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(400);
          expect(error.error.name).toContain('This field may not be blank');
          done();
        }
      );

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/sample-pools/`);
      req.flush(
        { name: ['This field may not be blank.'] },
        { status: 400, statusText: 'Bad Request' }
      );
    });

    it('should handle permission errors', (done) => {
      service.deleteSamplePool(1).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(403);
          expect(error.error.detail).toBe('Permission denied');
          done();
        }
      );

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/sample-pools/1/`);
      req.flush({ detail: 'Permission denied' }, { status: 403, statusText: 'Forbidden' });
    });

    it('should handle server errors', (done) => {
      service.getSamplePools().subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(500);
          done();
        }
      );

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/sample-pools/`);
      req.flush({ error: 'Internal server error' }, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle network errors', (done) => {
      service.getSamplePools().subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.name).toBe('HttpErrorResponse');
          done();
        }
      );

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/sample-pools/`);
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('Data Transformation', () => {
    it('should transform camelCase to snake_case in requests', (done) => {
      const poolData = {
        metadataTable: 1,
        isReference: true,
        createdBy: 5
      };

      service.createSamplePool(poolData).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/sample-pools/`);
      expect(req.request.body).toEqual({
        metadata_table: 1,
        is_reference: true,
        created_by: 5
      });
      req.flush({ id: 1 });
    });

    it('should transform snake_case to camelCase in responses', (done) => {
      const mockResponse = {
        id: 1,
        metadata_table: { id: 1, name: 'Table' },
        is_reference: true,
        created_at: '2023-01-01T00:00:00Z',
        sampleCount: 100
      };

      const expectedResponse = {
        id: 1,
        metadataTable: { id: 1, name: 'Table' },
        isReference: true,
        createdAt: '2023-01-01T00:00:00Z',
        sampleCount: 100
      };

      service.getSamplePool(1).subscribe(response => {
        expect(response).toEqual(expectedResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/sample-pools/1/`);
      req.flush(mockResponse);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle creating pool with metadata table relationship', (done) => {
      const poolData = {
        name: 'Clinical Samples',
        metadataTable: 1,
        description: 'Patient clinical samples'
      };

      const mockResponse = {
        id: 1,
        name: 'Clinical Samples',
        metadataTable: {
          id: 1,
          name: 'Clinical Metadata',
          columnCount: 15
        },
        description: 'Patient clinical samples'
      };

      service.createSamplePool(poolData).subscribe(response => {
        expect(response.metadataTable.columnCount).toBe(15);
        expect(response.name).toBe('Clinical Samples');
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/sample-pools/`);
      req.flush({
        id: 1,
        name: 'Clinical Samples',
        metadata_table: {
          id: 1,
          name: 'Clinical Metadata',
          column_count: 15
        },
        description: 'Patient clinical samples'
      });
    });

    it('should handle searching across multiple fields', (done) => {
      const mockResponse = {
        count: 2,
        results: [
          { id: 1, name: 'Plasma samples', description: 'Human plasma' },
          { id: 2, name: 'Serum collection', description: 'Mouse plasma derived' }
        ]
      };

      service.getSamplePools({ search: 'plasma' }).subscribe(response => {
        expect(response.count).toBe(2);
        expect(response.results.length).toBe(2);
        done();
      });

      const req = httpMock.expectOne(req =>
        req.params.get('search') === 'plasma'
      );
      req.flush(mockResponse);
    });
  });
});
