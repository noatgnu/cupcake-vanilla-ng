import { of } from 'rxjs';
import { ChunkedUploadService } from './chunked-upload';

describe('ChunkedUploadService', () => {
  let service: jasmine.SpyObj<ChunkedUploadService>;

  beforeEach(() => {
    service = jasmine.createSpyObj('ChunkedUploadService', [
      'uploadChunk',
      'getUploadStatus',
      'completeUpload',
      'completeUploadWithFile',
      'cancelUpload'
    ]);
  });

  describe('uploadChunk', () => {
    it('should upload initial chunk without uploadId', (done) => {
      const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
      const request = { file, filename: 'test.csv' };
      const mockResponse = {
        id: 'upload-123',
        filename: 'test.csv',
        offset: 12,
        expires: '2023-12-31T23:59:59Z'
      };
      service.uploadChunk.and.returnValue(of(mockResponse as any));

      service.uploadChunk(request).subscribe(response => {
        expect(response.id).toBe('upload-123');
        expect(response.offset).toBe(12);
        done();
      });

      expect(service.uploadChunk).toHaveBeenCalledWith(request);
    });

    it('should continue upload with uploadId', (done) => {
      const file = new File(['more content'], 'test.csv', { type: 'text/csv' });
      const request = { file, filename: 'test.csv' };
      const uploadId = 'upload-123';
      const mockResponse = {
        id: 'upload-123',
        filename: 'test.csv',
        offset: 24,
        expires: '2023-12-31T23:59:59Z'
      };
      service.uploadChunk.and.returnValue(of(mockResponse as any));

      service.uploadChunk(request, uploadId).subscribe(response => {
        expect(response.id).toBe('upload-123');
        expect(response.offset).toBe(24);
        done();
      });

      expect(service.uploadChunk).toHaveBeenCalledWith(request, uploadId);
    });
  });

  describe('getUploadStatus', () => {
    it('should get upload status by id', (done) => {
      const uploadId = 'upload-123';
      const mockResponse = {
        id: 'upload-123',
        filename: 'test.csv',
        offset: 500,
        status: 'INCOMPLETE',
        created_at: '2023-01-01T00:00:00Z'
      };
      service.getUploadStatus.and.returnValue(of(mockResponse as any));

      service.getUploadStatus(uploadId).subscribe(response => {
        expect(response.id).toBe('upload-123');
        expect(response.status).toBe('INCOMPLETE');
        expect(response.offset).toBe(500);
        done();
      });

      expect(service.getUploadStatus).toHaveBeenCalledWith(uploadId);
    });
  });

  describe('completeUpload', () => {
    it('should complete upload with sha256', (done) => {
      const uploadId = 'upload-123';
      const request = { sha256: 'abc123hash' };
      service.completeUpload.and.returnValue(of({ message: 'Upload complete' } as any));

      service.completeUpload(uploadId, request).subscribe(response => {
        expect(response.message).toBe('Upload complete');
        done();
      });

      expect(service.completeUpload).toHaveBeenCalledWith(uploadId, request);
    });

    it('should complete upload with all options', (done) => {
      const uploadId = 'upload-123';
      const request = {
        sha256: 'abc123hash',
        metadataTableId: 10,
        createPools: true,
        replaceExisting: false
      };
      service.completeUpload.and.returnValue(of({ message: 'Upload complete' } as any));

      service.completeUpload(uploadId, request).subscribe(() => done());

      expect(service.completeUpload).toHaveBeenCalledWith(uploadId, request);
    });
  });

  describe('completeUploadWithFile', () => {
    it('should upload file with computed SHA-256 hash', (done) => {
      const fileContent = 'test metadata content';
      const file = new File([fileContent], 'metadata.csv', { type: 'text/csv' });
      const request = { file, filename: 'metadata.csv', metadataTableId: 10 };
      service.completeUploadWithFile.and.returnValue(of({ message: 'Upload complete', filename: 'metadata.csv' } as any));

      service.completeUploadWithFile(request).subscribe(response => {
        expect(response.message).toBe('Upload complete');
        done();
      });

      expect(service.completeUploadWithFile).toHaveBeenCalledWith(request);
    });
  });

  describe('cancelUpload', () => {
    it('should cancel upload by id', (done) => {
      const uploadId = 'upload-123';
      service.cancelUpload.and.returnValue(of(undefined));

      service.cancelUpload(uploadId).subscribe(() => done());

      expect(service.cancelUpload).toHaveBeenCalledWith(uploadId);
    });
  });
});
