import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService, CUPCAKE_CORE_CONFIG } from './auth';
import { Router } from '@angular/router';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;
  const mockConfig = {
    apiUrl: 'https://api.test.com'
  };

  beforeEach(() => {
    const spy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService,
        { provide: CUPCAKE_CORE_CONFIG, useValue: mockConfig },
        { provide: Router, useValue: spy }
      ]
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
    it('should initialize with no authentication', () => {
      expect(service.authenticated()).toBe(false);
      expect(service.currentUser()).toBeNull();
    });
  });

  describe('Login', () => {
    it('should login successfully and store tokens', (done) => {
      const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' } as any;
      const mockResponse = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: mockUser
      };

      service.login('testuser', 'testpass').subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(service.authenticated()).toBe(true);
        expect(service.currentUser()?.id).toBe(mockUser.id);
        expect(localStorage.getItem('ccvAccessToken')).toBe('access-token');
        expect(localStorage.getItem('ccvRefreshToken')).toBe('refresh-token');
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/auth/login/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ username: 'testuser', password: 'testpass', remember_me: false });
      req.flush(mockResponse);
    });
  });

  describe('Logout', () => {
    it('should logout and clear authentication state', () => {
      localStorage.setItem('ccvAccessToken', 'token');
      localStorage.setItem('ccvRefreshToken', 'refresh');
      service['_currentUser'].set({ id: 1, username: 'test', email: 'test@test.com' } as any);
      service['_isAuthenticated'].set(true);

      service.logout().subscribe();

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/auth/logout/`);
      req.flush({});

      expect(service.authenticated()).toBe(false);
      expect(service.currentUser()).toBeNull();
      expect(localStorage.getItem('ccvAccessToken')).toBeNull();
      expect(localStorage.getItem('ccvRefreshToken')).toBeNull();
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
