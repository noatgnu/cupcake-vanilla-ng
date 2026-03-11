import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
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
  });

  describe('Login', () => {
    it('should login successfully and store tokens', (done) => {
      const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' };
      const mockResponse = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: mockUser
      };

      service.login('testuser', 'testpass').subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(service.isAuthenticated()).toBe(true);
        expect(service.getCurrentUser()).toEqual(mockUser);
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
      // Setup authenticated state
      localStorage.setItem('ccvAccessToken', 'token');
      localStorage.setItem('ccvRefreshToken', 'refresh');
      service['_currentUser'].set({ id: 1, username: 'test', email: 'test@test.com' } as any);
      service['_isAuthenticated'].set(true);

      service.logout().subscribe();
      
      const req = httpMock.expectOne(`${mockConfig.apiUrl}/auth/logout/`);
      req.flush({});

      expect(service.isAuthenticated()).toBe(false);
      expect(service.getCurrentUser()).toBeNull();
      expect(localStorage.getItem('ccvAccessToken')).toBeNull();
      expect(localStorage.getItem('ccvRefreshToken')).toBeNull();
    });
  });

  describe('Observable Streams & Signals', () => {
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

      // Initial state is already emitted (false)
      
      // Simulate login
      service['_isAuthenticated'].set(true);
      
      // Simulate logout
      service['_isAuthenticated'].set(false);
    });

    it('should reflect current user via signal', () => {
      const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' } as any;
      
      service['_currentUser'].set(mockUser);
      expect(service.currentUser()).toEqual(mockUser);
      expect(service.getCurrentUser()).toEqual(mockUser);
    });
  });
});