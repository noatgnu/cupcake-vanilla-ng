import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import jsSHA from 'jssha';
import { CUPCAKE_CORE_CONFIG, SiteConfigService } from '@noatgnu/cupcake-core';
import { firstValueFrom } from 'rxjs';

import { AnnotationChunkedUploadService } from './annotation-chunked-upload';
import {
  AnnotationChunkedUploadCompletionResponse,
  StepAnnotationChunkedUploadRequest,
  SessionAnnotationFolderChunkedUploadRequest
} from '../models';

const mockSiteConfigService = {
  validateFileSize: jasmine.createSpy('validateFileSize').and.returnValue({ valid: true }),
  getMaxChunkedUploadSize: jasmine.createSpy('getMaxChunkedUploadSize').and.returnValue(2147483648),
  getMaxUploadSize: jasmine.createSpy('getMaxUploadSize').and.returnValue(104857600),
  formatFileSize: jasmine.createSpy('formatFileSize').and.returnValue('100 MB')
};

function computeHash(content: string): string {
  const hasher = new jsSHA('SHA-256', 'TEXT', { encoding: 'UTF8' });
  hasher.update(content);
  return hasher.getHash('HEX');
}

function waitForMicrotasks(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 10));
}

describe('AnnotationChunkedUploadService (Red Velvet)', () => {
  let service: AnnotationChunkedUploadService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    mockSiteConfigService.validateFileSize.calls.reset();
    mockSiteConfigService.getMaxChunkedUploadSize.calls.reset();
    mockSiteConfigService.getMaxUploadSize.calls.reset();
    mockSiteConfigService.formatFileSize.calls.reset();

    TestBed.configureTestingModule({
      providers: [
        AnnotationChunkedUploadService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: '/api' } },
        { provide: SiteConfigService, useValue: mockSiteConfigService }
      ]
    });
    service = TestBed.inject(AnnotationChunkedUploadService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Step Annotation Upload', () => {
    it('should upload small file (< 1MB) with SHA-256 checksum', async () => {
      const fileContent = 'protocol step test file';
      const blob = new Blob([fileContent], { type: 'text/plain' });
      const file = new File([blob], 'step-annotation.txt', { type: 'text/plain' });
      const expectedHash = computeHash(fileContent);

      const responsePromise = firstValueFrom(service.uploadStepAnnotationFileInChunks(
        file,
        10,
        5,
        1024 * 1024,
        {
          folderId: 2,
          annotation: 'step annotation',
          annotationType: 'file'
        }
      ));

      await waitForMicrotasks();

      const req = httpMock.expectOne('/api/upload/step-annotation-chunks/');
      expect(req.request.method).toBe('POST');

      const formData = req.request.body as FormData;
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

      const response = await responsePromise;
      expect(response).toBeDefined();
      expect(response.stepAnnotationId).toBe(123);
      expect(response.message).toBe('Upload complete');
    });

    it('should include SHA-256 in FormData for completeStepAnnotationUploadWithFile', async () => {
      const fileContent = 'step content for hash verification';
      const blob = new Blob([fileContent], { type: 'text/plain' });
      const file = new File([blob], 'step-test.txt', { type: 'text/plain' });
      const expectedHash = computeHash(fileContent);

      const request: StepAnnotationChunkedUploadRequest = {
        file: file,
        filename: 'step-test.txt',
        sessionId: 10,
        stepId: 5,
        folderId: 2,
        annotation: 'test',
        annotationType: 'file'
      };

      const responsePromise = firstValueFrom(service.completeStepAnnotationUploadWithFile(request));

      await waitForMicrotasks();

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

      const response = await responsePromise;
      expect(response).toBeDefined();
      expect(response.stepAnnotationId).toBe(789);
    });
  });

  describe('Session Annotation Folder Upload', () => {
    it('should upload small file (< 1MB) with SHA-256 checksum', async () => {
      const fileContent = 'session folder test file';
      const blob = new Blob([fileContent], { type: 'image/jpeg' });
      const file = new File([blob], 'session-image.jpg', { type: 'image/jpeg' });
      const expectedHash = computeHash(fileContent);

      const responsePromise = firstValueFrom(service.uploadSessionAnnotationFolderFileInChunks(
        file,
        20,
        7,
        1024 * 1024,
        {
          annotation: 'session image',
          annotationType: 'image'
        }
      ));

      await waitForMicrotasks();

      const req = httpMock.expectOne('/api/upload/session-annotation-folder-chunks/');
      expect(req.request.method).toBe('POST');

      const formData = req.request.body as FormData;
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

      const response = await responsePromise;
      expect(response).toBeDefined();
      expect(response.sessionAnnotationFolderId).toBe(111);
    });

    it('should include SHA-256 in FormData for completeSessionAnnotationFolderUploadWithFile', async () => {
      const fileContent = 'session folder content for hash check';
      const blob = new Blob([fileContent], { type: 'application/pdf' });
      const file = new File([blob], 'session-doc.pdf', { type: 'application/pdf' });
      const expectedHash = computeHash(fileContent);

      const request: SessionAnnotationFolderChunkedUploadRequest = {
        file: file,
        filename: 'session-doc.pdf',
        sessionId: 30,
        folderId: 4,
        annotation: 'session document',
        annotationType: 'document'
      };

      const responsePromise = firstValueFrom(service.completeSessionAnnotationFolderUploadWithFile(request));

      await waitForMicrotasks();

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

      const response = await responsePromise;
      expect(response).toBeDefined();
      expect(response.sessionAnnotationFolderId).toBe(333);
    });
  });

  describe('SHA-256 Hash Calculation', () => {
    it('should calculate correct SHA-256 hash for known content', async () => {
      const knownContent = 'Test Protocol Step';
      const blob = new Blob([knownContent], { type: 'text/plain' });
      const file = new File([blob], 'protocol.txt', { type: 'text/plain' });
      const expectedHash = computeHash(knownContent);

      const request: StepAnnotationChunkedUploadRequest = {
        file: file,
        sessionId: 1,
        stepId: 1
      };

      const responsePromise = firstValueFrom(service.completeStepAnnotationUploadWithFile(request));

      await waitForMicrotasks();

      const req = httpMock.expectOne('/api/upload/step-annotation-chunks/');
      const formData = req.request.body as FormData;
      const actualHash = formData.get('sha256') as string;

      expect(actualHash).toBe(expectedHash);

      req.flush({ stepAnnotationId: 1, message: 'ok' });

      const response = await responsePromise;
      expect(response).toBeDefined();
    });
  });

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });
});
