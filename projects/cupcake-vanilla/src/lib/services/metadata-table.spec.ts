import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MetadataTableService } from './metadata-table';
import { CUPCAKE_CORE_CONFIG } from '@cupcake/core';

describe('MetadataTableService', () => {
  let service: MetadataTableService;
  let httpMock: HttpTestingController;
  const mockConfig = {
    apiUrl: 'https://api.test.com',
    siteName: 'Test Site'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        MetadataTableService,
        { provide: CUPCAKE_CORE_CONFIG, useValue: mockConfig }
      ]
    });
    service = TestBed.inject(MetadataTableService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Basic CRUD Operations', () => {
    it('should get metadata tables with parameters', (done) => {
      const params = { search: 'test', limit: 10, ownerId: 1 };
      const mockResponse = {
        count: 1,
        results: [{ id: 1, name: 'Test Table', description: 'Test description' }]
      };

      service.getMetadataTables(params).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(req => 
        req.url === `${mockConfig.apiUrl}/metadata-tables/` && 
        req.params.get('search') === 'test' &&
        req.params.get('limit') === '10' &&
        req.params.get('owner_id') === '1'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should get single metadata table', (done) => {
      const tableId = 1;
      const mockResponse = { 
        id: 1, 
        name: 'Test Table', 
        columns: [],
        createdAt: '2023-01-01T00:00:00Z'
      };

      service.getMetadataTable(tableId).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-tables/1/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should create metadata table', (done) => {
      const tableData = { 
        name: 'New Table', 
        description: 'New description',
        visibility: 'private'
      };
      const mockResponse = { 
        id: 1, 
        name: 'New Table', 
        description: 'New description',
        visibility: 'private'
      };

      service.createMetadataTable(tableData).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-tables/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ 
        name: 'New Table', 
        description: 'New description',
        visibility: 'private'
      });
      req.flush(mockResponse);
    });

    it('should update metadata table with PUT', (done) => {
      const tableId = 1;
      const updateData = { name: 'Updated Table', description: 'Updated description' };
      const mockResponse = { id: 1, name: 'Updated Table', description: 'Updated description' };

      service.updateMetadataTable(tableId, updateData).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-tables/1/`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ name: 'Updated Table', description: 'Updated description' });
      req.flush(mockResponse);
    });

    it('should partially update metadata table with PATCH', (done) => {
      const tableId = 1;
      const patchData = { name: 'Patched Table' };
      const mockResponse = { id: 1, name: 'Patched Table', description: 'Original description' };

      service.patchMetadataTable(tableId, patchData).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-tables/1/`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ name: 'Patched Table' });
      req.flush(mockResponse);
    });

    it('should delete metadata table', (done) => {
      const tableId = 1;

      service.deleteMetadataTable(tableId).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-tables/1/`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('Column Operations', () => {
    it('should add column to table', (done) => {
      const tableId = 1;
      const columnData = { name: 'New Column', type: 'text' };
      const position = 2;
      const mockResponse = { 
        message: 'Column added successfully',
        column: { id: 1, name: 'New Column', type: 'text' }
      };

      service.addColumn(tableId, columnData, position).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-tables/1/add_column/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        column_data: { name: 'New Column', type: 'text' },
        position: 2
      });
      req.flush(mockResponse);
    });

    it('should add column with auto reorder', (done) => {
      const tableId = 1;
      const request = { columnData: { name: 'Auto Column', type: 'number' } };
      const mockResponse = { 
        message: 'Column added with reordering',
        column: { id: 1, name: 'Auto Column', type: 'number' },
        reordered: true,
        schemaIdsUsed: [1, 2, 3]
      };

      service.addColumnWithAutoReorder(tableId, request).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-tables/1/add_column_with_auto_reorder/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ column_data: { name: 'Auto Column', type: 'number' } });
      req.flush(mockResponse);
    });

    it('should remove column from table', (done) => {
      const tableId = 1;
      const columnId = 2;
      const mockResponse = { message: 'Column removed successfully' };

      service.removeColumn(tableId, columnId).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-tables/1/remove_column/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ column_id: 2 });
      req.flush(mockResponse);
    });

    it('should reorder column in table', (done) => {
      const tableId = 1;
      const columnId = 2;
      const newPosition = 4;
      const mockResponse = { message: 'Column reordered successfully' };

      service.reorderColumn(tableId, columnId, newPosition).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-tables/1/reorder_column/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ column_id: 2, new_position: 4 });
      req.flush(mockResponse);
    });

    it('should normalize column positions', (done) => {
      const tableId = 1;
      const mockResponse = { message: 'Positions normalized successfully' };

      service.normalizeColumnPositions(tableId).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-tables/1/normalize_column_positions/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });
  });

  describe('Administrative Operations', () => {
    it('should get all tables as admin', (done) => {
      const mockResponse = [
        { id: 1, name: 'Table 1', owner: { username: 'user1' } },
        { id: 2, name: 'Table 2', owner: { username: 'user2' } }
      ];

      service.getAdminAllTables().subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-tables/admin_all_tables/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('Search and Filter Operations', () => {
    it('should search metadata tables', (done) => {
      const query = 'proteomics';
      const mockResponse = {
        count: 2,
        results: [
          { id: 1, name: 'Proteomics Table 1' },
          { id: 2, name: 'Proteomics Analysis' }
        ]
      };

      service.searchMetadataTables(query).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(req => 
        req.url === `${mockConfig.apiUrl}/metadata-tables/` && 
        req.params.get('search') === 'proteomics'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should get tables by owner', (done) => {
      const ownerId = 5;
      const mockResponse = {
        count: 1,
        results: [{ id: 1, name: 'Owner Table', ownerId: 5 }]
      };

      service.getMetadataTablesByOwner(ownerId).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(req => 
        req.url === `${mockConfig.apiUrl}/metadata-tables/` && 
        req.params.get('owner_id') === '5'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should get shared metadata tables', (done) => {
      const mockResponse = {
        count: 3,
        results: [
          { id: 1, name: 'Shared Table 1', isShared: true },
          { id: 2, name: 'Shared Table 2', isShared: true }
        ]
      };

      service.getSharedMetadataTables().subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(req => 
        req.url === `${mockConfig.apiUrl}/metadata-tables/` && 
        req.params.get('show_shared') === 'true'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('Column Combine Operations', () => {
    it('should combine columns column-wise', (done) => {
      const request = { columnIds: [1, 2, 3] };
      const mockResponse = { 
        message: 'Columns combined successfully',
        combinedColumn: { id: 10, name: 'Combined Column', type: 'composite' }
      };

      service.combineColumnwise(request).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-tables/combine_columnwise/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ column_ids: [1, 2, 3] });
      req.flush(mockResponse);
    });

    it('should combine columns row-wise', (done) => {
      const request = { columnIds: [4, 5, 6] };
      const mockResponse = { 
        message: 'Columns combined row-wise successfully',
        combinedColumn: { id: 11, name: 'Row Combined Column', type: 'composite' }
      };

      service.combineRowwise(request).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-tables/combine_rowwise/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ column_ids: [4, 5, 6] });
      req.flush(mockResponse);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 error when table not found', (done) => {
      service.getMetadataTable(999).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(404);
          expect(error.error.detail).toBe('Not found');
          done();
        }
      );

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-tables/999/`);
      req.flush({ detail: 'Not found' }, { status: 404, statusText: 'Not Found' });
    });

    it('should handle validation errors on create', (done) => {
      const invalidData = { name: '', description: 'Invalid table' };

      service.createMetadataTable(invalidData).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(400);
          expect(error.error.name).toContain('This field may not be blank');
          done();
        }
      );

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-tables/`);
      req.flush(
        { name: ['This field may not be blank.'] }, 
        { status: 400, statusText: 'Bad Request' }
      );
    });

    it('should handle server errors', (done) => {
      service.getMetadataTables().subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(500);
          done();
        }
      );

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-tables/`);
      req.flush({ error: 'Internal server error' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('Parameter Validation', () => {
    it('should handle empty parameters', (done) => {
      const mockResponse = { count: 0, results: [] };

      service.getMetadataTables({}).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/metadata-tables/`);
      expect(req.request.params.keys().length).toBe(0);
      req.flush(mockResponse);
    });

    it('should handle all query parameters', (done) => {
      const params = {
        search: 'test',
        ownerId: 1,
        labGroupId: 2,
        isPublished: true,
        isLocked: false,
        showShared: true,
        limit: 25,
        offset: 50,
        ordering: '-created_at'
      };

      service.getMetadataTables(params).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(req => {
        const params = req.params;
        return params.get('search') === 'test' &&
               params.get('owner_id') === '1' &&
               params.get('lab_group_id') === '2' &&
               params.get('is_published') === 'true' &&
               params.get('is_locked') === 'false' &&
               params.get('show_shared') === 'true' &&
               params.get('limit') === '25' &&
               params.get('offset') === '50' &&
               params.get('ordering') === '-created_at';
      });
      req.flush({ count: 0, results: [] });
    });
  });
});