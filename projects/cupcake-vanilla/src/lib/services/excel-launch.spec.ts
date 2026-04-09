import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ExcelLaunchService } from './excel-launch';
import { ExcelLaunchCode, ExcelLaunchClaimResponse } from '../models';

describe('ExcelLaunchService', () => {
  let service: ExcelLaunchService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ExcelLaunchService
      ]
    });
    service = TestBed.inject(ExcelLaunchService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('createLaunchCode', () => {
    it('should create a launch code', () => {
      const mockResponse: ExcelLaunchCode = {
        code: 'ABC123XYZ',
        tableId: 123,
        tableName: 'Test Table',
        expiresIn: 300
      };

      service.createLaunchCode({ tableId: 123, tableName: 'Test Table' }).subscribe(result => {
        expect(result).toEqual(mockResponse);
        expect(result.code).toBe('ABC123XYZ');
        expect(result.expiresIn).toBe(300);
      });

      const req = httpMock.expectOne(req => req.url.includes('/excel-launch/'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ tableId: 123, tableName: 'Test Table' });
      req.flush(mockResponse);
    });

    it('should handle error when table not found', () => {
      service.createLaunchCode({ tableId: 999 }).subscribe({
        error: (err) => {
          expect(err.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(req => req.url.includes('/excel-launch/'));
      req.flush({ detail: 'Table not found' }, { status: 404, statusText: 'Not Found' });
    });

    it('should handle error when user has no access', () => {
      service.createLaunchCode({ tableId: 123 }).subscribe({
        error: (err) => {
          expect(err.status).toBe(403);
        }
      });

      const req = httpMock.expectOne(req => req.url.includes('/excel-launch/'));
      req.flush({ detail: 'You do not have access to this table' }, { status: 403, statusText: 'Forbidden' });
    });
  });

  describe('claimLaunchCode', () => {
    it('should claim a launch code and return tokens', () => {
      const mockResponse: ExcelLaunchClaimResponse = {
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
        tableId: 123,
        tableName: 'Test Table',
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com'
        }
      };

      service.claimLaunchCode('ABC123XYZ').subscribe(result => {
        expect(result).toEqual(mockResponse);
        expect(result.accessToken).toBe('access-token-123');
        expect(result.tableId).toBe(123);
        expect(result.user.username).toBe('testuser');
      });

      const req = httpMock.expectOne(req => req.url.includes('/excel-launch/claim/'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ code: 'ABC123XYZ' });
      req.flush(mockResponse);
    });

    it('should send code in request body', () => {
      service.claimLaunchCode('TESTCODE').subscribe();

      const req = httpMock.expectOne(req => req.url.includes('/excel-launch/claim/'));
      expect(req.request.body).toEqual({ code: 'TESTCODE' });
      req.flush({});
    });

    it('should handle invalid code error', () => {
      service.claimLaunchCode('INVALID').subscribe({
        error: (err) => {
          expect(err.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(req => req.url.includes('/excel-launch/claim/'));
      req.flush({ detail: 'Invalid launch code' }, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle expired code error', () => {
      service.claimLaunchCode('EXPIRED').subscribe({
        error: (err) => {
          expect(err.status).toBe(410);
        }
      });

      const req = httpMock.expectOne(req => req.url.includes('/excel-launch/claim/'));
      req.flush({ detail: 'This launch code has expired' }, { status: 410, statusText: 'Gone' });
    });
  });
});
