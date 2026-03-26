import { of } from 'rxjs';
import { MetadataTableService } from './metadata-table';

describe('MetadataTableService', () => {
  let service: jasmine.SpyObj<MetadataTableService>;

  beforeEach(() => {
    service = jasmine.createSpyObj('MetadataTableService', [
      'getMetadataTables',
      'getMetadataTable',
      'createMetadataTable',
      'updateMetadataTable',
      'patchMetadataTable',
      'deleteMetadataTable',
      'addColumn',
      'addColumnWithAutoReorder',
      'removeColumn',
      'reorderColumn',
      'normalizeColumnPositions',
      'reorderColumnsBySchemaAsync',
      'getAdminAllTables',
      'searchMetadataTables',
      'getMetadataTablesByOwner',
      'getSharedMetadataTables',
      'combineColumnwise',
      'combineRowwise',
      'validateSampleCountChange',
      'updateSampleCount',
      'replaceColumnValue',
      'bulkDeleteColumns',
      'bulkUpdateStaffOnly',
      'advancedAutofill'
    ]);
  });

  describe('getMetadataTables', () => {
    it('should get metadata tables with parameters', (done) => {
      const mockResponse = { count: 1, results: [{ id: 1, name: 'Test Table' }] };
      service.getMetadataTables.and.returnValue(of(mockResponse as any));

      service.getMetadataTables({ search: 'test', limit: 10 }).subscribe(response => {
        expect(response.count).toBe(1);
        expect(response.results.length).toBe(1);
        done();
      });

      expect(service.getMetadataTables).toHaveBeenCalledWith({ search: 'test', limit: 10 });
    });
  });

  describe('getMetadataTable', () => {
    it('should get single metadata table', (done) => {
      const mockResponse = { id: 1, name: 'Test Table' };
      service.getMetadataTable.and.returnValue(of(mockResponse as any));

      service.getMetadataTable(1).subscribe(response => {
        expect(response.id).toBe(1);
        done();
      });

      expect(service.getMetadataTable).toHaveBeenCalledWith(1);
    });
  });

  describe('createMetadataTable', () => {
    it('should create metadata table', (done) => {
      const tableData = { name: 'New Table', sampleCount: 10 };
      const mockResponse = { id: 1, ...tableData };
      service.createMetadataTable.and.returnValue(of(mockResponse as any));

      service.createMetadataTable(tableData).subscribe(response => {
        expect(response.id).toBe(1);
        done();
      });

      expect(service.createMetadataTable).toHaveBeenCalledWith(tableData);
    });
  });

  describe('deleteMetadataTable', () => {
    it('should delete metadata table', (done) => {
      service.deleteMetadataTable.and.returnValue(of(undefined));

      service.deleteMetadataTable(1).subscribe(() => {
        done();
      });

      expect(service.deleteMetadataTable).toHaveBeenCalledWith(1);
    });
  });

  describe('updateSampleCount', () => {
    it('should update sample count', (done) => {
      const mockResponse = { message: 'Success', oldSampleCount: 5, newSampleCount: 10, cleanupPerformed: false };
      service.updateSampleCount.and.returnValue(of(mockResponse));

      service.updateSampleCount(1, 10, false).subscribe(response => {
        expect(response.message).toBe('Success');
        expect(response.newSampleCount).toBe(10);
        done();
      });

      expect(service.updateSampleCount).toHaveBeenCalledWith(1, 10, false);
    });
  });

  describe('advancedAutofill', () => {
    it('should perform advanced autofill', (done) => {
      const request = {
        templateSamples: [0, 1],
        targetSampleCount: 10,
        variations: [],
        fillStrategy: 'sequential' as const
      };
      const mockResponse = {
        status: 'success' as const,
        samplesModified: 10,
        columnsModified: 2,
        variationsCombinations: 1,
        strategy: 'sequential'
      };
      service.advancedAutofill.and.returnValue(of(mockResponse));

      service.advancedAutofill(1, request).subscribe(response => {
        expect(response.status).toBe('success');
        done();
      });

      expect(service.advancedAutofill).toHaveBeenCalledWith(1, request);
    });
  });
});
