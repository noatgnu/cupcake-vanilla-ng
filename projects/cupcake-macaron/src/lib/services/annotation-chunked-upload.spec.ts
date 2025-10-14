import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import jsSHA from 'jssha';

import { AnnotationChunkedUploadService } from './annotation-chunked-upload';
import {
  AnnotationChunkedUploadCompletionResponse,
  InstrumentAnnotationChunkedUploadRequest,
  StoredReagentAnnotationChunkedUploadRequest
} from '../models';

describe('AnnotationChunkedUploadService', () => {
  let service: AnnotationChunkedUploadService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AnnotationChunkedUploadService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(AnnotationChunkedUploadService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Instrument Annotation Upload', () => {
    it('should upload small file (< 1MB) with SHA-256 checksum', (done) => {
      const fileContent = 'test file content';
      const blob = new Blob([fileContent], { type: 'text/plain' });
      const file = new File([blob], 'test.txt', { type: 'text/plain' });

      const hasher = new jsSHA('SHA-256', 'ARRAYBUFFER');
      const reader = new FileReader();
      reader.onload = () => {
        hasher.update(reader.result as ArrayBuffer);
        const expectedHash = hasher.getHash('HEX');

        service.uploadInstrumentAnnotationFileInChunks(
          file,
          1,
          2,
          1024 * 1024,
          {
            annotation: 'test annotation',
            annotationType: 'file'
          }
        ).subscribe({
          next: (response) => {
            expect(response).toBeDefined();
            expect(response.instrumentAnnotationId).toBe(123);
            expect(response.message).toBe('Upload complete');
            done();
          },
          error: done.fail
        });

        const req = httpMock.expectOne('/api/upload/instrument-annotation-chunks/');
        expect(req.request.method).toBe('POST');

        const formData = req.request.body as FormData;
        expect(formData.get('file')).toBe(file);
        expect(formData.get('filename')).toBe('test.txt');
        expect(formData.get('instrument_id')).toBe('1');
        expect(formData.get('folder_id')).toBe('2');
        expect(formData.get('annotation')).toBe('test annotation');
        expect(formData.get('annotation_type')).toBe('file');
        expect(formData.get('sha256')).toBe(expectedHash);

        const mockResponse: AnnotationChunkedUploadCompletionResponse = {
          instrumentAnnotationId: 123,
          message: 'Upload complete'
        };
        req.flush(mockResponse);
      };
      reader.readAsArrayBuffer(file);
    });

    it('should upload large file (> 1MB) in chunks with SHA-256 checksum', (done) => {
      const chunkSize = 1024 * 1024;
      const fileSize = chunkSize + 500000;
      const fileContent = new Uint8Array(fileSize);
      for (let i = 0; i < fileSize; i++) {
        fileContent[i] = i % 256;
      }
      const blob = new Blob([fileContent], { type: 'application/octet-stream' });
      const file = new File([blob], 'large-file.bin', { type: 'application/octet-stream' });

      const hasher = new jsSHA('SHA-256', 'ARRAYBUFFER');
      const reader = new FileReader();
      reader.onload = () => {
        hasher.update(reader.result as ArrayBuffer);
        const expectedHash = hasher.getHash('HEX');

        let chunkCount = 0;

        service.uploadInstrumentAnnotationFileInChunks(
          file,
          1,
          2,
          chunkSize,
          {
            annotation: 'large file test',
            annotationType: 'file'
          }
        ).subscribe({
          next: (response) => {
            expect(response).toBeDefined();
            expect(response.instrumentAnnotationId).toBe(456);
            expect(response.message).toBe('Upload complete');
            done();
          },
          error: done.fail
        });

        const chunk1Req = httpMock.expectOne('/api/upload/instrument-annotation-chunks/');
        expect(chunk1Req.request.method).toBe('POST');
        expect(chunk1Req.request.headers.get('Content-Range')).toBe(`bytes 0-${chunkSize - 1}/${fileSize}`);
        chunk1Req.flush({ id: 'upload-123', offset: chunkSize });
        chunkCount++;

        const chunk2Req = httpMock.expectOne('/api/upload/instrument-annotation-chunks/upload-123/');
        expect(chunk2Req.request.method).toBe('PUT');
        expect(chunk2Req.request.headers.get('Content-Range')).toBe(`bytes ${chunkSize}-${fileSize - 1}/${fileSize}`);
        chunk2Req.flush({ id: 'upload-123', offset: fileSize });
        chunkCount++;

        const completeReq = httpMock.expectOne('/api/upload/instrument-annotation-chunks/upload-123/');
        expect(completeReq.request.method).toBe('POST');
        const completionFormData = completeReq.request.body as FormData;
        expect(completionFormData.get('sha256')).toBe(expectedHash);
        expect(completionFormData.get('instrument_id')).toBe('1');
        expect(completionFormData.get('folder_id')).toBe('2');
        expect(completionFormData.get('annotation')).toBe('large file test');

        const mockResponse: AnnotationChunkedUploadCompletionResponse = {
          instrumentAnnotationId: 456,
          message: 'Upload complete'
        };
        completeReq.flush(mockResponse);
      };
      reader.readAsArrayBuffer(file);
    });

    it('should include SHA-256 in FormData for completeInstrumentAnnotationUploadWithFile', (done) => {
      const fileContent = 'test content for hash verification';
      const blob = new Blob([fileContent], { type: 'text/plain' });
      const file = new File([blob], 'test.txt', { type: 'text/plain' });

      const hasher = new jsSHA('SHA-256', 'ARRAYBUFFER');
      const reader = new FileReader();
      reader.onload = () => {
        hasher.update(reader.result as ArrayBuffer);
        const expectedHash = hasher.getHash('HEX');

        const request: InstrumentAnnotationChunkedUploadRequest = {
          file: file,
          filename: 'test.txt',
          instrumentId: 1,
          folderId: 2,
          annotation: 'test',
          annotationType: 'file'
        };

        service.completeInstrumentAnnotationUploadWithFile(request).subscribe({
          next: (response) => {
            expect(response.instrumentAnnotationId).toBe(789);
            expect(response.message).toBe('Upload complete');
            done();
          },
          error: done.fail
        });

        const req = httpMock.expectOne('/api/upload/instrument-annotation-chunks/');
        expect(req.request.method).toBe('POST');

        const formData = req.request.body as FormData;
        const actualHash = formData.get('sha256') as string;
        expect(actualHash).toBeTruthy();
        expect(actualHash).toBe(expectedHash);
        expect(formData.get('instrument_id')).toBe('1');
        expect(formData.get('folder_id')).toBe('2');

        req.flush({
          instrumentAnnotationId: 789,
          message: 'Upload complete'
        });
      };
      reader.readAsArrayBuffer(file);
    });
  });

  describe('Stored Reagent Annotation Upload', () => {
    it('should upload small file (< 1MB) with SHA-256 checksum', (done) => {
      const fileContent = 'stored reagent test file';
      const blob = new Blob([fileContent], { type: 'text/plain' });
      const file = new File([blob], 'reagent-test.txt', { type: 'text/plain' });

      const hasher = new jsSHA('SHA-256', 'ARRAYBUFFER');
      const reader = new FileReader();
      reader.onload = () => {
        hasher.update(reader.result as ArrayBuffer);
        const expectedHash = hasher.getHash('HEX');

        service.uploadStoredReagentAnnotationFileInChunks(
          file,
          1,
          2,
          1024 * 1024,
          {
            annotation: 'reagent annotation',
            annotationType: 'file'
          }
        ).subscribe({
          next: (response) => {
            expect(response).toBeDefined();
            expect(response.storedReagentAnnotationId).toBe(111);
            expect(response.message).toBe('Upload complete');
            done();
          },
          error: done.fail
        });

        const req = httpMock.expectOne('/api/upload/stored-reagent-annotation-chunks/');
        expect(req.request.method).toBe('POST');

        const formData = req.request.body as FormData;
        expect(formData.get('file')).toBe(file);
        expect(formData.get('filename')).toBe('reagent-test.txt');
        expect(formData.get('stored_reagent_id')).toBe('1');
        expect(formData.get('folder_id')).toBe('2');
        expect(formData.get('annotation')).toBe('reagent annotation');
        expect(formData.get('annotation_type')).toBe('file');
        expect(formData.get('sha256')).toBe(expectedHash);

        const mockResponse: AnnotationChunkedUploadCompletionResponse = {
          storedReagentAnnotationId: 111,
          message: 'Upload complete'
        };
        req.flush(mockResponse);
      };
      reader.readAsArrayBuffer(file);
    });

    it('should upload large file (> 1MB) in chunks with SHA-256 checksum', (done) => {
      const chunkSize = 1024 * 1024;
      const fileSize = chunkSize + 500000;
      const fileContent = new Uint8Array(fileSize);
      for (let i = 0; i < fileSize; i++) {
        fileContent[i] = (i * 17) % 256;
      }
      const blob = new Blob([fileContent], { type: 'application/pdf' });
      const file = new File([blob], 'large-doc.pdf', { type: 'application/pdf' });

      const hasher = new jsSHA('SHA-256', 'ARRAYBUFFER');
      const reader = new FileReader();
      reader.onload = () => {
        hasher.update(reader.result as ArrayBuffer);
        const expectedHash = hasher.getHash('HEX');

        service.uploadStoredReagentAnnotationFileInChunks(
          file,
          5,
          3,
          chunkSize,
          {
            annotation: 'large reagent doc',
            annotationType: 'document'
          }
        ).subscribe({
          next: (response) => {
            expect(response).toBeDefined();
            expect(response.storedReagentAnnotationId).toBe(222);
            expect(response.message).toBe('Upload complete');
            done();
          },
          error: done.fail
        });

        const chunk1Req = httpMock.expectOne('/api/upload/stored-reagent-annotation-chunks/');
        expect(chunk1Req.request.method).toBe('POST');
        expect(chunk1Req.request.headers.get('Content-Range')).toBe(`bytes 0-${chunkSize - 1}/${fileSize}`);
        chunk1Req.flush({ id: 'upload-789', offset: chunkSize });

        const chunk2Req = httpMock.expectOne('/api/upload/stored-reagent-annotation-chunks/upload-789/');
        expect(chunk2Req.request.method).toBe('PUT');
        expect(chunk2Req.request.headers.get('Content-Range')).toBe(`bytes ${chunkSize}-${fileSize - 1}/${fileSize}`);
        chunk2Req.flush({ id: 'upload-789', offset: fileSize });

        const completeReq = httpMock.expectOne('/api/upload/stored-reagent-annotation-chunks/upload-789/');
        expect(completeReq.request.method).toBe('POST');
        const completionFormData = completeReq.request.body as FormData;
        expect(completionFormData.get('sha256')).toBe(expectedHash);
        expect(completionFormData.get('stored_reagent_id')).toBe('5');
        expect(completionFormData.get('folder_id')).toBe('3');
        expect(completionFormData.get('annotation')).toBe('large reagent doc');

        const mockResponse: AnnotationChunkedUploadCompletionResponse = {
          storedReagentAnnotationId: 222,
          message: 'Upload complete'
        };
        completeReq.flush(mockResponse);
      };
      reader.readAsArrayBuffer(file);
    });

    it('should include SHA-256 in FormData for completeStoredReagentAnnotationUploadWithFile', (done) => {
      const fileContent = 'stored reagent content for hash check';
      const blob = new Blob([fileContent], { type: 'application/pdf' });
      const file = new File([blob], 'msds.pdf', { type: 'application/pdf' });

      const hasher = new jsSHA('SHA-256', 'ARRAYBUFFER');
      const reader = new FileReader();
      reader.onload = () => {
        hasher.update(reader.result as ArrayBuffer);
        const expectedHash = hasher.getHash('HEX');

        const request: StoredReagentAnnotationChunkedUploadRequest = {
          file: file,
          filename: 'msds.pdf',
          storedReagentId: 1,
          folderId: 2,
          annotation: 'MSDS document',
          annotationType: 'document'
        };

        service.completeStoredReagentAnnotationUploadWithFile(request).subscribe({
          next: (response) => {
            expect(response.storedReagentAnnotationId).toBe(999);
            expect(response.message).toBe('Upload complete');
            done();
          },
          error: done.fail
        });

        const req = httpMock.expectOne('/api/upload/stored-reagent-annotation-chunks/');
        expect(req.request.method).toBe('POST');

        const formData = req.request.body as FormData;
        const actualHash = formData.get('sha256') as string;
        expect(actualHash).toBeTruthy();
        expect(actualHash).toBe(expectedHash);
        expect(formData.get('stored_reagent_id')).toBe('1');
        expect(formData.get('folder_id')).toBe('2');
        expect(formData.get('annotation')).toBe('MSDS document');

        req.flush({
          storedReagentAnnotationId: 999,
          message: 'Upload complete'
        });
      };
      reader.readAsArrayBuffer(file);
    });
  });

  describe('SHA-256 Hash Calculation', () => {
    it('should calculate correct SHA-256 hash for known content', (done) => {
      const knownContent = 'Hello, World!';
      const blob = new Blob([knownContent], { type: 'text/plain' });
      const file = new File([blob], 'hello.txt', { type: 'text/plain' });

      const hasher = new jsSHA('SHA-256', 'TEXT', { encoding: 'UTF8' });
      hasher.update(knownContent);
      const expectedHash = hasher.getHash('HEX');

      const request: StoredReagentAnnotationChunkedUploadRequest = {
        file: file,
        storedReagentId: 1,
        folderId: 1
      };

      service.completeStoredReagentAnnotationUploadWithFile(request).subscribe({
        next: () => done(),
        error: done.fail
      });

      const req = httpMock.expectOne('/api/upload/stored-reagent-annotation-chunks/');
      const formData = req.request.body as FormData;
      const actualHash = formData.get('sha256') as string;

      expect(actualHash).toBe(expectedHash);

      req.flush({ storedReagentAnnotationId: 1, message: 'ok' });
    });
  });
});
