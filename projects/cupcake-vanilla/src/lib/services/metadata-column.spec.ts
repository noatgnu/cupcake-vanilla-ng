import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MetadataColumnService } from './metadata-column';
import { CUPCAKE_CORE_CONFIG } from '@cupcake/core';

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

  describe('Basic CRUD Operations', () => {
    it('should get metadata columns with parameters', (done) => {
      const params = { 
        metadataTable: 1,
        columnType: 'text',
        search: 'sample',
        limit: 10
      };
      const mockResponse = {
        count: 2,
        results: [
          { id: 1, name: 'Sample ID', type: 'text', required: true },
          { id: 2, name: 'Sample Name', type: 'text', required: false }
        ]
      };

      service.getMetadataColumns(params).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(req => 
        req.url === `${mockConfig.apiUrl}/metadata-columns/` && 
        req.params.get('metadata_table') === '1' &&
        req.params.get('column_type') === 'text' &&
        req.params.get('search') === 'sample' &&
        req.params.get('limit') === '10'
      );
      expect(req.request.method).toBe('GET');
      req.flush({
        count: 2,
        results: [
          { id: 1, name: 'Sample ID', type: 'text', required: true },
          { id: 2, name: 'Sample Name', type: 'text', required: false }
        ]
      });
    });

    it('should get single metadata column', (done) => {
      const columnId = 1;
      const mockResponse = {
        id: 1,
        name: 'Sample ID',
        type: 'text',
        required: true,
        defaultValue: '',
        validation: { pattern: '^[A-Z0-9]+$' },
        position: 0
      };

      service.getMetadataColumn(columnId).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-columns/1/`);
      expect(req.request.method).toBe('GET');
      req.flush({
        id: 1,
        name: 'Sample ID',
        type: 'text',
        required: true,
        default_value: '',
        validation: { pattern: '^[A-Z0-9]+$' },
        position: 0
      });
    });

    it('should create metadata column', (done) => {
      const columnData = {
        name: 'Age',
        type: 'number',
        required: false,
        metadataTable: 1,
        position: 5
      };
      const mockResponse = {
        id: 3,
        name: 'Age',
        type: 'number',
        required: false,
        metadataTable: { id: 1, name: 'Patient Data' },
        position: 5
      };

      service.createMetadataColumn(columnData).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-columns/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        name: 'Age',
        type: 'number',
        required: false,
        metadata_table: 1,
        position: 5
      });
      req.flush({
        id: 3,
        name: 'Age',
        type: 'number',
        required: false,
        metadata_table: { id: 1, name: 'Patient Data' },
        position: 5
      });
    });

    it('should update metadata column', (done) => {
      const columnId = 1;
      const updateData = { name: 'Updated Sample ID', required: true };
      const mockResponse = {
        id: 1,
        name: 'Updated Sample ID',
        type: 'text',
        required: true
      };

      service.updateMetadataColumn(columnId, updateData).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-columns/1/`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ name: 'Updated Sample ID', required: true });
      req.flush(mockResponse);
    });

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

  describe('Column Values Management', () => {
    it('should get column values', (done) => {
      const columnId = 1;
      const params = { search: 'patient', limit: 20 };
      const mockResponse = {
        count: 3,
        results: [
          { id: 1, value: 'Patient001', row: 1 },
          { id: 2, value: 'Patient002', row: 2 },
          { id: 3, value: 'Patient003', row: 3 }
        ]
      };

      service.getColumnValues(columnId, params).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(req => 
        req.url === `${mockConfig.apiUrl}/metadata-columns/1/values/` &&
        req.params.get('search') === 'patient' &&
        req.params.get('limit') === '20'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should update column value', (done) => {
      const columnId = 1;
      const valueId = 5;
      const newValue = 'UpdatedValue';
      const mockResponse = {
        id: 5,
        value: 'UpdatedValue',
        column: 1,
        row: 10
      };

      service.updateColumnValue(columnId, valueId, newValue).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-columns/1/values/5/`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ value: 'UpdatedValue' });
      req.flush(mockResponse);
    });

    it('should bulk update column values', (done) => {
      const columnId = 1;
      const updates = [
        { valueId: 1, value: 'NewValue1' },
        { valueId: 2, value: 'NewValue2' }
      ];
      const mockResponse = {
        updated: 2,
        errors: [],
        results: [
          { id: 1, value: 'NewValue1' },
          { id: 2, value: 'NewValue2' }
        ]
      };

      service.bulkUpdateColumnValues(columnId, updates).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-columns/1/values/bulk-update/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        updates: [
          { value_id: 1, value: 'NewValue1' },
          { value_id: 2, value: 'NewValue2' }
        ]
      });
      req.flush(mockResponse);
    });
  });

  describe('Column Validation', () => {
    it('should validate column data', (done) => {
      const columnId = 1;
      const validationData = {
        values: ['SAMPLE001', 'SAMPLE002', 'INVALID_SAMPLE'],
        strict: true
      };
      const mockResponse = {
        valid: false,
        errors: [
          { row: 3, message: 'Invalid format for value: INVALID_SAMPLE' }
        ],
        warnings: [],
        validCount: 2,
        totalCount: 3
      };

      service.validateColumn(columnId, validationData).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-columns/1/validate/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        values: ['SAMPLE001', 'SAMPLE002', 'INVALID_SAMPLE'],
        strict: true
      });
      req.flush({
        valid: false,
        errors: [
          { row: 3, message: 'Invalid format for value: INVALID_SAMPLE' }
        ],
        warnings: [],
        valid_count: 2,
        total_count: 3
      });
    });

    it('should get column validation rules', (done) => {
      const columnId = 1;
      const mockResponse = {
        columnId: 1,
        rules: [
          { type: 'pattern', value: '^[A-Z0-9]+$', message: 'Must be alphanumeric uppercase' },
          { type: 'length', min: 5, max: 20, message: 'Must be between 5-20 characters' }
        ],
        required: true
      };

      service.getColumnValidationRules(columnId).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-columns/1/validation-rules/`);
      expect(req.request.method).toBe('GET');
      req.flush({
        column_id: 1,
        rules: [
          { type: 'pattern', value: '^[A-Z0-9]+$', message: 'Must be alphanumeric uppercase' },
          { type: 'length', min: 5, max: 20, message: 'Must be between 5-20 characters' }
        ],
        required: true
      });
    });
  });

  describe('Column Statistics', () => {
    it('should get column statistics', (done) => {
      const columnId = 1;
      const mockResponse = {
        columnId: 1,
        totalValues: 1000,
        uniqueValues: 950,
        nullValues: 5,
        duplicateValues: 45,
        mostCommon: ['CONTROL', 'TREATMENT'],
        dataQuality: 95.5
      };

      service.getColumnStatistics(columnId).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-columns/1/statistics/`);
      expect(req.request.method).toBe('GET');
      req.flush({
        column_id: 1,
        total_values: 1000,
        unique_values: 950,
        null_values: 5,
        duplicate_values: 45,
        most_common: ['CONTROL', 'TREATMENT'],
        data_quality: 95.5
      });
    });
  });

  describe('Column Operations', () => {
    it('should duplicate column', (done) => {
      const columnId = 1;
      const options = { 
        newName: 'Copy of Sample ID',
        includeValues: true,
        targetTable: 2
      };
      const mockResponse = {
        originalColumn: { id: 1, name: 'Sample ID' },
        duplicatedColumn: { id: 10, name: 'Copy of Sample ID' },
        valuesCopied: 1000
      };

      service.duplicateColumn(columnId, options).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-columns/1/duplicate/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        new_name: 'Copy of Sample ID',
        include_values: true,
        target_table: 2
      });
      req.flush({
        original_column: { id: 1, name: 'Sample ID' },
        duplicated_column: { id: 10, name: 'Copy of Sample ID' },
        values_copied: 1000
      });
    });

    it('should merge columns', (done) => {
      const primaryColumnId = 1;
      const request = {
        secondaryColumnIds: [2, 3],
        mergeStrategy: 'concatenate',
        separator: ' | ',
        newName: 'Merged Column'
      };
      const mockResponse = {
        mergedColumn: { id: 15, name: 'Merged Column' },
        rowsProcessed: 1000,
        conflicts: []
      };

      service.mergeColumns(primaryColumnId, request).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-columns/1/merge/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        secondary_column_ids: [2, 3],
        merge_strategy: 'concatenate',
        separator: ' | ',
        new_name: 'Merged Column'
      });
      req.flush({
        merged_column: { id: 15, name: 'Merged Column' },
        rows_processed: 1000,
        conflicts: []
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle column not found error', (done) => {
      service.getMetadataColumn(999).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(404);
          expect(error.error.detail).toBe('Column not found');
          done();
        }
      );

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-columns/999/`);
      req.flush({ detail: 'Column not found' }, { status: 404, statusText: 'Not Found' });
    });

    it('should handle validation errors on create', (done) => {
      const invalidData = { name: '', type: 'invalid_type' };

      service.createMetadataColumn(invalidData).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(400);
          expect(error.error.name).toContain('This field may not be blank');
          expect(error.error.type).toContain('Invalid column type');
          done();
        }
      );

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-columns/`);
      req.flush(
        { 
          name: ['This field may not be blank.'],
          type: ['Invalid column type specified.']
        }, 
        { status: 400, statusText: 'Bad Request' }
      );
    });

    it('should handle permission errors', (done) => {
      service.deleteMetadataColumn(1).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(403);
          expect(error.error.detail).toBe('Permission denied');
          done();
        }
      );

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-columns/1/`);
      req.flush({ detail: 'Permission denied' }, { status: 403, statusText: 'Forbidden' });
    });
  });

  describe('Parameter Handling', () => {
    it('should handle complex query parameters', (done) => {
      const params = {
        metadataTable: 1,
        columnType: 'choice',
        required: true,
        hasValidation: false,
        search: 'gender',
        ordering: 'position',
        limit: 50,
        offset: 100
      };

      service.getMetadataColumns(params).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(req => {
        const urlParams = req.params;
        return urlParams.get('metadata_table') === '1' &&
               urlParams.get('column_type') === 'choice' &&
               urlParams.get('required') === 'true' &&
               urlParams.get('has_validation') === 'false' &&
               urlParams.get('search') === 'gender' &&
               urlParams.get('ordering') === 'position' &&
               urlParams.get('limit') === '50' &&
               urlParams.get('offset') === '100';
      });
      expect(req.request.method).toBe('GET');
      req.flush({ count: 0, results: [] });
    });

    it('should handle empty parameters gracefully', (done) => {
      service.getMetadataColumns({}).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-columns/`);
      expect(req.request.params.keys().length).toBe(0);
      req.flush({ count: 0, results: [] });
    });
  });

  describe('Data Transformation', () => {
    it('should transform complex nested data correctly', (done) => {
      const mockResponse = {
        id: 1,
        metadata_table: { id: 1, name: 'Patient Data' },
        validation_rules: {
          pattern: '^[A-Z]+$',
          min_length: 3,
          max_length: 10
        },
        choice_options: [
          { value: 'option1', display_name: 'Option 1' },
          { value: 'option2', display_name: 'Option 2' }
        ],
        created_at: '2023-01-01T00:00:00Z'
      };

      const expectedResponse = {
        id: 1,
        metadataTable: { id: 1, name: 'Patient Data' },
        validationRules: {
          pattern: '^[A-Z]+$',
          minLength: 3,
          maxLength: 10
        },
        choiceOptions: [
          { value: 'option1', displayName: 'Option 1' },
          { value: 'option2', displayName: 'Option 2' }
        ],
        createdAt: '2023-01-01T00:00:00Z'
      };

      service.getMetadataColumn(1).subscribe(response => {
        expect(response).toEqual(expectedResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-columns/1/`);
      req.flush(mockResponse);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete column lifecycle', (done) => {
      let columnId: number;

      // 1. Create column
      service.createMetadataColumn({
        name: 'Test Column',
        type: 'text',
        metadataTable: 1
      }).subscribe(created => {
        columnId = created.id;
        expect(created.name).toBe('Test Column');

        // 2. Update column
        service.updateMetadataColumn(columnId, { required: true }).subscribe(updated => {
          expect(updated.required).toBe(true);

          // 3. Get validation rules
          service.getColumnValidationRules(columnId).subscribe(rules => {
            expect(rules.required).toBe(true);

            // 4. Delete column
            service.deleteMetadataColumn(columnId).subscribe(() => {
              done();
            });

            const deleteReq = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-columns/${columnId}/`);
            deleteReq.flush(null);
          });

          const rulesReq = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-columns/${columnId}/validation-rules/`);
          rulesReq.flush({ column_id: columnId, required: true, rules: [] });
        });

        const updateReq = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-columns/${columnId}/`);
        updateReq.flush({ id: columnId, name: 'Test Column', required: true });
      });

      const createReq = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-columns/`);
      createReq.flush({ id: 100, name: 'Test Column', type: 'text', metadata_table: 1 });
    });
  });
});