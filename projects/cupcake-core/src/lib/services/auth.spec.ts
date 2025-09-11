import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService, CUPCAKE_CORE_CONFIG } from './auth';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;
  const mockConfig = {
    apiUrl: 'https://api.test.com',
    siteName: 'Test Site'
  };

  beforeEach(() => {
    const spy = jasmine.createSpyObj('Router', ['navigate']);
    
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: CUPCAKE_CORE_CONFIG, useValue: mockConfig },
        { provide: Router, useValue: spy }
      ]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('Authentication State', () => {
    it('should initialize with no authentication', () => {
      expect(service.isAuthenticated()).toBe(false);
      expect(service.getCurrentUser()).toBeNull();
    });

    it('should restore authentication from localStorage on init', () => {
      const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' };
      const mockToken = 'mock-jwt-token';
      
      localStorage.setItem('access_token', mockToken);
      localStorage.setItem('current_user', JSON.stringify(mockUser));
      
      // Reinitialize service
      service = new AuthService(TestBed.inject('HttpClient'), mockConfig, routerSpy);
      
      expect(service.isAuthenticated()).toBe(true);
      expect(service.getCurrentUser()).toEqual(mockUser);
      expect(service.getToken()).toBe(mockToken);
    });
  });

  describe('Login', () => {
    it('should login successfully and store tokens', (done) => {
      const credentials = { username: 'testuser', password: 'testpass' };
      const mockResponse = {
        access: 'access-token',
        refresh: 'refresh-token',
        user: { id: 1, username: 'testuser', email: 'test@example.com' }
      };

      service.login(credentials).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(service.isAuthenticated()).toBe(true);
        expect(service.getCurrentUser()).toEqual(mockResponse.user);
        expect(localStorage.getItem('access_token')).toBe('access-token');
        expect(localStorage.getItem('refresh_token')).toBe('refresh-token');
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/auth/login/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(credentials);
      req.flush(mockResponse);
    });

    it('should handle login error', (done) => {
      const credentials = { username: 'baduser', password: 'badpass' };
      const errorResponse = { detail: 'Invalid credentials' };

      service.login(credentials).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.error).toEqual(errorResponse);
          expect(service.isAuthenticated()).toBe(false);
          done();
        }
      );

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/auth/login/`);
      req.flush(errorResponse, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('Logout', () => {
    it('should logout and clear authentication state', () => {
      // Setup authenticated state
      localStorage.setItem('access_token', 'token');
      localStorage.setItem('refresh_token', 'refresh');
      service['currentUserSubject'].next({ id: 1, username: 'test' });

      service.logout();

      expect(service.isAuthenticated()).toBe(false);
      expect(service.getCurrentUser()).toBeNull();
      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
    });

    it('should navigate to login page after logout', () => {
      service.logout();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('Token Refresh', () => {
    it('should refresh access token', (done) => {
      localStorage.setItem('refresh_token', 'refresh-token');
      const mockResponse = { access: 'new-access-token' };

      service.refreshToken().subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(localStorage.getItem('access_token')).toBe('new-access-token');
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/auth/refresh/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ refresh: 'refresh-token' });
      req.flush(mockResponse);
    });

    it('should handle refresh token error', (done) => {
      localStorage.setItem('refresh_token', 'invalid-refresh-token');

      service.refreshToken().subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(401);
          expect(service.isAuthenticated()).toBe(false);
          done();
        }
      );

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/auth/refresh/`);
      req.flush({ detail: 'Token is invalid' }, { status: 401, statusText: 'Unauthorized' });
    });

    it('should return null when no refresh token exists', (done) => {
      service.refreshToken().subscribe(response => {
        expect(response).toBeNull();
        done();
      });

      httpMock.expectNone(`${mockConfig.apiUrl}/auth/refresh/`);
    });
  });

  describe('User Profile', () => {
    it('should get user profile', (done) => {
      const mockProfile = { 
        user: { id: 1, username: 'testuser', email: 'test@example.com', firstName: 'Test', lastName: 'User' }
      };

      service.getUserProfile().subscribe(profile => {
        expect(profile).toEqual(mockProfile);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/auth/profile/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockProfile);
    });

    it('should update current user when profile is fetched', (done) => {
      const mockProfile = { 
        user: { id: 1, username: 'testuser', email: 'test@example.com' }
      };

      service.getUserProfile().subscribe(() => {
        expect(service.getCurrentUser()).toEqual(mockProfile.user);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/auth/profile/`);
      req.flush(mockProfile);
    });
  });

  describe('Observable Streams', () => {
    it('should emit authentication state changes', (done) => {
      let emissionCount = 0;
      const expectedValues = [false, true, false];

      service.isAuthenticated$.subscribe(isAuth => {
        expect(isAuth).toBe(expectedValues[emissionCount]);
        emissionCount++;
        
        if (emissionCount === 3) {
          done();
        }
      });

      // Simulate login
      service['currentUserSubject'].next({ id: 1, username: 'test' });
      
      // Simulate logout
      service['currentUserSubject'].next(null);
    });

    it('should emit current user changes', (done) => {
      const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' };
      
      service.currentUser$.subscribe(user => {
        if (user) {
          expect(user).toEqual(mockUser);
          done();
        }
      });

      service['currentUserSubject'].next(mockUser);
    });
  });

  describe('Token Management', () => {
    it('should return stored token', () => {
      localStorage.setItem('access_token', 'test-token');
      expect(service.getToken()).toBe('test-token');
    });

    it('should return null when no token stored', () => {
      expect(service.getToken()).toBeNull();
    });

    it('should check token expiration', () => {
      // Mock expired token (expires in past)
      const expiredToken = btoa(JSON.stringify({ 
        header: {}, 
        payload: { exp: Math.floor(Date.now() / 1000) - 3600 }
      }));
      
      expect(service.isTokenExpired(expiredToken)).toBe(true);
      
      // Mock valid token (expires in future)  
      const validToken = btoa(JSON.stringify({
        header: {},
        payload: { exp: Math.floor(Date.now() / 1000) + 3600 }
      }));
      
      expect(service.isTokenExpired(validToken)).toBe(false);
    });

    it('should handle invalid token format', () => {
      expect(service.isTokenExpired('invalid-token')).toBe(true);
      expect(service.isTokenExpired('')).toBe(true);
      expect(service.isTokenExpired(null)).toBe(true);
    });
  });
});