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

      service.getSamplePools(params).subscribe(response => {
        expect(response.count).toBe(1);
        expect(response.results.length).toBe(1);
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
      req.flush({
        count: 1,
        results: [{
          id: 1,
          pool_name: 'Plasma Pool 1',
          pool_description: 'Human plasma samples',
          is_reference: true,
          metadata_table: 1,
          pooled_only_samples: [],
          pooled_and_independent_samples: [],
          metadata_columns: [],
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        }]
      });
    });

    it('should get sample pools without parameters', (done) => {
      service.getSamplePools().subscribe(response => {
        expect(response.count).toBe(2);
        expect(response.results.length).toBe(2);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/sample-pools/`);
      expect(req.request.method).toBe('GET');
      req.flush({
        count: 2,
        results: [
          {
            id: 1,
            pool_name: 'Pool 1',
            pool_description: 'First pool',
            metadata_table: 1,
            pooled_only_samples: [],
            pooled_and_independent_samples: [],
            metadata_columns: [],
            is_reference: false,
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z'
          },
          {
            id: 2,
            pool_name: 'Pool 2',
            pool_description: 'Second pool',
            metadata_table: 1,
            pooled_only_samples: [],
            pooled_and_independent_samples: [],
            metadata_columns: [],
            is_reference: false,
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z'
          }
        ]
      });
    });

    it('should get single sample pool', (done) => {
      const poolId = 1;

      service.getSamplePool(poolId).subscribe(response => {
        expect(response.id).toBe(1);
        expect(response.poolName).toBe('Test Pool');
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/sample-pools/1/`);
      expect(req.request.method).toBe('GET');
      req.flush({
        id: 1,
        pool_name: 'Test Pool',
        pool_description: 'Test description',
        metadata_table: 1,
        pooled_only_samples: [],
        pooled_and_independent_samples: [],
        metadata_columns: [],
        is_reference: false,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      });
    });

    it('should create sample pool', (done) => {
      const poolData = {
        poolName: 'New Pool',
        poolDescription: 'New pool description',
        metadataTable: 1,
        isReference: false
      };

      service.createSamplePool(poolData).subscribe(response => {
        expect(response.id).toBe(1);
        expect(response.poolName).toBe('New Pool');
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/sample-pools/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        pool_name: 'New Pool',
        pool_description: 'New pool description',
        metadata_table: 1,
        is_reference: false
      });
      req.flush({
        id: 1,
        pool_name: 'New Pool',
        pool_description: 'New pool description',
        metadata_table: 1,
        is_reference: false,
        pooled_only_samples: [],
        pooled_and_independent_samples: [],
        metadata_columns: [],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      });
    });

    it('should update sample pool with PUT', (done) => {
      const poolId = 1;
      const updateData = {
        poolName: 'Updated Pool',
        poolDescription: 'Updated description',
        isReference: true
      };

      service.updateSamplePool(poolId, updateData).subscribe(response => {
        expect(response.poolName).toBe('Updated Pool');
        expect(response.isReference).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/sample-pools/1/`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({
        pool_name: 'Updated Pool',
        pool_description: 'Updated description',
        is_reference: true
      });
      req.flush({
        id: 1,
        pool_name: 'Updated Pool',
        pool_description: 'Updated description',
        metadata_table: 1,
        is_reference: true,
        pooled_only_samples: [],
        pooled_and_independent_samples: [],
        metadata_columns: [],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      });
    });

    it('should partially update sample pool with PATCH', (done) => {
      const poolId = 1;
      const patchData = { poolName: 'Patched Pool' };

      service.patchSamplePool(poolId, patchData).subscribe(response => {
        expect(response.poolName).toBe('Patched Pool');
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/sample-pools/1/`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ pool_name: 'Patched Pool' });
      req.flush({
        id: 1,
        pool_name: 'Patched Pool',
        pool_description: 'Original description',
        metadata_table: 1,
        is_reference: false,
        pooled_only_samples: [],
        pooled_and_independent_samples: [],
        metadata_columns: [],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      });
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

      service.getMetadataColumns(poolId).subscribe(response => {
        expect(response.length).toBe(3);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/sample-pools/1/metadata_columns/`);
      expect(req.request.method).toBe('GET');
      req.flush([
        {
          id: 1,
          metadata_table: 1,
          column_name: 'Sample ID',
          column_type: 'text',
          column_position: 0,
          not_applicable: false,
          not_available: false,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        },
        {
          id: 2,
          metadata_table: 1,
          column_name: 'Age',
          column_type: 'number',
          column_position: 1,
          not_applicable: false,
          not_available: false,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        },
        {
          id: 3,
          metadata_table: 1,
          column_name: 'Gender',
          column_type: 'choice',
          column_position: 2,
          not_applicable: false,
          not_available: false,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        }
      ]);
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
      service.getSamplePool(999).subscribe({
        next: () => fail('should have failed'),
        error: error => {
          expect(error.status).toBe(404);
          expect(error.error.detail).toBe('Not found');
          done();
        }
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/sample-pools/999/`);
      req.flush({ detail: 'Not found' }, { status: 404, statusText: 'Not Found' });
    });

    it('should handle validation errors on create', (done) => {
      const invalidData = {
        poolName: '',
        metadataTable: 1,
        poolDescription: 'Invalid pool'
      };

      service.createSamplePool(invalidData).subscribe({
        next: () => fail('should have failed'),
        error: error => {
          expect(error.status).toBe(400);
          expect(error.error.pool_name).toContain('This field may not be blank');
          done();
        }
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/sample-pools/`);
      req.flush(
        { pool_name: ['This field may not be blank.'] },
        { status: 400, statusText: 'Bad Request' }
      );
    });

    it('should handle permission errors', (done) => {
      service.deleteSamplePool(1).subscribe({
        next: () => fail('should have failed'),
        error: error => {
          expect(error.status).toBe(403);
          expect(error.error.detail).toBe('Permission denied');
          done();
        }
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/sample-pools/1/`);
      req.flush({ detail: 'Permission denied' }, { status: 403, statusText: 'Forbidden' });
    });

    it('should handle server errors', (done) => {
      service.getSamplePools().subscribe({
        next: () => fail('should have failed'),
        error: error => {
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/sample-pools/`);
      req.flush({ error: 'Internal server error' }, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle network errors', (done) => {
      service.getSamplePools().subscribe({
        next: () => fail('should have failed'),
        error: error => {
          expect(error.name).toBe('HttpErrorResponse');
          done();
        }
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/sample-pools/`);
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('Data Transformation', () => {
    it('should transform camelCase to snake_case in requests', (done) => {
      const poolData = {
        poolName: 'Test Pool',
        metadataTable: 1,
        isReference: true
      };

      service.createSamplePool(poolData).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/sample-pools/`);
      expect(req.request.body).toEqual({
        pool_name: 'Test Pool',
        metadata_table: 1,
        is_reference: true
      });
      req.flush({
        id: 1,
        pool_name: 'Test Pool',
        metadata_table: 1,
        is_reference: true,
        pooled_only_samples: [],
        pooled_and_independent_samples: [],
        metadata_columns: [],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      });
    });

    it('should transform snake_case to camelCase in responses', (done) => {
      service.getSamplePool(1).subscribe(response => {
        expect(response.id).toBe(1);
        expect(response.poolName).toBe('Test Pool');
        expect(response.poolDescription).toBe('Test description');
        expect(response.metadataTable).toBe(1);
        expect(response.isReference).toBe(true);
        expect(response.pooledOnlySamples).toEqual([]);
        expect(response.pooledAndIndependentSamples).toEqual([]);
        expect(response.metadataColumns).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/sample-pools/1/`);
      req.flush({
        id: 1,
        pool_name: 'Test Pool',
        pool_description: 'Test description',
        metadata_table: 1,
        is_reference: true,
        pooled_only_samples: [],
        pooled_and_independent_samples: [],
        metadata_columns: [],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle creating pool with metadata table relationship', (done) => {
      const poolData = {
        poolName: 'Clinical Samples',
        metadataTable: 1,
        poolDescription: 'Patient clinical samples'
      };

      service.createSamplePool(poolData).subscribe(response => {
        expect(response.poolName).toBe('Clinical Samples');
        expect(response.metadataTable).toBe(1);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/sample-pools/`);
      req.flush({
        id: 1,
        pool_name: 'Clinical Samples',
        metadata_table: 1,
        pool_description: 'Patient clinical samples',
        pooled_only_samples: [],
        pooled_and_independent_samples: [],
        metadata_columns: [],
        is_reference: false,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      });
    });

    it('should handle searching across multiple fields', (done) => {
      service.getSamplePools({ search: 'plasma' }).subscribe(response => {
        expect(response.count).toBe(2);
        expect(response.results.length).toBe(2);
        done();
      });

      const req = httpMock.expectOne(req =>
        req.params.get('search') === 'plasma'
      );
      req.flush({
        count: 2,
        results: [
          {
            id: 1,
            pool_name: 'Plasma samples',
            pool_description: 'Human plasma',
            metadata_table: 1,
            pooled_only_samples: [],
            pooled_and_independent_samples: [],
            metadata_columns: [],
            is_reference: false,
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z'
          },
          {
            id: 2,
            pool_name: 'Serum collection',
            pool_description: 'Mouse plasma derived',
            metadata_table: 1,
            pooled_only_samples: [],
            pooled_and_independent_samples: [],
            metadata_columns: [],
            is_reference: false,
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z'
          }
        ]
      });
    });
  });
});
