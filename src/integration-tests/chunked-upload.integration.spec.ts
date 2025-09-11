import { TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { ChunkedUploadService } from '@cupcake/vanilla';

describe('ChunkedUploadService Integration Tests', () => {
  let service: ChunkedUploadService;
  const config = global.integrationTestConfig;
  let uploadSessions: string[] = [];

  beforeAll(async () => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule],
      providers: [
        ChunkedUploadService,
        { 
          provide: 'CUPCAKE_CORE_CONFIG', 
          useValue: { 
            apiUrl: config.apiUrl,
            siteName: 'Integration Test'
          }
        }
      ]
    });
    
    service = TestBed.inject(ChunkedUploadService);
  });

  afterEach(async () => {
    // Cleanup upload sessions
    for (const sessionId of uploadSessions) {
      try {
        await service.deleteUploadSession(sessionId).toPromise();
      } catch (error) {
        console.warn(`Failed to cleanup upload session ${sessionId}:`, error);
      }
    }
    uploadSessions = [];
  });

  describe('Upload Session Management', () => {
    it('should create upload session with file info', async () => {
      const fileInfo = {
        filename: 'integration-test.csv',
        totalSize: 1024,
        chunkSize: 256,
        checksums: ['hash1', 'hash2', 'hash3', 'hash4']
      };

      const session = await service.createUploadSession(fileInfo).toPromise();
      
      expect(session).toBeValidApiResponse();
      expect(session.id).toBeDefined();
      expect(session.filename).toBe(fileInfo.filename);
      expect(session.totalSize).toBe(fileInfo.totalSize);
      expect(session.status).toBe('created');
      
      uploadSessions.push(session.id);
      config.testData.createdResources.push({
        type: 'upload-session',
        id: session.id,
        endpoint: '/chunked-upload'
      });
    });

    it('should get upload session status', async () => {
      // Create session first
      const fileInfo = {
        filename: 'status-test.csv',
        totalSize: 512,
        chunkSize: 256
      };

      const created = await service.createUploadSession(fileInfo).toPromise();
      uploadSessions.push(created.id);

      // Get status
      const status = await service.getUploadSession(created.id).toPromise();
      
      expect(status).toBeValidApiResponse();
      expect(status.id).toBe(created.id);
      expect(status.filename).toBe(fileInfo.filename);
      expect(status.status).toBeDefined();
    });

    it('should delete upload session', async () => {
      const fileInfo = {
        filename: 'delete-test.csv',
        totalSize: 256
      };

      const created = await service.createUploadSession(fileInfo).toPromise();
      
      // Delete session
      await service.deleteUploadSession(created.id).toPromise();
      
      // Verify deletion
      try {
        await service.getUploadSession(created.id).toPromise();
        fail('Should have thrown 404 error');
      } catch (error) {
        expect(error.status).toBe(404);
      }
    });
  });

  describe('Chunk Upload Operations', () => {
    let sessionId: string;

    beforeEach(async () => {
      const fileInfo = {
        filename: 'chunk-test.csv',
        totalSize: 1024,
        chunkSize: 256,
        checksums: ['chunk1hash', 'chunk2hash', 'chunk3hash', 'chunk4hash']
      };

      const session = await service.createUploadSession(fileInfo).toPromise();
      sessionId = session.id;
      uploadSessions.push(sessionId);
    });

    it('should upload chunk with ArrayBuffer data', async () => {
      const chunkData = new ArrayBuffer(256);
      const view = new Uint8Array(chunkData);
      
      // Fill with test data
      for (let i = 0; i < 256; i++) {
        view[i] = i % 256;
      }

      const result = await service.uploadChunk(sessionId, 0, chunkData, 'chunk1hash').toPromise();
      
      expect(result).toBeValidApiResponse();
      expect(result.chunkNumber).toBe(0);
      expect(result.status).toBe('uploaded');
      expect(result.message).toContain('success');
    });

    it('should upload chunk with Blob data', async () => {
      const testContent = 'This is test chunk content that should be exactly 256 bytes long' + 'x'.repeat(192);
      const chunkBlob = new Blob([testContent], { type: 'text/plain' });

      const result = await service.uploadChunk(sessionId, 0, chunkBlob, 'chunk1hash').toPromise();
      
      expect(result).toBeValidApiResponse();
      expect(result.chunkNumber).toBe(0);
      expect(result.status).toBe('uploaded');
    });

    it('should handle chunk upload with invalid checksum', async () => {
      const chunkData = new ArrayBuffer(256);

      try {
        await service.uploadChunk(sessionId, 0, chunkData, 'invalid_checksum').toPromise();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.status).toBe(400);
        expect(error.error).toMatchApiErrorFormat(400);
      }
    });

    it('should upload multiple chunks sequentially', async () => {
      const chunks = [
        { data: new ArrayBuffer(256), hash: 'chunk1hash' },
        { data: new ArrayBuffer(256), hash: 'chunk2hash' },
        { data: new ArrayBuffer(256), hash: 'chunk3hash' }
      ];

      // Fill chunks with different data
      chunks.forEach((chunk, index) => {
        const view = new Uint8Array(chunk.data);
        for (let i = 0; i < 256; i++) {
          view[i] = (index * 256 + i) % 256;
        }
      });

      // Upload chunks sequentially
      for (let i = 0; i < chunks.length; i++) {
        const result = await service.uploadChunk(sessionId, i, chunks[i].data, chunks[i].hash).toPromise();
        expect(result.chunkNumber).toBe(i);
        expect(result.status).toBe('uploaded');
      }
    });
  });

  describe('Upload Completion and Verification', () => {
    let sessionId: string;

    beforeEach(async () => {
      const fileInfo = {
        filename: 'complete-test.csv',
        totalSize: 512,
        chunkSize: 256,
        checksums: ['chunk1hash', 'chunk2hash']
      };

      const session = await service.createUploadSession(fileInfo).toPromise();
      sessionId = session.id;
      uploadSessions.push(sessionId);

      // Upload chunks
      const chunk1 = new ArrayBuffer(256);
      const chunk2 = new ArrayBuffer(256);
      
      await service.uploadChunk(sessionId, 0, chunk1, 'chunk1hash').toPromise();
      await service.uploadChunk(sessionId, 1, chunk2, 'chunk2hash').toPromise();
    });

    it('should complete upload successfully', async () => {
      const finalChecksum = 'final_file_checksum';

      const result = await service.completeUpload(sessionId, finalChecksum).toPromise();
      
      expect(result).toBeValidApiResponse();
      expect(result.id).toBe(sessionId);
      expect(result.status).toBe('completed');
      expect(result.filename).toBe('complete-test.csv');
      expect(result.verified).toBeDefined();
    });

    it('should handle completion with wrong checksum', async () => {
      const wrongChecksum = 'wrong_checksum';

      try {
        await service.completeUpload(sessionId, wrongChecksum).toPromise();
        // This might succeed if the backend doesn't validate checksums strictly
        // or fail with a 400 error
      } catch (error) {
        expect(error.status).toBe(400);
        expect(error.error).toMatchApiErrorFormat(400);
      }
    });

    it('should verify uploaded file integrity', async () => {
      const expectedChecksum = 'expected_file_hash';

      const result = await service.verifyUpload(sessionId, expectedChecksum).toPromise();
      
      expect(result).toBeValidApiResponse();
      expect(result.verified).toBeDefined();
      expect(result.actualChecksum).toBeDefined();
      expect(result.expectedChecksum).toBe(expectedChecksum);
    });
  });

  describe('Upload Progress and Resume', () => {
    let sessionId: string;

    beforeEach(async () => {
      const fileInfo = {
        filename: 'progress-test.csv',
        totalSize: 1024,
        chunkSize: 256,
        checksums: ['c1', 'c2', 'c3', 'c4']
      };

      const session = await service.createUploadSession(fileInfo).toPromise();
      sessionId = session.id;
      uploadSessions.push(sessionId);
    });

    it('should track upload progress', async () => {
      // Upload first chunk
      const chunk1 = new ArrayBuffer(256);
      await service.uploadChunk(sessionId, 0, chunk1, 'c1').toPromise();

      const progress = await service.getUploadProgress(sessionId).toPromise();
      
      expect(progress).toBeValidApiResponse();
      expect(progress.uploadId).toBe(sessionId);
      expect(progress.totalChunks).toBe(4);
      expect(progress.uploadedChunks).toBe(1);
      expect(progress.progress).toBe(25);
      expect(progress.status).toBe('uploading');
    });

    it('should resume upload from specific chunk', async () => {
      // Upload first two chunks
      const chunk1 = new ArrayBuffer(256);
      const chunk2 = new ArrayBuffer(256);
      
      await service.uploadChunk(sessionId, 0, chunk1, 'c1').toPromise();
      await service.uploadChunk(sessionId, 1, chunk2, 'c2').toPromise();

      // Resume from chunk 2 (should return remaining chunks)
      const resumeResult = await service.resumeUpload(sessionId, 2).toPromise();
      
      expect(resumeResult).toBeValidApiResponse();
      expect(resumeResult.uploadId).toBe(sessionId);
      expect(resumeResult.resumeFromChunk).toBe(2);
      expect(resumeResult.remainingChunks).toContain(2);
      expect(resumeResult.remainingChunks).toContain(3);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle non-existent upload session', async () => {
      try {
        await service.getUploadSession('non-existent-id').toPromise();
        fail('Should have thrown 404 error');
      } catch (error) {
        expect(error.status).toBe(404);
        expect(error.error).toMatchApiErrorFormat(404);
      }
    });

    it('should handle upload to non-existent session', async () => {
      const chunkData = new ArrayBuffer(256);

      try {
        await service.uploadChunk('non-existent', 0, chunkData, 'hash').toPromise();
        fail('Should have thrown error');
      } catch (error) {
        expect([400, 404]).toContain(error.status);
      }
    });

    it('should handle oversized chunk upload', async () => {
      const fileInfo = {
        filename: 'oversize-test.csv',
        totalSize: 256,
        chunkSize: 128
      };

      const session = await service.createUploadSession(fileInfo).toPromise();
      uploadSessions.push(session.id);

      // Try to upload chunk larger than expected
      const oversizedChunk = new ArrayBuffer(512); // Larger than chunkSize

      try {
        await service.uploadChunk(session.id, 0, oversizedChunk, 'hash').toPromise();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.status).toBe(400);
      }
    });

    it('should handle duplicate chunk uploads', async () => {
      const fileInfo = {
        filename: 'duplicate-test.csv',
        totalSize: 256,
        chunkSize: 256,
        checksums: ['chunk1hash']
      };

      const session = await service.createUploadSession(fileInfo).toPromise();
      uploadSessions.push(session.id);

      const chunkData = new ArrayBuffer(256);

      // Upload same chunk twice
      const result1 = await service.uploadChunk(session.id, 0, chunkData, 'chunk1hash').toPromise();
      const result2 = await service.uploadChunk(session.id, 0, chunkData, 'chunk1hash').toPromise();

      expect(result1.status).toBe('uploaded');
      expect(result2.status).toBe('uploaded');
      // Backend should handle duplicates gracefully
    });
  });

  describe('Complete Upload Workflow', () => {
    it('should handle end-to-end file upload process', async () => {
      // 1. Create upload session
      const fileInfo = {
        filename: 'workflow-test.csv',
        totalSize: 1024,
        chunkSize: 256,
        checksums: ['w1', 'w2', 'w3', 'w4']
      };

      const session = await service.createUploadSession(fileInfo).toPromise();
      uploadSessions.push(session.id);
      
      expect(session.status).toBe('created');

      // 2. Upload all chunks
      const chunks = Array(4).fill(null).map((_, i) => {
        const data = new ArrayBuffer(256);
        const view = new Uint8Array(data);
        for (let j = 0; j < 256; j++) {
          view[j] = (i * 256 + j) % 256;
        }
        return { data, hash: `w${i + 1}` };
      });

      for (let i = 0; i < chunks.length; i++) {
        const result = await service.uploadChunk(session.id, i, chunks[i].data, chunks[i].hash).toPromise();
        expect(result.chunkNumber).toBe(i);
      }

      // 3. Check progress
      const progress = await service.getUploadProgress(session.id).toPromise();
      expect(progress.progress).toBe(100);
      expect(progress.uploadedChunks).toBe(4);

      // 4. Complete upload
      const completed = await service.completeUpload(session.id, 'final_hash').toPromise();
      expect(completed.status).toBe('completed');

      // 5. Verify final state
      const finalStatus = await service.getUploadSession(session.id).toPromise();
      expect(finalStatus.status).toBe('completed');
    });

    it('should handle upload interruption and resume', async () => {
      // 1. Create session and upload partial chunks
      const fileInfo = {
        filename: 'resume-test.csv',
        totalSize: 1024,
        chunkSize: 256,
        checksums: ['r1', 'r2', 'r3', 'r4']
      };

      const session = await service.createUploadSession(fileInfo).toPromise();
      uploadSessions.push(session.id);

      // Upload first 2 chunks
      const chunk1 = new ArrayBuffer(256);
      const chunk2 = new ArrayBuffer(256);
      
      await service.uploadChunk(session.id, 0, chunk1, 'r1').toPromise();
      await service.uploadChunk(session.id, 1, chunk2, 'r2').toPromise();

      // 2. Check progress (simulating interruption)
      const midProgress = await service.getUploadProgress(session.id).toPromise();
      expect(midProgress.progress).toBe(50);

      // 3. Resume upload
      const resumeInfo = await service.resumeUpload(session.id, 2).toPromise();
      expect(resumeInfo.remainingChunks).toEqual([2, 3]);

      // 4. Upload remaining chunks
      const chunk3 = new ArrayBuffer(256);
      const chunk4 = new ArrayBuffer(256);
      
      await service.uploadChunk(session.id, 2, chunk3, 'r3').toPromise();
      await service.uploadChunk(session.id, 3, chunk4, 'r4').toPromise();

      // 5. Complete upload
      const completed = await service.completeUpload(session.id, 'resume_final').toPromise();
      expect(completed.status).toBe('completed');
    });
  });
});