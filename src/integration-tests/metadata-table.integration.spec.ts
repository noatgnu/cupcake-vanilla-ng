import { TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { MetadataTableService } from '@cupcake/vanilla';

describe('MetadataTableService Integration Tests', () => {
  let service: MetadataTableService;
  const config = global.integrationTestConfig;
  let createdTableId: number;

  beforeAll(async () => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule],
      providers: [
        MetadataTableService,
        { 
          provide: 'CUPCAKE_CORE_CONFIG', 
          useValue: { 
            apiUrl: config.apiUrl,
            siteName: 'Integration Test'
          }
        }
      ]
    });
    
    service = TestBed.inject(MetadataTableService);
  });

  afterEach(async () => {
    // Cleanup created table
    if (createdTableId) {
      try {
        await service.deleteMetadataTable(createdTableId).toPromise();
      } catch (error) {
        console.warn(`Failed to cleanup table ${createdTableId}:`, error);
      }
      createdTableId = null;
    }
  });

  describe('Table CRUD Operations', () => {
    it('should create a new metadata table', async () => {
      const tableData = {
        name: 'Integration Test Table',
        description: 'Created by integration tests',
        visibility: 'private'
      };

      const result = await service.createMetadataTable(tableData).toPromise();
      
      expect(result).toBeValidApiResponse();
      expect(result.id).toBeDefined();
      expect(result.name).toBe(tableData.name);
      expect(result.description).toBe(tableData.description);
      
      createdTableId = result.id;
      config.testData.createdResources.push({
        type: 'metadata-table',
        id: result.id,
        endpoint: '/metadata-tables'
      });
    });

    it('should retrieve the created table', async () => {
      // First create a table
      const tableData = {
        name: 'Test Retrieve Table',
        description: 'For testing retrieval'
      };

      const created = await service.createMetadataTable(tableData).toPromise();
      createdTableId = created.id;

      // Then retrieve it
      const retrieved = await service.getMetadataTable(created.id).toPromise();
      
      expect(retrieved).toBeValidApiResponse();
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.name).toBe(tableData.name);
      expect(retrieved.description).toBe(tableData.description);
    });

    it('should list metadata tables with pagination', async () => {
      const result = await service.getMetadataTables({ limit: 10 }).toPromise();
      
      expect(result).toHaveValidPaginationStructure();
      expect(result.count).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.results)).toBe(true);
      
      if (result.results.length > 0) {
        const table = result.results[0];
        expect(table.id).toBeDefined();
        expect(table.name).toBeDefined();
      }
    });

    it('should update metadata table', async () => {
      // Create table first
      const tableData = {
        name: 'Original Name',
        description: 'Original description'
      };

      const created = await service.createMetadataTable(tableData).toPromise();
      createdTableId = created.id;

      // Update the table
      const updateData = {
        name: 'Updated Name',
        description: 'Updated description'
      };

      const updated = await service.updateMetadataTable(created.id, updateData).toPromise();
      
      expect(updated).toBeValidApiResponse();
      expect(updated.id).toBe(created.id);
      expect(updated.name).toBe(updateData.name);
      expect(updated.description).toBe(updateData.description);
    });

    it('should partially update metadata table', async () => {
      // Create table first
      const tableData = {
        name: 'Patch Test Table',
        description: 'Original description'
      };

      const created = await service.createMetadataTable(tableData).toPromise();
      createdTableId = created.id;

      // Patch only the name
      const patched = await service.patchMetadataTable(created.id, { name: 'Patched Name' }).toPromise();
      
      expect(patched).toBeValidApiResponse();
      expect(patched.id).toBe(created.id);
      expect(patched.name).toBe('Patched Name');
      expect(patched.description).toBe(tableData.description); // Should remain unchanged
    });

    it('should delete metadata table', async () => {
      // Create table first
      const tableData = {
        name: 'Delete Test Table',
        description: 'Will be deleted'
      };

      const created = await service.createMetadataTable(tableData).toPromise();
      
      // Delete the table
      await service.deleteMetadataTable(created.id).toPromise();
      
      // Verify deletion by trying to retrieve
      try {
        await service.getMetadataTable(created.id).toPromise();
        fail('Should have thrown 404 error');
      } catch (error) {
        expect(error.status).toBe(404);
      }
      
      createdTableId = null; // Don't try to clean up in afterEach
    });
  });

  describe('Column Operations', () => {
    beforeEach(async () => {
      // Create a table for column operations
      const tableData = {
        name: 'Column Operations Test Table',
        description: 'For testing column operations'
      };

      const created = await service.createMetadataTable(tableData).toPromise();
      createdTableId = created.id;
    });

    it('should add column to table', async () => {
      const columnData = {
        name: 'Sample ID',
        type: 'text',
        required: true
      };

      const result = await service.addColumn(createdTableId, columnData, 0).toPromise();
      
      expect(result).toBeValidApiResponse();
      expect(result.message).toContain('success');
      expect(result.column).toBeDefined();
      expect(result.column.name).toBe(columnData.name);
      expect(result.column.type).toBe(columnData.type);
    });

    it('should add column with auto reorder', async () => {
      const columnData = {
        name: 'Auto Reorder Column',
        type: 'number'
      };

      const result = await service.addColumnWithAutoReorder(createdTableId, { columnData }).toPromise();
      
      expect(result).toBeValidApiResponse();
      expect(result.message).toContain('success');
      expect(result.column).toBeDefined();
      expect(result.reordered).toBeDefined();
      expect(Array.isArray(result.schemaIdsUsed)).toBe(true);
    });

    it('should remove column from table', async () => {
      // First add a column
      const columnData = { name: 'To Remove', type: 'text' };
      const addResult = await service.addColumn(createdTableId, columnData, 0).toPromise();
      const columnId = addResult.column.id;

      // Then remove it
      const removeResult = await service.removeColumn(createdTableId, columnId).toPromise();
      
      expect(removeResult).toBeValidApiResponse();
      expect(removeResult.message).toContain('success');
    });

    it('should reorder column in table', async () => {
      // Add two columns first
      await service.addColumn(createdTableId, { name: 'Column 1', type: 'text' }, 0).toPromise();
      const col2Result = await service.addColumn(createdTableId, { name: 'Column 2', type: 'text' }, 1).toPromise();
      
      // Reorder column 2 to position 0
      const reorderResult = await service.reorderColumn(createdTableId, col2Result.column.id, 0).toPromise();
      
      expect(reorderResult).toBeValidApiResponse();
      expect(reorderResult.message).toContain('success');
    });

    it('should normalize column positions', async () => {
      const result = await service.normalizeColumnPositions(createdTableId).toPromise();
      
      expect(result).toBeValidApiResponse();
      expect(result.message).toContain('success');
    });
  });

  describe('Search and Filter Operations', () => {
    it('should search tables by name', async () => {
      // Create a table with searchable name
      const tableData = {
        name: 'Unique Search Test Table 12345',
        description: 'For search testing'
      };

      const created = await service.createMetadataTable(tableData).toPromise();
      createdTableId = created.id;

      // Search for the table
      const searchResult = await service.searchMetadataTables('Unique Search').toPromise();
      
      expect(searchResult).toHaveValidPaginationStructure();
      
      const foundTable = searchResult.results.find(t => t.id === created.id);
      expect(foundTable).toBeDefined();
      expect(foundTable.name).toContain('Unique Search');
    });

    it('should get shared metadata tables', async () => {
      const result = await service.getSharedMetadataTables().toPromise();
      
      expect(result).toHaveValidPaginationStructure();
      expect(result.count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle table not found error', async () => {
      try {
        await service.getMetadataTable(999999).toPromise();
        fail('Should have thrown 404 error');
      } catch (error) {
        expect(error.status).toBe(404);
        expect(error.error).toMatchApiErrorFormat(404);
      }
    });

    it('should handle validation errors on create', async () => {
      const invalidData = {
        name: '', // Empty name should fail validation
        description: 'Invalid table'
      };

      try {
        await service.createMetadataTable(invalidData).toPromise();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.status).toBe(400);
        expect(error.error).toMatchApiErrorFormat(400);
      }
    });

    it('should handle unauthorized operations', async () => {
      // This would require setting up a different user or removing auth
      // For now, test with invalid table ID for permission context
      try {
        await service.deleteMetadataTable(999999).toPromise();
        fail('Should have thrown error');
      } catch (error) {
        expect([403, 404]).toContain(error.status);
      }
    });
  });

  describe('Complex Integration Scenarios', () => {
    it('should handle complete table creation workflow', async () => {
      // 1. Create table
      const tableData = {
        name: 'Workflow Test Table',
        description: 'Complete workflow test'
      };

      const table = await service.createMetadataTable(tableData).toPromise();
      createdTableId = table.id;
      
      expect(table).toBeValidApiResponse();

      // 2. Add multiple columns
      const columns = [
        { name: 'Sample ID', type: 'text', required: true },
        { name: 'Age', type: 'number', required: false },
        { name: 'Gender', type: 'choice', required: true }
      ];

      const addedColumns = [];
      for (let i = 0; i < columns.length; i++) {
        const result = await service.addColumn(table.id, columns[i], i).toPromise();
        addedColumns.push(result.column);
        expect(result.column.name).toBe(columns[i].name);
      }

      // 3. Reorder columns
      const reorderResult = await service.reorderColumn(table.id, addedColumns[2].id, 0).toPromise();
      expect(reorderResult.message).toContain('success');

      // 4. Update table metadata
      const updated = await service.patchMetadataTable(table.id, {
        description: 'Updated workflow description'
      }).toPromise();
      
      expect(updated.description).toBe('Updated workflow description');

      // 5. Verify final state
      const final = await service.getMetadataTable(table.id).toPromise();
      expect(final.name).toBe(tableData.name);
      expect(final.description).toBe('Updated workflow description');
    });

    it('should handle concurrent operations safely', async () => {
      // Create table
      const tableData = {
        name: 'Concurrent Test Table',
        description: 'For testing concurrent operations'
      };

      const table = await service.createMetadataTable(tableData).toPromise();
      createdTableId = table.id;

      // Perform multiple operations concurrently
      const operations = [
        service.addColumn(table.id, { name: 'Col1', type: 'text' }, 0).toPromise(),
        service.addColumn(table.id, { name: 'Col2', type: 'number' }, 1).toPromise(),
        service.patchMetadataTable(table.id, { description: 'Updated' }).toPromise()
      ];

      const results = await Promise.all(operations);
      
      // All operations should succeed
      expect(results[0].column.name).toBe('Col1');
      expect(results[1].column.name).toBe('Col2');
      expect(results[2].description).toBe('Updated');
    });
  });
});