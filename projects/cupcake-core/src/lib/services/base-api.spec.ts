import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BaseApiService } from './base-api';
import { CUPCAKE_CORE_CONFIG } from './auth';

describe('BaseApiService', () => {
  let service: BaseApiService;
  let httpMock: HttpTestingController;
  const mockConfig = {
    apiUrl: 'https://api.test.com',
    siteName: 'Test Site'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        BaseApiService,
        { provide: CUPCAKE_CORE_CONFIG, useValue: mockConfig }
      ]
    });
    service = TestBed.inject(BaseApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Case Transformation', () => {
    it('should transform camelCase to snake_case', () => {
      const input = {
        firstName: 'John',
        lastName: 'Doe',
        userSettings: {
          emailNotifications: true,
          darkMode: false
        },
        userIds: [1, 2, 3]
      };

      const expectedOutput = {
        first_name: 'John',
        last_name: 'Doe',
        user_settings: {
          email_notifications: true,
          dark_mode: false
        },
        user_ids: [1, 2, 3]
      };

      const result = service['transformToSnakeCase'](input);
      expect(result).toEqual(expectedOutput);
    });

    it('should transform snake_case to camelCase', () => {
      const input = {
        first_name: 'John',
        last_name: 'Doe',
        user_settings: {
          email_notifications: true,
          dark_mode: false
        },
        user_ids: [1, 2, 3]
      };

      const expectedOutput = {
        firstName: 'John',
        lastName: 'Doe',
        userSettings: {
          emailNotifications: true,
          darkMode: false
        },
        userIds: [1, 2, 3]
      };

      const result = service['transformToCamelCase'](input);
      expect(result).toEqual(expectedOutput);
    });

    it('should handle null and primitive values', () => {
      expect(service['transformToSnakeCase'](null)).toBeNull();
      expect(service['transformToSnakeCase']('string')).toBe('string');
      expect(service['transformToSnakeCase'](123)).toBe(123);
      expect(service['transformToSnakeCase'](true)).toBe(true);
    });

    it('should handle arrays correctly', () => {
      const input = [
        { userName: 'john' },
        { userEmail: 'john@test.com' }
      ];
      const expected = [
        { user_name: 'john' },
        { user_email: 'john@test.com' }
      ];
      expect(service['transformToSnakeCase'](input)).toEqual(expected);
    });
  });

  describe('HTTP Methods', () => {
    it('should make GET request and transform response to camelCase', () => {
      const mockResponse = { first_name: 'John', last_name: 'Doe' };
      const expectedResult = { firstName: 'John', lastName: 'Doe' };

      service['get']<any>('/test').subscribe(result => {
        expect(result).toEqual(expectedResult);
      });

      const req = httpMock.expectOne('/test');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should make POST request with transformed body and transform response', () => {
      const requestBody = { firstName: 'John', lastName: 'Doe' };
      const expectedRequestBody = { first_name: 'John', last_name: 'Doe' };
      const mockResponse = { user_id: 123, first_name: 'John' };
      const expectedResult = { userId: 123, firstName: 'John' };

      service['post']<any>('/test', requestBody).subscribe(result => {
        expect(result).toEqual(expectedResult);
      });

      const req = httpMock.expectOne('/test');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(expectedRequestBody);
      req.flush(mockResponse);
    });

    it('should make PUT request with transformed body', () => {
      const requestBody = { firstName: 'John', lastName: 'Smith' };
      const expectedRequestBody = { first_name: 'John', last_name: 'Smith' };
      const mockResponse = { user_id: 123, first_name: 'John' };

      service['put']<any>('/test/123', requestBody).subscribe();

      const req = httpMock.expectOne('/test/123');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(expectedRequestBody);
      req.flush(mockResponse);
    });

    it('should make PATCH request with transformed body', () => {
      const requestBody = { firstName: 'John' };
      const expectedRequestBody = { first_name: 'John' };
      const mockResponse = { user_id: 123, first_name: 'John' };

      service['patch']<any>('/test/123', requestBody).subscribe();

      const req = httpMock.expectOne('/test/123');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(expectedRequestBody);
      req.flush(mockResponse);
    });

    it('should make DELETE request and transform response', () => {
      const mockResponse = { success: true, deleted_count: 1 };
      const expectedResult = { success: true, deletedCount: 1 };

      service['delete']<any>('/test/123').subscribe(result => {
        expect(result).toEqual(expectedResult);
      });

      const req = httpMock.expectOne('/test/123');
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });

  describe('HTTP Params Builder', () => {
    it('should build HttpParams with snake_case transformation', () => {
      const params = {
        pageSize: 10,
        sortOrder: 'desc',
        isActive: true,
        userId: 123
      };

      const httpParams = service['buildHttpParams'](params);
      
      expect(httpParams.get('page_size')).toBe('10');
      expect(httpParams.get('sort_order')).toBe('desc');
      expect(httpParams.get('is_active')).toBe('true');
      expect(httpParams.get('user_id')).toBe('123');
    });

    it('should ignore null and undefined values', () => {
      const params = {
        validParam: 'test',
        nullParam: null,
        undefinedParam: undefined
      };

      const httpParams = service['buildHttpParams'](params);
      
      expect(httpParams.get('valid_param')).toBe('test');
      expect(httpParams.get('null_param')).toBeNull();
      expect(httpParams.get('undefined_param')).toBeNull();
    });

    it('should handle empty params object', () => {
      const httpParams = service['buildHttpParams']({});
      expect(httpParams.keys().length).toBe(0);
    });

    it('should handle null params', () => {
      const httpParams = service['buildHttpParams'](null);
      expect(httpParams.keys().length).toBe(0);
    });
  });
});