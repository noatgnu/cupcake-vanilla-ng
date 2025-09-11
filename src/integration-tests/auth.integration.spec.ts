import { AuthService } from '@cupcake/core';
import { TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

describe('AuthService Integration Tests', () => {
  let service: AuthService;
  let mockRouter: jasmine.SpyObj<Router>;
  const config = global.integrationTestConfig;

  beforeAll(async () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    
    TestBed.configureTestingModule({
      imports: [HttpClientModule],
      providers: [
        AuthService,
        { 
          provide: 'CUPCAKE_CORE_CONFIG', 
          useValue: { 
            apiUrl: config.apiUrl,
            siteName: 'Integration Test'
          }
        },
        { provide: Router, useValue: routerSpy }
      ]
    });
    
    service = TestBed.inject(AuthService);
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    
    // Clear any existing auth state
    service.logout();
  });

  afterEach(() => {
    // Clean up auth state after each test
    service.logout();
  });

  describe('Authentication Flow', () => {
    it('should login with valid credentials', async () => {
      const loginResult = await service.login({
        username: config.testUser.email,
        password: config.testUser.password
      }).toPromise();

      expect(loginResult).toBeValidApiResponse();
      expect(loginResult.access).toBeDefined();
      expect(loginResult.user).toBeDefined();
      expect(loginResult.user.email).toBe(config.testUser.email);
      
      // Verify authentication state
      expect(service.isAuthenticated()).toBe(true);
      expect(service.getCurrentUser()).toBeTruthy();
      expect(service.getToken()).toBeTruthy();
      
      // Store token for other tests
      config.testUser.token = loginResult.access;
    });

    it('should reject invalid credentials', async () => {
      try {
        await service.login({
          username: config.testUser.email,
          password: 'wrong_password'
        }).toPromise();
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.status).toBe(401);
        expect(error.error).toMatchApiErrorFormat(401);
        expect(service.isAuthenticated()).toBe(false);
      }
    });

    it('should handle malformed login data', async () => {
      try {
        await service.login({
          username: '',
          password: config.testUser.password
        }).toPromise();
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.status).toBe(400);
        expect(error.error).toMatchApiErrorFormat(400);
      }
    });
  });

  describe('Token Management', () => {
    beforeEach(async () => {
      // Ensure we're logged in for token tests
      if (!service.isAuthenticated()) {
        await service.login({
          username: config.testUser.email,
          password: config.testUser.password
        }).toPromise();
      }
    });

    it('should refresh expired token', async () => {
      const refreshResult = await service.refreshToken().toPromise();
      
      expect(refreshResult).toBeValidApiResponse();
      expect(refreshResult.access).toBeDefined();
      
      const newToken = service.getToken();
      expect(newToken).toBe(refreshResult.access);
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should get user profile with valid token', async () => {
      const profile = await service.getUserProfile().toPromise();
      
      expect(profile).toBeValidApiResponse();
      expect(profile.user).toBeDefined();
      expect(profile.user.email).toBe(config.testUser.email);
      expect(profile.user.id).toBeDefined();
    });

    it('should handle invalid token gracefully', async () => {
      // Set an invalid token
      localStorage.setItem('access_token', 'invalid_token_123');
      
      try {
        await service.getUserProfile().toPromise();
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.status).toBe(401);
        expect(error.error).toMatchApiErrorFormat(401);
      }
    });
  });

  describe('Logout Flow', () => {
    beforeEach(async () => {
      // Ensure we're logged in for logout tests
      if (!service.isAuthenticated()) {
        await service.login({
          username: config.testUser.email,
          password: config.testUser.password
        }).toPromise();
      }
    });

    it('should logout and clear authentication state', () => {
      expect(service.isAuthenticated()).toBe(true);
      
      service.logout();
      
      expect(service.isAuthenticated()).toBe(false);
      expect(service.getCurrentUser()).toBeNull();
      expect(service.getToken()).toBeNull();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('Token Persistence', () => {
    it('should persist authentication across service instances', async () => {
      // Login with first instance
      await service.login({
        username: config.testUser.email,
        password: config.testUser.password
      }).toPromise();
      
      expect(service.isAuthenticated()).toBe(true);
      const token = service.getToken();
      const user = service.getCurrentUser();
      
      // Create new service instance
      const newService = TestBed.inject(AuthService);
      
      // Should restore state from localStorage
      expect(newService.isAuthenticated()).toBe(true);
      expect(newService.getToken()).toBe(token);
      expect(newService.getCurrentUser()).toEqual(user);
    });

    it('should handle corrupted localStorage data', () => {
      // Corrupt the stored user data
      localStorage.setItem('current_user', 'invalid_json{');
      localStorage.setItem('access_token', 'some_token');
      
      // Create new service instance
      const newService = TestBed.inject(AuthService);
      
      // Should handle corruption gracefully
      expect(newService.isAuthenticated()).toBe(false);
      expect(newService.getCurrentUser()).toBeNull();
    });
  });

  describe('Network Error Handling', () => {
    it('should handle network timeouts', async () => {
      // This test would require mocking network conditions
      // For now, we'll test basic error propagation
      try {
        await service.login({
          username: 'nonexistent@test.com',
          password: 'password'
        }).toPromise();
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
        // Could be 401 (unauthorized) or 400 (user not found)
        expect([400, 401, 404]).toContain(error.status);
      }
    });

    it('should handle server errors during login', async () => {
      // Test with malformed data that might cause server error
      try {
        await service.login({
          username: null as any,
          password: null as any
        }).toPromise();
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.status).toBeGreaterThanOrEqual(400);
        expect(service.isAuthenticated()).toBe(false);
      }
    });
  });

  describe('Concurrent Authentication', () => {
    it('should handle multiple simultaneous login attempts', async () => {
      const loginPromises = Array(3).fill(null).map(() =>
        service.login({
          username: config.testUser.email,
          password: config.testUser.password
        }).toPromise()
      );

      const results = await Promise.all(loginPromises);
      
      // All should succeed
      results.forEach(result => {
        expect(result).toBeValidApiResponse();
        expect(result.access).toBeDefined();
      });
      
      // Final state should be authenticated
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should handle mixed success/failure scenarios', async () => {
      const promises = [
        service.login({
          username: config.testUser.email,
          password: config.testUser.password
        }).toPromise(),
        service.login({
          username: config.testUser.email,
          password: 'wrong_password'
        }).toPromise().catch(err => err)
      ];

      const [successResult, errorResult] = await Promise.all(promises);
      
      expect(successResult).toBeValidApiResponse();
      expect(errorResult.status).toBe(401);
      
      // Should end up authenticated due to successful login
      expect(service.isAuthenticated()).toBe(true);
    });
  });
});