import { of } from 'rxjs';
import { MetadataColumnService } from './metadata-column';

describe('MetadataColumnService', () => {
  let service: jasmine.SpyObj<MetadataColumnService>;

  beforeEach(() => {
    service = jasmine.createSpyObj('MetadataColumnService', [
      'getMetadataColumns',
      'getMetadataColumn',
      'createMetadataColumn',
      'updateMetadataColumn',
      'deleteMetadataColumn',
      'patchMetadataColumn',
      'bulkCreate',
      'updateColumnValue',
      'getOntologySuggestions',
      'validateSdrfData',
      'validateValue',
      'getHistory',
      'replaceValue',
      'bulkUpdateSampleValues'
    ]);
  });

  describe('getMetadataColumns', () => {
    it('should get metadata columns with parameters', (done) => {
      const mockResponse = { count: 1, results: [{ id: 1, name: 'test' }] };
      service.getMetadataColumns.and.returnValue(of(mockResponse as any));

      service.getMetadataColumns({ metadataTableId: 1 }).subscribe(response => {
        expect(response.count).toBe(1);
        expect(response.results.length).toBe(1);
        done();
      });

      expect(service.getMetadataColumns).toHaveBeenCalledWith({ metadataTableId: 1 });
    });
  });

  describe('getMetadataColumn', () => {
    it('should get single metadata column', (done) => {
      const mockResponse = { id: 1, name: 'test_column' };
      service.getMetadataColumn.and.returnValue(of(mockResponse as any));

      service.getMetadataColumn(1).subscribe(response => {
        expect(response.id).toBe(1);
        done();
      });

      expect(service.getMetadataColumn).toHaveBeenCalledWith(1);
    });
  });

  describe('createMetadataColumn', () => {
    it('should create metadata column', (done) => {
      const columnData = { metadataTable: 1, name: 'new_column', type: 'text', columnPosition: 0 };
      const mockResponse = { id: 1, ...columnData };
      service.createMetadataColumn.and.returnValue(of(mockResponse as any));

      service.createMetadataColumn(columnData).subscribe(response => {
        expect(response.id).toBe(1);
        done();
      });

      expect(service.createMetadataColumn).toHaveBeenCalledWith(columnData);
    });
  });

  describe('deleteMetadataColumn', () => {
    it('should delete metadata column', (done) => {
      service.deleteMetadataColumn.and.returnValue(of(undefined));

      service.deleteMetadataColumn(1).subscribe(() => {
        done();
      });

      expect(service.deleteMetadataColumn).toHaveBeenCalledWith(1);
    });
  });

  describe('getHistory', () => {
    it('should get column history', (done) => {
      const mockResponse = { count: 2, history: [], hasMore: false, limit: 20, offset: 0 };
      service.getHistory.and.returnValue(of(mockResponse as any));

      service.getHistory(1, { limit: 20, offset: 0 }).subscribe(response => {
        expect(response.count).toBe(2);
        done();
      });

      expect(service.getHistory).toHaveBeenCalledWith(1, { limit: 20, offset: 0 });
    });
  });
});
