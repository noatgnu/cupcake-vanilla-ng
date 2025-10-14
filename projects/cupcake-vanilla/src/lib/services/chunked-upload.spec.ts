import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ChunkedUploadService } from './chunked-upload';
import { CUPCAKE_CORE_CONFIG } from '@noatgnu/cupcake-core';

describe('ChunkedUploadService', () => {
  let service: ChunkedUploadService;
  let httpMock: HttpTestingController;
  const mockConfig = {
    apiUrl: 'https://api.test.com',
    siteName: 'Test Site'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ChunkedUploadService,
        { provide: CUPCAKE_CORE_CONFIG, useValue: mockConfig }
      ]
    });
    service = TestBed.inject(ChunkedUploadService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Upload Session Management', () => {
    it('should create upload session', (done) => {
      const fileInfo = {
        filename: 'test.csv',
        totalSize: 1024,
        chunkSize: 256,
        checksums: ['hash1', 'hash2', 'hash3', 'hash4']
      };
      const mockResponse = {
        id: 'upload-123',
        filename: 'test.csv',
        totalSize: 1024,
        status: 'created',
        uploadedChunks: []
      };

      service.createUploadSession(fileInfo).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/chunked-upload/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        filename: 'test.csv',
        total_size: 1024,
        chunk_size: 256,
        checksums: ['hash1', 'hash2', 'hash3', 'hash4']
      });
      req.flush({
        id: 'upload-123',
        filename: 'test.csv',
        total_size: 1024,
        status: 'created',
        uploaded_chunks: []
      });
    });

    it('should get upload session status', (done) => {
      const uploadId = 'upload-123';
      const mockResponse = {
        id: 'upload-123',
        filename: 'test.csv',
        status: 'uploading',
        progress: 75,
        uploadedChunks: [0, 1, 2]
      };

      service.getUploadSession(uploadId).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/chunked-upload/upload-123/`);
      expect(req.request.method).toBe('GET');
      req.flush({
        id: 'upload-123',
        filename: 'test.csv',
        status: 'uploading',
        progress: 75,
        uploaded_chunks: [0, 1, 2]
      });
    });

    it('should delete upload session', (done) => {
      const uploadId = 'upload-123';

      service.deleteUploadSession(uploadId).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/chunked-upload/upload-123/`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('Chunk Upload', () => {
    it('should upload chunk with binary data', (done) => {
      const uploadId = 'upload-123';
      const chunkNumber = 0;
      const chunkData = new ArrayBuffer(256);
      const checksum = 'sha256hash';

      const mockResponse = {
        chunkNumber: 0,
        status: 'uploaded',
        message: 'Chunk uploaded successfully'
      };

      service.uploadChunk(uploadId, chunkNumber, chunkData, checksum).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/chunked-upload/upload-123/chunk/`);
      expect(req.request.method).toBe('POST');
      
      // Verify FormData was created correctly
      expect(req.request.body instanceof FormData).toBe(true);
      const formData = req.request.body as FormData;
      expect(formData.get('chunk_number')).toBe('0');
      expect(formData.get('checksum')).toBe('sha256hash');
      expect(formData.get('chunk')).toBeInstanceOf(Blob);

      req.flush({
        chunk_number: 0,
        status: 'uploaded',
        message: 'Chunk uploaded successfully'
      });
    });

    it('should upload chunk with File object', (done) => {
      const uploadId = 'upload-123';
      const chunkNumber = 1;
      const file = new File(['test content'], 'chunk.bin');
      const checksum = 'sha256hash2';

      service.uploadChunk(uploadId, chunkNumber, file, checksum).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/chunked-upload/upload-123/chunk/`);
      expect(req.request.method).toBe('POST');
      
      const formData = req.request.body as FormData;
      expect(formData.get('chunk_number')).toBe('1');
      expect(formData.get('checksum')).toBe('sha256hash2');
      expect(formData.get('chunk')).toBe(file);

      req.flush({ chunk_number: 1, status: 'uploaded' });
    });

    it('should handle chunk upload error', (done) => {
      const uploadId = 'upload-123';
      const chunkNumber = 0;
      const chunkData = new ArrayBuffer(256);
      const checksum = 'invalid-hash';

      service.uploadChunk(uploadId, chunkNumber, chunkData, checksum).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(400);
          expect(error.error.checksum).toContain('Invalid checksum');
          done();
        }
      );

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/chunked-upload/upload-123/chunk/`);
      req.flush(
        { checksum: ['Invalid checksum provided'] }, 
        { status: 400, statusText: 'Bad Request' }
      );
    });
  });

  describe('Upload Completion', () => {
    it('should complete upload successfully', (done) => {
      const uploadId = 'upload-123';
      const finalChecksum = 'final-sha256-hash';

      const mockResponse = {
        id: 'upload-123',
        status: 'completed',
        filename: 'test.csv',
        finalUrl: '/files/test.csv',
        verified: true
      };

      service.completeUpload(uploadId, finalChecksum).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/chunked-upload/upload-123/complete/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ final_checksum: 'final-sha256-hash' });
      req.flush({
        id: 'upload-123',
        status: 'completed',
        filename: 'test.csv',
        final_url: '/files/test.csv',
        verified: true
      });
    });

    it('should handle completion with verification failure', (done) => {
      const uploadId = 'upload-123';
      const finalChecksum = 'wrong-hash';

      service.completeUpload(uploadId, finalChecksum).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(400);
          expect(error.error.detail).toContain('Checksum verification failed');
          done();
        }
      );

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/chunked-upload/upload-123/complete/`);
      req.flush(
        { detail: 'Checksum verification failed' }, 
        { status: 400, statusText: 'Bad Request' }
      );
    });
  });

  describe('Progress Tracking', () => {
    it('should get upload progress', (done) => {
      const uploadId = 'upload-123';
      const mockResponse = {
        uploadId: 'upload-123',
        totalChunks: 4,
        uploadedChunks: 3,
        progress: 75,
        status: 'uploading',
        remainingChunks: [3]
      };

      service.getUploadProgress(uploadId).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/chunked-upload/upload-123/progress/`);
      expect(req.request.method).toBe('GET');
      req.flush({
        upload_id: 'upload-123',
        total_chunks: 4,
        uploaded_chunks: 3,
        progress: 75,
        status: 'uploading',
        remaining_chunks: [3]
      });
    });

    it('should handle progress for non-existent upload', (done) => {
      service.getUploadProgress('non-existent').subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(404);
          done();
        }
      );

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/chunked-upload/non-existent/progress/`);
      req.flush({ detail: 'Upload not found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('Upload Resume', () => {
    it('should resume upload from specific chunk', (done) => {
      const uploadId = 'upload-123';
      const fromChunk = 2;

      const mockResponse = {
        uploadId: 'upload-123',
        resumeFromChunk: 2,
        remainingChunks: [2, 3],
        status: 'resuming'
      };

      service.resumeUpload(uploadId, fromChunk).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/chunked-upload/upload-123/resume/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ from_chunk: 2 });
      req.flush({
        upload_id: 'upload-123',
        resume_from_chunk: 2,
        remaining_chunks: [2, 3],
        status: 'resuming'
      });
    });
  });

  describe('File Verification', () => {
    it('should verify file integrity after upload', (done) => {
      const uploadId = 'upload-123';
      const expectedChecksum = 'expected-hash';

      const mockResponse = {
        verified: true,
        actualChecksum: 'expected-hash',
        expectedChecksum: 'expected-hash',
        message: 'File integrity verified'
      };

      service.verifyUpload(uploadId, expectedChecksum).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/chunked-upload/upload-123/verify/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ expected_checksum: 'expected-hash' });
      req.flush({
        verified: true,
        actual_checksum: 'expected-hash',
        expected_checksum: 'expected-hash',
        message: 'File integrity verified'
      });
    });

    it('should handle verification failure', (done) => {
      const uploadId = 'upload-123';
      const expectedChecksum = 'expected-hash';

      const mockResponse = {
        verified: false,
        actualChecksum: 'different-hash',
        expectedChecksum: 'expected-hash',
        message: 'File integrity check failed'
      };

      service.verifyUpload(uploadId, expectedChecksum).subscribe(response => {
        expect(response.verified).toBe(false);
        expect(response.actualChecksum).not.toBe(response.expectedChecksum);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/chunked-upload/upload-123/verify/`);
      req.flush({
        verified: false,
        actual_checksum: 'different-hash',
        expected_checksum: 'expected-hash',
        message: 'File integrity check failed'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors during chunk upload', (done) => {
      const uploadId = 'upload-123';
      const chunkNumber = 0;
      const chunkData = new ArrayBuffer(256);
      const checksum = 'hash';

      service.uploadChunk(uploadId, chunkNumber, chunkData, checksum).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.name).toBe('HttpErrorResponse');
          done();
        }
      );

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/chunked-upload/upload-123/chunk/`);
      req.error(new ErrorEvent('Network error'));
    });

    it('should handle server timeouts', (done) => {
      service.createUploadSession({ filename: 'test.csv', totalSize: 1024 }).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(408);
          done();
        }
      );

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/chunked-upload/`);
      req.flush({ error: 'Request timeout' }, { status: 408, statusText: 'Request Timeout' });
    });

    it('should handle storage quota exceeded', (done) => {
      const fileInfo = { filename: 'huge-file.csv', totalSize: 1000000000 };

      service.createUploadSession(fileInfo).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(413);
          expect(error.error.detail).toContain('quota exceeded');
          done();
        }
      );

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/chunked-upload/`);
      req.flush(
        { detail: 'Storage quota exceeded' }, 
        { status: 413, statusText: 'Payload Too Large' }
      );
    });
  });

  describe('Data Transformation', () => {
    it('should transform camelCase parameters to snake_case', (done) => {
      const fileInfo = {
        filename: 'test.csv',
        totalSize: 1024,
        chunkSize: 256,
        contentType: 'text/csv',
        checksums: ['hash1']
      };

      service.createUploadSession(fileInfo).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/chunked-upload/`);
      expect(req.request.body).toEqual({
        filename: 'test.csv',
        total_size: 1024,
        chunk_size: 256,
        content_type: 'text/csv',
        checksums: ['hash1']
      });
      req.flush({ id: 'upload-123' });
    });

    it('should transform snake_case response to camelCase', (done) => {
      const mockResponse = {
        id: 'upload-123',
        total_size: 1024,
        uploaded_chunks: [0, 1],
        chunk_size: 256,
        created_at: '2023-01-01T00:00:00Z',
        final_url: '/files/test.csv'
      };

      const expectedResponse = {
        id: 'upload-123',
        totalSize: 1024,
        uploadedChunks: [0, 1],
        chunkSize: 256,
        createdAt: '2023-01-01T00:00:00Z',
        finalUrl: '/files/test.csv'
      };

      service.getUploadSession('upload-123').subscribe(response => {
        expect(response).toEqual(expectedResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/chunked-upload/upload-123/`);
      req.flush(mockResponse);
    });
  });

  describe('Complete Upload With File (SHA-256)', () => {
    it('should upload file with SHA-256 checksum in FormData', (done) => {
      const fileContent = 'test metadata table content';
      const blob = new Blob([fileContent], { type: 'text/csv' });
      const file = new File([blob], 'metadata.csv', { type: 'text/csv' });

      const hasher = new (window as any).jsSHA('SHA-256', 'ARRAYBUFFER');
      const reader = new FileReader();
      reader.onload = () => {
        hasher.update(reader.result as ArrayBuffer);
        const expectedHash = hasher.getHash('HEX');

        const request = {
          file: file,
          filename: 'metadata.csv',
          metadataTableId: 10
        };

        service.completeUploadWithFile(request).subscribe({
          next: (response) => {
            expect(response.id).toBe('metadata-upload-123');
            done();
          },
          error: done.fail
        });

        const req = httpMock.expectOne(`${mockConfig.apiUrl}/chunked-upload/`);
        expect(req.request.method).toBe('POST');

        const formData = req.request.body as FormData;
        expect(formData.get('file')).toBe(file);
        expect(formData.get('filename')).toBe('metadata.csv');
        expect(formData.get('metadata_table_id')).toBe('10');
        const actualHash = formData.get('sha256') as string;
        expect(actualHash).toBeTruthy();
        expect(actualHash).toBe(expectedHash);

        req.flush({
          id: 'metadata-upload-123',
          message: 'Upload complete',
          metadata_table_id: 10,
          filename: 'metadata.csv'
        });
      };
      reader.readAsArrayBuffer(file);
    });

    it('should calculate correct SHA-256 hash for known content', (done) => {
      const knownContent = 'Sample,Data\nRow1,Value1\nRow2,Value2';
      const blob = new Blob([knownContent], { type: 'text/csv' });
      const file = new File([blob], 'sample.csv', { type: 'text/csv' });

      const hasher = new (window as any).jsSHA('SHA-256', 'TEXT', { encoding: 'UTF8' });
      hasher.update(knownContent);
      const expectedHash = hasher.getHash('HEX');

      const request = {
        file: file,
        metadataTableId: 5
      };

      service.completeUploadWithFile(request).subscribe({
        next: () => done(),
        error: done.fail
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/chunked-upload/`);
      const formData = req.request.body as FormData;
      const actualHash = formData.get('sha256') as string;

      expect(actualHash).toBe(expectedHash);

      req.flush({ id: 'test', message: 'ok', metadata_table_id: 5 });
    });

    it('should include all required fields in FormData', (done) => {
      const fileContent = 'complete test';
      const blob = new Blob([fileContent], { type: 'text/csv' });
      const file = new File([blob], 'complete.csv', { type: 'text/csv' });

      const request = {
        file: file,
        filename: 'complete.csv',
        metadataTableId: 20,
        columnMapping: { col1: 'mapped1', col2: 'mapped2' }
      };

      service.completeUploadWithFile(request).subscribe({
        next: () => done(),
        error: done.fail
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/chunked-upload/`);
      const formData = req.request.body as FormData;

      expect(formData.get('file')).toBe(file);
      expect(formData.get('filename')).toBe('complete.csv');
      expect(formData.get('metadata_table_id')).toBe('20');
      expect(formData.get('column_mapping')).toBe(JSON.stringify({ col1: 'mapped1', col2: 'mapped2' }));
      expect(formData.get('sha256')).toBeTruthy();
      expect(typeof formData.get('sha256')).toBe('string');

      req.flush({ id: 'complete-123', message: 'ok' });
    });

    it('should handle SHA-256 error gracefully', (done) => {
      const fileContent = 'error test file';
      const blob = new Blob([fileContent], { type: 'text/csv' });
      const file = new File([blob], 'error.csv', { type: 'text/csv' });

      const request = {
        file: file,
        metadataTableId: 1
      };

      service.completeUploadWithFile(request).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
          expect(error.error.detail).toContain('Checksum');
          done();
        }
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/chunked-upload/`);
      req.flush(
        { detail: 'Checksum of type \'sha256\' is required' },
        { status: 400, statusText: 'Bad Request' }
      );
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete upload workflow', (done) => {
      const fileInfo = { filename: 'workflow.csv', totalSize: 512, chunkSize: 256 };
      let uploadId: string;

      // 1. Create upload session
      service.createUploadSession(fileInfo).subscribe(session => {
        uploadId = session.id;
        expect(session.status).toBe('created');

        // 2. Upload first chunk
        const chunk1 = new ArrayBuffer(256);
        service.uploadChunk(uploadId, 0, chunk1, 'hash1').subscribe(chunkResponse => {
          expect(chunkResponse.chunkNumber).toBe(0);

          // 3. Upload second chunk
          const chunk2 = new ArrayBuffer(256);
          service.uploadChunk(uploadId, 1, chunk2, 'hash2').subscribe(() => {

            // 4. Complete upload
            service.completeUpload(uploadId, 'final-hash').subscribe(completed => {
              expect(completed.status).toBe('completed');
              expect(completed.verified).toBe(true);
              done();
            });

            const completeReq = httpMock.expectOne(`${mockConfig.apiUrl}/chunked-upload/${uploadId}/complete/`);
            completeReq.flush({
              id: uploadId,
              status: 'completed',
              verified: true,
              final_url: '/files/workflow.csv'
            });
          });

          const chunk2Req = httpMock.expectOne(`${mockConfig.apiUrl}/chunked-upload/${uploadId}/chunk/`);
          chunk2Req.flush({ chunk_number: 1, status: 'uploaded' });
        });

        const chunk1Req = httpMock.expectOne(`${mockConfig.apiUrl}/chunked-upload/${uploadId}/chunk/`);
        chunk1Req.flush({ chunk_number: 0, status: 'uploaded' });
      });

      const createReq = httpMock.expectOne(`${mockConfig.apiUrl}/chunked-upload/`);
      createReq.flush({
        id: 'workflow-123',
        filename: 'workflow.csv',
        total_size: 512,
        status: 'created'
      });
    });

    it('should handle upload failure and cleanup', (done) => {
      const fileInfo = { filename: 'failed.csv', totalSize: 256 };

      service.createUploadSession(fileInfo).subscribe(
        session => {
          // Attempt to upload chunk that will fail
          service.uploadChunk(session.id, 0, new ArrayBuffer(256), 'bad-hash').subscribe(
            () => fail('chunk upload should have failed'),
            chunkError => {
              expect(chunkError.status).toBe(400);

              // Clean up failed upload
              service.deleteUploadSession(session.id).subscribe(() => {
                done();
              });

              const deleteReq = httpMock.expectOne(`${mockConfig.apiUrl}/chunked-upload/${session.id}/`);
              deleteReq.flush(null);
            }
          );

          const chunkReq = httpMock.expectOne(`${mockConfig.apiUrl}/chunked-upload/${session.id}/chunk/`);
          chunkReq.flush({ detail: 'Invalid chunk data' }, { status: 400, statusText: 'Bad Request' });
        }
      );

      const createReq = httpMock.expectOne(`${mockConfig.apiUrl}/chunked-upload/`);
      createReq.flush({ id: 'failed-123', status: 'created' });
    });
  });
});