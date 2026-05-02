import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService, CUPCAKE_CORE_CONFIG } from './auth';
import { Router } from '@angular/router';

const MOCK_CONFIG = { apiUrl: 'https://api.test.com' };

function makeExpiredJwt(): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 3600, user_id: 1, username: 'test' }));
  return `${header}.${payload}.signature`;
}

function makeValidJwt(): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600, user_id: 1, username: 'test' }));
  return `${header}.${payload}.signature`;
}

function createService(): { service: AuthService; httpMock: HttpTestingController } {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      AuthService,
      { provide: CUPCAKE_CORE_CONFIG, useValue: MOCK_CONFIG },
      { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) },
    ],
  });
  return {
    service: TestBed.inject(AuthService),
    httpMock: TestBed.inject(HttpTestingController),
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    localStorage.clear();
    const spy = jasmine.createSpyObj('Router', ['navigate']);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService,
        { provide: CUPCAKE_CORE_CONFIG, useValue: MOCK_CONFIG },
        { provide: Router, useValue: spy },
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('Authentication State', () => {
    it('should initialize with no authentication when localStorage is empty', () => {
      expect(service.authenticated()).toBe(false);
      expect(service.currentUser()).toBeNull();
    });
  });

  describe('Login', () => {
    it('should login and store access and refresh tokens', (done) => {
      const mockResponse = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        user: { id: 1, username: 'testuser', email: 'test@example.com', is_staff: false, is_superuser: false },
      };

      service.login('testuser', 'testpass').subscribe(() => {
        expect(service.authenticated()).toBe(true);
        expect(localStorage.getItem('ccvAccessToken')).toBe('access-token');
        expect(localStorage.getItem('ccvRefreshToken')).toBe('refresh-token');
        done();
      });

      httpMock.expectOne(`${MOCK_CONFIG.apiUrl}/auth/login/`).flush(mockResponse);
    });
  });

  describe('Logout', () => {
    it('should clear tokens and auth state', () => {
      localStorage.setItem('ccvAccessToken', 'token');
      localStorage.setItem('ccvRefreshToken', 'refresh');
      service['_isAuthenticated'].set(true);

      service.logout().subscribe();
      httpMock.expectOne(`${MOCK_CONFIG.apiUrl}/auth/logout/`).flush({});

      expect(service.authenticated()).toBe(false);
      expect(localStorage.getItem('ccvAccessToken')).toBeNull();
      expect(localStorage.getItem('ccvRefreshToken')).toBeNull();
    });
  });

  describe('tryRefreshToken - token rotation (ROTATE_REFRESH_TOKENS=True)', () => {
    it('should store new access token and new refresh token when backend rotates', (done) => {
      localStorage.setItem('ccvRefreshToken', 'old-refresh-token');

      service.tryRefreshToken().subscribe(response => {
        expect(localStorage.getItem('ccvAccessToken')).toBe('new-access-token');
        expect(localStorage.getItem('ccvRefreshToken')).toBe('new-refresh-token');
        expect(response.access).toBe('new-access-token');
        expect(response.refresh).toBe('new-refresh-token');
        expect(service.authenticated()).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${MOCK_CONFIG.apiUrl}/auth/token/refresh/`);
      expect(req.request.body).toEqual({ refresh: 'old-refresh-token' });
      req.flush({ access: 'new-access-token', refresh: 'new-refresh-token' });

      httpMock.expectOne(`${MOCK_CONFIG.apiUrl}/auth/profile/`).flush({
        user: { id: 1, username: 'test', email: 'test@test.com', is_staff: false, is_superuser: false }
      });
    });

    it('should clear both tokens when refresh is rejected by backend (blacklisted token)', (done) => {
      localStorage.setItem('ccvAccessToken', makeExpiredJwt());
      localStorage.setItem('ccvRefreshToken', 'blacklisted-refresh-token');
      service['_isAuthenticated'].set(true);

      service.tryRefreshToken().subscribe({
        error: () => {
          expect(localStorage.getItem('ccvAccessToken')).toBeNull();
          expect(localStorage.getItem('ccvRefreshToken')).toBeNull();
          expect(service.authenticated()).toBe(false);
          done();
        }
      });

      httpMock.expectOne(`${MOCK_CONFIG.apiUrl}/auth/token/refresh/`).flush(
        { detail: 'Token is blacklisted' },
        { status: 401, statusText: 'Unauthorized' }
      );
    });

    it('should return error immediately without HTTP request when no refresh token in localStorage', (done) => {
      service.tryRefreshToken().subscribe({
        error: (e: Error) => {
          expect(e.message).toBe('No refresh token available');
          done();
        }
      });

      httpMock.expectNone(`${MOCK_CONFIG.apiUrl}/auth/token/refresh/`);
    });
  });

  describe('tryRefreshToken - concurrent call deduplication', () => {
    it('should make only one HTTP request when called multiple times while in-flight', () => {
      localStorage.setItem('ccvRefreshToken', 'valid-refresh-token');

      let result1: any;
      let result2: any;
      let result3: any;

      service.tryRefreshToken().subscribe(r => result1 = r);
      service.tryRefreshToken().subscribe(r => result2 = r);
      service.tryRefreshToken().subscribe(r => result3 = r);

      const requests = httpMock.match(`${MOCK_CONFIG.apiUrl}/auth/token/refresh/`);
      expect(requests.length).toBe(1, 'only one HTTP refresh request should be made');

      requests[0].flush({ access: 'new-access', refresh: 'new-refresh' });

      httpMock.expectOne(`${MOCK_CONFIG.apiUrl}/auth/profile/`).flush({
        user: { id: 1, username: 'test', email: 'test@test.com', is_staff: false, is_superuser: false }
      });

      expect(result1.access).toBe('new-access');
      expect(result2.access).toBe('new-access');
      expect(result3.access).toBe('new-access');
      expect(localStorage.getItem('ccvRefreshToken')).toBe('new-refresh');
    });

    it('should not use the blacklisted old refresh token on a second concurrent call', () => {
      localStorage.setItem('ccvRefreshToken', 'old-refresh-token');

      service.tryRefreshToken().subscribe();
      service.tryRefreshToken().subscribe();

      const requests = httpMock.match(`${MOCK_CONFIG.apiUrl}/auth/token/refresh/`);
      expect(requests.length).toBe(1);

      requests[0].flush({ access: 'new-access', refresh: 'rotated-refresh-token' });

      httpMock.expectOne(`${MOCK_CONFIG.apiUrl}/auth/profile/`).flush({
        user: { id: 1, username: 'test', email: 'test@test.com', is_staff: false, is_superuser: false }
      });

      expect(localStorage.getItem('ccvRefreshToken')).toBe('rotated-refresh-token');
    });
  });

  describe('initializeAuthState on page refresh', () => {
    it('should call tryRefreshToken when access token is expired but refresh token exists', () => {
      localStorage.clear();
      localStorage.setItem('ccvAccessToken', makeExpiredJwt());
      localStorage.setItem('ccvRefreshToken', 'valid-refresh-token');

      TestBed.resetTestingModule();
      localStorage.setItem('ccvAccessToken', makeExpiredJwt());
      localStorage.setItem('ccvRefreshToken', 'valid-refresh-token');

      const { service: freshService, httpMock: freshMock } = createService();

      const refreshReq = freshMock.expectOne(`${MOCK_CONFIG.apiUrl}/auth/token/refresh/`);
      expect(refreshReq.request.body).toEqual({ refresh: 'valid-refresh-token' });

      refreshReq.flush({ access: makeValidJwt(), refresh: 'new-refresh-token' });

      freshMock.expectOne(`${MOCK_CONFIG.apiUrl}/auth/profile/`).flush({
        user: { id: 1, username: 'test', email: 'test@test.com', is_staff: false, is_superuser: false }
      });

      expect(freshService.authenticated()).toBe(true);
      expect(localStorage.getItem('ccvRefreshToken')).toBe('new-refresh-token');

      freshMock.verify();
      localStorage.clear();
    });

    it('should remain unauthenticated when both tokens are absent', () => {
      localStorage.clear();
      TestBed.resetTestingModule();

      const { service: freshService, httpMock: freshMock } = createService();

      freshMock.expectNone(`${MOCK_CONFIG.apiUrl}/auth/token/refresh/`);
      expect(freshService.authenticated()).toBe(false);

      freshMock.verify();
    });

    it('should not call tryRefreshToken when access token is still valid', () => {
      const validJwt = makeValidJwt();
      localStorage.setItem('ccvAccessToken', validJwt);
      localStorage.setItem('ccvRefreshToken', 'valid-refresh-token');

      TestBed.resetTestingModule();
      localStorage.setItem('ccvAccessToken', validJwt);
      localStorage.setItem('ccvRefreshToken', 'valid-refresh-token');

      const { service: freshService, httpMock: freshMock } = createService();

      freshMock.expectNone(`${MOCK_CONFIG.apiUrl}/auth/token/refresh/`);
      expect(freshService.authenticated()).toBe(true);

      freshMock.expectOne(`${MOCK_CONFIG.apiUrl}/auth/profile/`).flush({
        user: { id: 1, username: 'test', email: 'test@test.com', is_staff: false, is_superuser: false }
      });

      freshMock.verify();
      localStorage.clear();
    });
  });

  describe('Signals', () => {
    it('should reflect current user via signal', () => {
      const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' } as any;
      service['_currentUser'].set(mockUser);
      expect(service.currentUser()).toEqual(mockUser);
    });
  });
});
