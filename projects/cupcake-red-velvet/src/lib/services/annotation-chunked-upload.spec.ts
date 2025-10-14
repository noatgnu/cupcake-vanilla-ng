import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import jsSHA from 'jssha';

import { AnnotationChunkedUploadService } from './annotation-chunked-upload';
import {
  AnnotationChunkedUploadCompletionResponse,
  StepAnnotationChunkedUploadRequest,
  SessionAnnotationFolderChunkedUploadRequest
} from '../models';

describe('AnnotationChunkedUploadService (Red Velvet)', () => {
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

  describe('Step Annotation Upload', () => {
    it('should upload small file (< 1MB) with SHA-256 checksum', (done) => {
      const fileContent = 'protocol step test file';
      const blob = new Blob([fileContent], { type: 'text/plain' });
      const file = new File([blob], 'step-annotation.txt', { type: 'text/plain' });

      const hasher = new jsSHA('SHA-256', 'ARRAYBUFFER');
      const reader = new FileReader();
      reader.onload = () => {
        hasher.update(reader.result as ArrayBuffer);
        const expectedHash = hasher.getHash('HEX');

        service.uploadStepAnnotationFileInChunks(
          file,
          10,
          5,
          1024 * 1024,
          {
            folderId: 2,
            annotation: 'step annotation',
            annotationType: 'file'
          }
        ).subscribe({
          next: (response) => {
            expect(response).toBeDefined();
            expect(response.stepAnnotationId).toBe(123);
            expect(response.message).toBe('Upload complete');
            done();
          },
          error: done.fail
        });

        const req = httpMock.expectOne('/api/upload/step-annotation-chunks/');
        expect(req.request.method).toBe('POST');

        const formData = req.request.body as FormData;
        expect(formData.get('file')).toBe(file);
        expect(formData.get('filename')).toBe('step-annotation.txt');
        expect(formData.get('session_id')).toBe('10');
        expect(formData.get('step_id')).toBe('5');
        expect(formData.get('folder_id')).toBe('2');
        expect(formData.get('annotation')).toBe('step annotation');
        expect(formData.get('annotation_type')).toBe('file');
        expect(formData.get('sha256')).toBe(expectedHash);

        const mockResponse: AnnotationChunkedUploadCompletionResponse = {
          stepAnnotationId: 123,
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
      const blob = new Blob([fileContent], { type: 'application/pdf' });
      const file = new File([blob], 'large-step-doc.pdf', { type: 'application/pdf' });

      const hasher = new jsSHA('SHA-256', 'ARRAYBUFFER');
      const reader = new FileReader();
      reader.onload = () => {
        hasher.update(reader.result as ArrayBuffer);
        const expectedHash = hasher.getHash('HEX');

        service.uploadStepAnnotationFileInChunks(
          file,
          15,
          8,
          chunkSize,
          {
            folderId: 3,
            annotation: 'large step doc',
            annotationType: 'document'
          }
        ).subscribe({
          next: (response) => {
            expect(response).toBeDefined();
            expect(response.stepAnnotationId).toBe(456);
            done();
          },
          error: done.fail
        });

        const chunk1Req = httpMock.expectOne('/api/upload/step-annotation-chunks/');
        expect(chunk1Req.request.method).toBe('POST');
        expect(chunk1Req.request.headers.get('Content-Range')).toBe(`bytes 0-${chunkSize - 1}/${fileSize}`);
        chunk1Req.flush({ id: 'step-upload-456', offset: chunkSize });

        const chunk2Req = httpMock.expectOne('/api/upload/step-annotation-chunks/step-upload-456/');
        expect(chunk2Req.request.method).toBe('PUT');
        expect(chunk2Req.request.headers.get('Content-Range')).toBe(`bytes ${chunkSize}-${fileSize - 1}/${fileSize}`);
        chunk2Req.flush({ id: 'step-upload-456', offset: fileSize });

        const completeReq = httpMock.expectOne('/api/upload/step-annotation-chunks/step-upload-456/');
        expect(completeReq.request.method).toBe('POST');
        const completionFormData = completeReq.request.body as FormData;
        expect(completionFormData.get('sha256')).toBe(expectedHash);
        expect(completionFormData.get('session_id')).toBe('15');
        expect(completionFormData.get('step_id')).toBe('8');
        expect(completionFormData.get('folder_id')).toBe('3');
        expect(completionFormData.get('annotation')).toBe('large step doc');

        const mockResponse: AnnotationChunkedUploadCompletionResponse = {
          stepAnnotationId: 456,
          message: 'Upload complete'
        };
        completeReq.flush(mockResponse);
      };
      reader.readAsArrayBuffer(file);
    });

    it('should include SHA-256 in FormData for completeStepAnnotationUploadWithFile', (done) => {
      const fileContent = 'step content for hash verification';
      const blob = new Blob([fileContent], { type: 'text/plain' });
      const file = new File([blob], 'step-test.txt', { type: 'text/plain' });

      const hasher = new jsSHA('SHA-256', 'ARRAYBUFFER');
      const reader = new FileReader();
      reader.onload = () => {
        hasher.update(reader.result as ArrayBuffer);
        const expectedHash = hasher.getHash('HEX');

        const request: StepAnnotationChunkedUploadRequest = {
          file: file,
          filename: 'step-test.txt',
          sessionId: 10,
          stepId: 5,
          folderId: 2,
          annotation: 'test',
          annotationType: 'file'
        };

        service.completeStepAnnotationUploadWithFile(request).subscribe({
          next: (response) => {
            expect(response.stepAnnotationId).toBe(789);
            done();
          },
          error: done.fail
        });

        const req = httpMock.expectOne('/api/upload/step-annotation-chunks/');
        expect(req.request.method).toBe('POST');

        const formData = req.request.body as FormData;
        const actualHash = formData.get('sha256') as string;
        expect(actualHash).toBeTruthy();
        expect(actualHash).toBe(expectedHash);
        expect(formData.get('session_id')).toBe('10');
        expect(formData.get('step_id')).toBe('5');
        expect(formData.get('folder_id')).toBe('2');

        req.flush({
          stepAnnotationId: 789,
          message: 'Upload complete'
        });
      };
      reader.readAsArrayBuffer(file);
    });
  });

  describe('Session Annotation Folder Upload', () => {
    it('should upload small file (< 1MB) with SHA-256 checksum', (done) => {
      const fileContent = 'session folder test file';
      const blob = new Blob([fileContent], { type: 'image/jpeg' });
      const file = new File([blob], 'session-image.jpg', { type: 'image/jpeg' });

      const hasher = new jsSHA('SHA-256', 'ARRAYBUFFER');
      const reader = new FileReader();
      reader.onload = () => {
        hasher.update(reader.result as ArrayBuffer);
        const expectedHash = hasher.getHash('HEX');

        service.uploadSessionAnnotationFolderFileInChunks(
          file,
          20,
          7,
          1024 * 1024,
          {
            annotation: 'session image',
            annotationType: 'image'
          }
        ).subscribe({
          next: (response) => {
            expect(response).toBeDefined();
            expect(response.sessionAnnotationFolderId).toBe(111);
            done();
          },
          error: done.fail
        });

        const req = httpMock.expectOne('/api/upload/session-annotation-folder-chunks/');
        expect(req.request.method).toBe('POST');

        const formData = req.request.body as FormData;
        expect(formData.get('file')).toBe(file);
        expect(formData.get('filename')).toBe('session-image.jpg');
        expect(formData.get('session_id')).toBe('20');
        expect(formData.get('folder_id')).toBe('7');
        expect(formData.get('annotation')).toBe('session image');
        expect(formData.get('annotation_type')).toBe('image');
        expect(formData.get('sha256')).toBe(expectedHash);

        const mockResponse: AnnotationChunkedUploadCompletionResponse = {
          sessionAnnotationFolderId: 111,
          message: 'Upload complete'
        };
        req.flush(mockResponse);
      };
      reader.readAsArrayBuffer(file);
    });

    it('should upload large file (> 1MB) in chunks with SHA-256 checksum', (done) => {
      const chunkSize = 1024 * 1024;
      const fileSize = chunkSize + 750000;
      const fileContent = new Uint8Array(fileSize);
      for (let i = 0; i < fileSize; i++) {
        fileContent[i] = (i * 3) % 256;
      }
      const blob = new Blob([fileContent], { type: 'video/mp4' });
      const file = new File([blob], 'session-video.mp4', { type: 'video/mp4' });

      const hasher = new jsSHA('SHA-256', 'ARRAYBUFFER');
      const reader = new FileReader();
      reader.onload = () => {
        hasher.update(reader.result as ArrayBuffer);
        const expectedHash = hasher.getHash('HEX');

        service.uploadSessionAnnotationFolderFileInChunks(
          file,
          25,
          9,
          chunkSize,
          {
            annotation: 'session video',
            annotationType: 'video'
          }
        ).subscribe({
          next: (response) => {
            expect(response).toBeDefined();
            expect(response.sessionAnnotationFolderId).toBe(222);
            done();
          },
          error: done.fail
        });

        const chunk1Req = httpMock.expectOne('/api/upload/session-annotation-folder-chunks/');
        expect(chunk1Req.request.method).toBe('POST');
        expect(chunk1Req.request.headers.get('Content-Range')).toBe(`bytes 0-${chunkSize - 1}/${fileSize}`);
        chunk1Req.flush({ id: 'session-upload-222', offset: chunkSize });

        const chunk2Req = httpMock.expectOne('/api/upload/session-annotation-folder-chunks/session-upload-222/');
        expect(chunk2Req.request.method).toBe('PUT');
        expect(chunk2Req.request.headers.get('Content-Range')).toBe(`bytes ${chunkSize}-${fileSize - 1}/${fileSize}`);
        chunk2Req.flush({ id: 'session-upload-222', offset: fileSize });

        const completeReq = httpMock.expectOne('/api/upload/session-annotation-folder-chunks/session-upload-222/');
        expect(completeReq.request.method).toBe('POST');
        const completionFormData = completeReq.request.body as FormData;
        expect(completionFormData.get('sha256')).toBe(expectedHash);
        expect(completionFormData.get('session_id')).toBe('25');
        expect(completionFormData.get('folder_id')).toBe('9');
        expect(completionFormData.get('annotation')).toBe('session video');

        const mockResponse: AnnotationChunkedUploadCompletionResponse = {
          sessionAnnotationFolderId: 222,
          message: 'Upload complete'
        };
        completeReq.flush(mockResponse);
      };
      reader.readAsArrayBuffer(file);
    });

    it('should include SHA-256 in FormData for completeSessionAnnotationFolderUploadWithFile', (done) => {
      const fileContent = 'session folder content for hash check';
      const blob = new Blob([fileContent], { type: 'application/pdf' });
      const file = new File([blob], 'session-doc.pdf', { type: 'application/pdf' });

      const hasher = new jsSHA('SHA-256', 'ARRAYBUFFER');
      const reader = new FileReader();
      reader.onload = () => {
        hasher.update(reader.result as ArrayBuffer);
        const expectedHash = hasher.getHash('HEX');

        const request: SessionAnnotationFolderChunkedUploadRequest = {
          file: file,
          filename: 'session-doc.pdf',
          sessionId: 30,
          folderId: 4,
          annotation: 'session document',
          annotationType: 'document'
        };

        service.completeSessionAnnotationFolderUploadWithFile(request).subscribe({
          next: (response) => {
            expect(response.sessionAnnotationFolderId).toBe(333);
            done();
          },
          error: done.fail
        });

        const req = httpMock.expectOne('/api/upload/session-annotation-folder-chunks/');
        expect(req.request.method).toBe('POST');

        const formData = req.request.body as FormData;
        const actualHash = formData.get('sha256') as string;
        expect(actualHash).toBeTruthy();
        expect(actualHash).toBe(expectedHash);
        expect(formData.get('session_id')).toBe('30');
        expect(formData.get('folder_id')).toBe('4');
        expect(formData.get('annotation')).toBe('session document');

        req.flush({
          sessionAnnotationFolderId: 333,
          message: 'Upload complete'
        });
      };
      reader.readAsArrayBuffer(file);
    });
  });

  describe('SHA-256 Hash Calculation', () => {
    it('should calculate correct SHA-256 hash for known content', (done) => {
      const knownContent = 'Test Protocol Step';
      const blob = new Blob([knownContent], { type: 'text/plain' });
      const file = new File([blob], 'protocol.txt', { type: 'text/plain' });

      const hasher = new jsSHA('SHA-256', 'TEXT', { encoding: 'UTF8' });
      hasher.update(knownContent);
      const expectedHash = hasher.getHash('HEX');

      const request: StepAnnotationChunkedUploadRequest = {
        file: file,
        sessionId: 1,
        stepId: 1
      };

      service.completeStepAnnotationUploadWithFile(request).subscribe({
        next: () => done(),
        error: done.fail
      });

      const req = httpMock.expectOne('/api/upload/step-annotation-chunks/');
      const formData = req.request.body as FormData;
      const actualHash = formData.get('sha256') as string;

      expect(actualHash).toBe(expectedHash);

      req.flush({ stepAnnotationId: 1, message: 'ok' });
    });
  });
});
