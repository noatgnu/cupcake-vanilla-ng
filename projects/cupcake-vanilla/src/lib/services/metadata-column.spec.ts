import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MetadataColumnService } from './metadata-column';
import { CUPCAKE_CORE_CONFIG } from '@noatgnu/cupcake-core';

describe('MetadataColumnService', () => {
  let service: MetadataColumnService;
  let httpMock: HttpTestingController;
  const mockConfig = {
    apiUrl: 'https://api.test.com',
    siteName: 'Test Site'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        MetadataColumnService,
        { provide: CUPCAKE_CORE_CONFIG, useValue: mockConfig }
      ]
    });
    service = TestBed.inject(MetadataColumnService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getMetadataColumns', () => {
    it('should get metadata columns with parameters', (done) => {
      const params = {
        metadataTableId: 1,
        type: 'text',
        search: 'sample',
        limit: 10
      };

      service.getMetadataColumns(params).subscribe(response => {
        expect(response.count).toBe(2);
        expect(response.results.length).toBe(2);
        done();
      });

      const req = httpMock.expectOne(req =>
        req.url === `${mockConfig.apiUrl}/metadata-columns/` &&
        req.params.get('metadata_table_id') === '1' &&
        req.params.get('type') === 'text' &&
        req.params.get('search') === 'sample' &&
        req.params.get('limit') === '10'
      );
      expect(req.request.method).toBe('GET');
      req.flush({
        count: 2,
        results: [
          { id: 1, column_name: 'Sample ID', column_type: 'text' },
          { id: 2, column_name: 'Sample Name', column_type: 'text' }
        ]
      });
    });

    it('should get columns without parameters', (done) => {
      service.getMetadataColumns().subscribe(response => {
        expect(response.count).toBe(0);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-columns/`);
      expect(req.request.method).toBe('GET');
      req.flush({ count: 0, results: [] });
    });
  });

  describe('getMetadataColumn', () => {
    it('should get single metadata column', (done) => {
      const columnId = 1;

      service.getMetadataColumn(columnId).subscribe(response => {
        expect(response.id).toBe(1);
        expect(response.columnName).toBe('Sample ID');
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-columns/1/`);
      expect(req.request.method).toBe('GET');
      req.flush({
        id: 1,
        column_name: 'Sample ID',
        column_type: 'text',
        metadata_table: 1,
        column_position: 0,
        not_applicable: false,
        not_available: false,
        auto_generated: false,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      });
    });
  });

  describe('createMetadataColumn', () => {
    it('should create metadata column', (done) => {
      const columnData = {
        columnName: 'Age',
        columnType: 'number',
        metadataTable: 1,
        columnPosition: 5
      };

      service.createMetadataColumn(columnData).subscribe(response => {
        expect(response.id).toBe(3);
        expect(response.columnName).toBe('Age');
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-columns/`);
      expect(req.request.method).toBe('POST');
      req.flush({
        id: 3,
        column_name: 'Age',
        column_type: 'number',
        metadata_table: 1,
        column_position: 5,
        not_applicable: false,
        not_available: false,
        auto_generated: false,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      });
    });
  });

  describe('updateMetadataColumn', () => {
    it('should update metadata column', (done) => {
      const columnId = 1;
      const updateData = { columnName: 'Updated Sample ID' };

      service.updateMetadataColumn(columnId, updateData).subscribe(response => {
        expect(response.columnName).toBe('Updated Sample ID');
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-columns/1/`);
      expect(req.request.method).toBe('PUT');
      req.flush({
        id: 1,
        column_name: 'Updated Sample ID',
        column_type: 'text',
        metadata_table: 1,
        column_position: 0,
        not_applicable: false,
        not_available: false,
        auto_generated: false,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      });
    });
  });

  describe('patchMetadataColumn', () => {
    it('should partially update metadata column', (done) => {
      const columnId = 1;

      service.patchMetadataColumn(columnId, { hidden: true }).subscribe(response => {
        expect(response.hidden).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-columns/1/`);
      expect(req.request.method).toBe('PATCH');
      req.flush({
        id: 1,
        column_name: 'Sample ID',
        column_type: 'text',
        metadata_table: 1,
        column_position: 0,
        hidden: true,
        not_applicable: false,
        not_available: false,
        auto_generated: false,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      });
    });
  });

  describe('deleteMetadataColumn', () => {
    it('should delete metadata column', (done) => {
      const columnId = 1;

      service.deleteMetadataColumn(columnId).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-columns/1/`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('bulkCreate', () => {
    it('should bulk create columns', (done) => {
      const columns = [
        { columnName: 'Col1', columnType: 'text', metadataTable: 1 },
        { columnName: 'Col2', columnType: 'number', metadataTable: 1 }
      ];

      service.bulkCreate({ columns }).subscribe(response => {
        expect(response.length).toBe(2);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-columns/bulk_create/`);
      expect(req.request.method).toBe('POST');
      req.flush([
        { id: 1, column_name: 'Col1', column_type: 'text' },
        { id: 2, column_name: 'Col2', column_type: 'number' }
      ]);
    });
  });

  describe('validateSdrfData', () => {
    it('should validate SDRF data', (done) => {
      const request = { metadataIds: [1, 2, 3], sampleNumber: 10 };

      service.validateSdrfData(request).subscribe(response => {
        expect(response.valid).toBe(true);
        expect(response.sampleCount).toBe(10);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-columns/validate_sdrf_data/`);
      expect(req.request.method).toBe('POST');
      req.flush({ valid: true, errors: [], sample_count: 10 });
    });
  });

  describe('getOntologySuggestions', () => {
    it('should get ontology suggestions', (done) => {
      const params = { columnId: 1, search: 'homo', limit: 10 };

      service.getOntologySuggestions(params).subscribe(response => {
        expect(response.suggestions.length).toBe(1);
        expect(response.ontologyType).toBe('species');
        done();
      });

      const req = httpMock.expectOne(req =>
        req.url === `${mockConfig.apiUrl}/metadata-columns/ontology_suggestions/` &&
        req.params.get('column_id') === '1'
      );
      expect(req.request.method).toBe('GET');
      req.flush({
        ontology_type: 'species',
        suggestions: [{ id: 1, term: 'Homo sapiens' }],
        search_term: 'homo',
        search_type: 'icontains',
        limit: 10,
        count: 1,
        custom_filters: null,
        has_more: false
      });
    });
  });

  describe('validateValue', () => {
    it('should validate column value', (done) => {
      const columnId = 1;

      service.validateValue(columnId, { value: 'test value' }).subscribe(response => {
        expect(response.valid).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-columns/1/validate_value/`);
      expect(req.request.method).toBe('POST');
      req.flush({ valid: true, value: 'test value', ontology_type: 'text' });
    });
  });

  describe('updateColumnValue', () => {
    it('should update column value', (done) => {
      const columnId = 1;
      const request = { value: 'new value', valueType: 'default' as const };

      service.updateColumnValue(columnId, request).subscribe(response => {
        expect(response.message).toBe('Value updated');
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-columns/1/update_column_value/`);
      expect(req.request.method).toBe('POST');
      req.flush({
        message: 'Value updated',
        column: { id: 1, column_name: 'Sample' },
        changes: {},
        value_type: 'default'
      });
    });
  });

  describe('bulkUpdateSampleValues', () => {
    it('should bulk update sample values', (done) => {
      const columnId = 1;
      const updates = [
        { sampleIndex: 0, value: 'Value1' },
        { sampleIndex: 1, value: 'Value2' }
      ];

      service.bulkUpdateSampleValues(columnId, updates).subscribe(response => {
        expect(response.updatedCount).toBe(2);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-columns/1/bulk_update_sample_values/`);
      expect(req.request.method).toBe('POST');
      req.flush({
        message: 'Updated',
        updated_count: 2,
        failed_count: 0,
        column: { id: 1 }
      });
    });
  });

  describe('replaceValue', () => {
    it('should replace value in column', (done) => {
      const columnId = 1;
      const request = { oldValue: 'old', newValue: 'new' };

      service.replaceValue(columnId, request).subscribe(response => {
        expect(response.message).toBe('Value replaced');
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-columns/1/replace_value/`);
      expect(req.request.method).toBe('POST');
      req.flush({
        message: 'Value replaced',
        old_value: 'old',
        new_value: 'new',
        default_value_updated: true,
        modifiers_merged: 0,
        modifiers_deleted: 0,
        samples_reverted_to_default: 0,
        pool_columns_updated: 0
      });
    });
  });

  describe('getHistory', () => {
    it('should get column history', (done) => {
      const columnId = 1;

      service.getHistory(columnId).subscribe(response => {
        expect(response.count).toBe(2);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-columns/1/history/`);
      expect(req.request.method).toBe('GET');
      req.flush({
        count: 2,
        results: [
          { id: 1, action: 'create', timestamp: '2023-01-01T00:00:00Z' },
          { id: 2, action: 'update', timestamp: '2023-01-02T00:00:00Z' }
        ]
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 error', (done) => {
      service.getMetadataColumn(999).subscribe({
        next: () => fail('should have failed'),
        error: error => {
          expect(error.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-columns/999/`);
      req.flush({ detail: 'Not found' }, { status: 404, statusText: 'Not Found' });
    });

    it('should handle validation errors', (done) => {
      service.createMetadataColumn({ columnName: '', columnType: 'text', metadataTable: 1 }).subscribe({
        next: () => fail('should have failed'),
        error: error => {
          expect(error.status).toBe(400);
          done();
        }
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-columns/`);
      req.flush({ column_name: ['This field may not be blank.'] }, { status: 400, statusText: 'Bad Request' });
    });
  });
});
