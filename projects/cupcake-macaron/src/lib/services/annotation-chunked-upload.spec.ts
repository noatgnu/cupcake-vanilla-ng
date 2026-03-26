import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import jsSHA from 'jssha';
import { CUPCAKE_CORE_CONFIG, SiteConfigService } from '@noatgnu/cupcake-core';
import { firstValueFrom } from 'rxjs';

import { AnnotationChunkedUploadService } from './annotation-chunked-upload';
import {
  AnnotationChunkedUploadCompletionResponse,
  InstrumentAnnotationChunkedUploadRequest,
  StoredReagentAnnotationChunkedUploadRequest
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

describe('AnnotationChunkedUploadService', () => {
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

  describe('Instrument Annotation Upload', () => {
    it('should upload small file (< 1MB) with SHA-256 checksum', async () => {
      const fileContent = 'test file content';
      const blob = new Blob([fileContent], { type: 'text/plain' });
      const file = new File([blob], 'test.txt', { type: 'text/plain' });
      const expectedHash = computeHash(fileContent);

      const responsePromise = firstValueFrom(service.uploadInstrumentAnnotationFileInChunks(
        file,
        1,
        2,
        1024 * 1024,
        {
          annotation: 'test annotation',
          annotationType: 'file'
        }
      ));

      await waitForMicrotasks();

      const req = httpMock.expectOne('/api/upload/instrument-annotation-chunks/');
      expect(req.request.method).toBe('POST');

      const formData = req.request.body as FormData;
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

      const response = await responsePromise;
      expect(response).toBeDefined();
      expect(response.instrumentAnnotationId).toBe(123);
      expect(response.message).toBe('Upload complete');
    });

    it('should include SHA-256 in FormData for completeInstrumentAnnotationUploadWithFile', async () => {
      const fileContent = 'test content for hash verification';
      const blob = new Blob([fileContent], { type: 'text/plain' });
      const file = new File([blob], 'test.txt', { type: 'text/plain' });
      const expectedHash = computeHash(fileContent);

      const request: InstrumentAnnotationChunkedUploadRequest = {
        file: file,
        filename: 'test.txt',
        instrumentId: 1,
        folderId: 2,
        annotation: 'test',
        annotationType: 'file'
      };

      const responsePromise = firstValueFrom(service.completeInstrumentAnnotationUploadWithFile(request));

      await waitForMicrotasks();

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

      const response = await responsePromise;
      expect(response).toBeDefined();
      expect(response.instrumentAnnotationId).toBe(789);
      expect(response.message).toBe('Upload complete');
    });
  });

  describe('Stored Reagent Annotation Upload', () => {
    it('should upload small file (< 1MB) with SHA-256 checksum', async () => {
      const fileContent = 'stored reagent test file';
      const blob = new Blob([fileContent], { type: 'text/plain' });
      const file = new File([blob], 'reagent-test.txt', { type: 'text/plain' });
      const expectedHash = computeHash(fileContent);

      const responsePromise = firstValueFrom(service.uploadStoredReagentAnnotationFileInChunks(
        file,
        1,
        2,
        1024 * 1024,
        {
          annotation: 'reagent annotation',
          annotationType: 'file'
        }
      ));

      await waitForMicrotasks();

      const req = httpMock.expectOne('/api/upload/stored-reagent-annotation-chunks/');
      expect(req.request.method).toBe('POST');

      const formData = req.request.body as FormData;
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

      const response = await responsePromise;
      expect(response).toBeDefined();
      expect(response.storedReagentAnnotationId).toBe(111);
      expect(response.message).toBe('Upload complete');
    });

    it('should include SHA-256 in FormData for completeStoredReagentAnnotationUploadWithFile', async () => {
      const fileContent = 'stored reagent content for hash check';
      const blob = new Blob([fileContent], { type: 'application/pdf' });
      const file = new File([blob], 'msds.pdf', { type: 'application/pdf' });
      const expectedHash = computeHash(fileContent);

      const request: StoredReagentAnnotationChunkedUploadRequest = {
        file: file,
        filename: 'msds.pdf',
        storedReagentId: 1,
        folderId: 2,
        annotation: 'MSDS document',
        annotationType: 'document'
      };

      const responsePromise = firstValueFrom(service.completeStoredReagentAnnotationUploadWithFile(request));

      await waitForMicrotasks();

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

      const response = await responsePromise;
      expect(response).toBeDefined();
      expect(response.storedReagentAnnotationId).toBe(999);
      expect(response.message).toBe('Upload complete');
    });
  });

  describe('SHA-256 Hash Calculation', () => {
    it('should calculate correct SHA-256 hash for known content', async () => {
      const knownContent = 'Hello, World!';
      const blob = new Blob([knownContent], { type: 'text/plain' });
      const file = new File([blob], 'hello.txt', { type: 'text/plain' });
      const expectedHash = computeHash(knownContent);

      const request: StoredReagentAnnotationChunkedUploadRequest = {
        file: file,
        storedReagentId: 1,
        folderId: 1
      };

      const responsePromise = firstValueFrom(service.completeStoredReagentAnnotationUploadWithFile(request));

      await waitForMicrotasks();

      const req = httpMock.expectOne('/api/upload/stored-reagent-annotation-chunks/');
      const formData = req.request.body as FormData;
      const actualHash = formData.get('sha256') as string;

      expect(actualHash).toBe(expectedHash);

      req.flush({ storedReagentAnnotationId: 1, message: 'ok' });

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
