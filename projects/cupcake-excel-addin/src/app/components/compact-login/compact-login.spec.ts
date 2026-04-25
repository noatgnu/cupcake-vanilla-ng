import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { CompactLogin } from './compact-login';
import { AuthService, AuthResponse } from '@noatgnu/cupcake-core';
import { ExcelLaunchService, ExcelLaunchClaimResponse } from '@noatgnu/cupcake-vanilla';
import { SyncService } from '../../core/services/sync.service';

describe('CompactLogin', () => {
  let component: CompactLogin;
  let fixture: ComponentFixture<CompactLogin>;
  let authService: jasmine.SpyObj<AuthService>;
  let launchService: jasmine.SpyObj<ExcelLaunchService>;

  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    isStaff: false,
    isSuperuser: false,
    isActive: true,
    dateJoined: '2024-01-01T00:00:00Z',
    hasOrcid: false
  };

  const mockAuthResponse: AuthResponse = {
    accessToken: 'access-token-123',
    refreshToken: 'refresh-token-456',
    user: mockUser
  };

  const mockClaimResponse: ExcelLaunchClaimResponse = {
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

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login', 'fetchUserProfile']);
    const launchServiceSpy = jasmine.createSpyObj('ExcelLaunchService', ['claimLaunchCode']);
    const syncServiceSpy = jasmine.createSpyObj('SyncService', [], { state: () => ({}) });

    await TestBed.configureTestingModule({
      imports: [CompactLogin],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ExcelLaunchService, useValue: launchServiceSpy },
        { provide: SyncService, useValue: syncServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CompactLogin);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    launchService = TestBed.inject(ExcelLaunchService) as jasmine.SpyObj<ExcelLaunchService>;

    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('mode switching', () => {
    it('should default to credentials mode', () => {
      expect(component.mode()).toBe('credentials');
    });

    it('should switch to launch code mode', () => {
      component.setMode('launchCode');
      expect(component.mode()).toBe('launchCode');
    });

    it('should clear error when switching modes', () => {
      component.error.set('Some error');
      component.setMode('launchCode');
      expect(component.error()).toBeNull();
    });
  });

  describe('credentials login', () => {
    beforeEach(() => {
      component.setMode('credentials');
    });

    it('should show error when username is empty', () => {
      component.username.set('');
      component.password.set('password');

      component.onSubmit();

      expect(component.error()).toBe('Please enter username and password');
      expect(authService.login).not.toHaveBeenCalled();
    });

    it('should show error when password is empty', () => {
      component.username.set('testuser');
      component.password.set('');

      component.onSubmit();

      expect(component.error()).toBe('Please enter username and password');
    });

    it('should call auth service with credentials', async () => {
      authService.login.and.returnValue(of(mockAuthResponse));
      component.username.set('testuser');
      component.password.set('password123');
      component.rememberMe.set(true);

      component.onSubmit();
      await fixture.whenStable();

      expect(authService.login).toHaveBeenCalledWith('testuser', 'password123', true);
    });

    it('should emit loginSuccess on successful login', async () => {
      authService.login.and.returnValue(of(mockAuthResponse));
      component.username.set('testuser');
      component.password.set('password123');
      const loginSuccessSpy = jasmine.createSpy('loginSuccess');
      component.loginSuccess.subscribe(loginSuccessSpy);

      component.onSubmit();
      await fixture.whenStable();

      expect(loginSuccessSpy).toHaveBeenCalled();
      expect(component.loading()).toBeFalse();
    });

    it('should show error on login failure', async () => {
      authService.login.and.returnValue(throwError(() => ({
        error: { detail: 'Invalid credentials' }
      })));
      component.username.set('testuser');
      component.password.set('wrongpassword');

      component.onSubmit();
      await fixture.whenStable();

      expect(component.error()).toBe('Invalid credentials');
      expect(component.loading()).toBeFalse();
    });

    it('should save remember me preference to localStorage', async () => {
      authService.login.and.returnValue(of(mockAuthResponse));
      component.username.set('testuser');
      component.password.set('password123');
      component.rememberMe.set(true);

      component.onSubmit();
      await fixture.whenStable();

      expect(localStorage.getItem('cupcake-excel-remember-me')).toBe('true');
    });
  });

  describe('launch code login', () => {
    beforeEach(() => {
      component.setMode('launchCode');
      authService.fetchUserProfile.and.returnValue(of(mockUser as any));
    });

    it('should show error when launch code is empty', () => {
      component.launchCode.set('');

      component.onSubmit();

      expect(component.error()).toBe('Please enter a launch code');
      expect(launchService.claimLaunchCode).not.toHaveBeenCalled();
    });

    it('should trim whitespace from the launch code', async () => {
      launchService.claimLaunchCode.and.returnValue(of(mockClaimResponse));
      component.launchCode.set('  abc123  ');

      component.onSubmit();
      await fixture.whenStable();

      expect(launchService.claimLaunchCode).toHaveBeenCalledWith('abc123');
    });

    it('should store tokens in localStorage on success', async () => {
      launchService.claimLaunchCode.and.returnValue(of(mockClaimResponse));
      component.launchCode.set('validCode');

      component.onSubmit();
      await fixture.whenStable();

      expect(localStorage.getItem('ccvAccessToken')).toBe('access-token-123');
      expect(localStorage.getItem('ccvRefreshToken')).toBe('refresh-token-456');
    });

    it('should emit tableReady with table ID on success', async () => {
      launchService.claimLaunchCode.and.returnValue(of(mockClaimResponse));
      component.launchCode.set('validCode');
      const tableReadySpy = jasmine.createSpy('tableReady');
      component.tableReady.subscribe(tableReadySpy);

      component.onSubmit();
      await fixture.whenStable();

      expect(tableReadySpy).toHaveBeenCalledWith(123);
    });

    it('should emit loginSuccess on success', async () => {
      launchService.claimLaunchCode.and.returnValue(of(mockClaimResponse));
      component.launchCode.set('validCode');
      const loginSuccessSpy = jasmine.createSpy('loginSuccess');
      component.loginSuccess.subscribe(loginSuccessSpy);

      component.onSubmit();
      await fixture.whenStable();

      expect(loginSuccessSpy).toHaveBeenCalled();
    });

    it('should call fetchUserProfile after claiming code', async () => {
      launchService.claimLaunchCode.and.returnValue(of(mockClaimResponse));
      component.launchCode.set('validCode');

      component.onSubmit();
      await fixture.whenStable();

      expect(authService.fetchUserProfile).toHaveBeenCalled();
    });

    it('should show expired error for 410 status', async () => {
      launchService.claimLaunchCode.and.returnValue(throwError(() => ({
        status: 410,
        error: { detail: 'This launch code has expired' }
      })));
      component.launchCode.set('EXPIRED');

      component.onSubmit();
      await fixture.whenStable();

      expect(component.error()).toBe('Launch code has expired. Please generate a new one.');
    });

    it('should show invalid error for 400 status', async () => {
      launchService.claimLaunchCode.and.returnValue(throwError(() => ({
        status: 400,
        error: { detail: 'Invalid launch code' }
      })));
      component.launchCode.set('INVALID');

      component.onSubmit();
      await fixture.whenStable();

      expect(component.error()).toBe('Invalid launch code');
    });

    it('should show generic error for other status codes', async () => {
      launchService.claimLaunchCode.and.returnValue(throwError(() => ({
        status: 500,
        error: { detail: 'Server error' }
      })));
      component.launchCode.set('validCode');

      component.onSubmit();
      await fixture.whenStable();

      expect(component.error()).toBe('Server error');
    });

    it('should show default error message when detail not provided', async () => {
      launchService.claimLaunchCode.and.returnValue(throwError(() => ({
        status: 500,
        error: {}
      })));
      component.launchCode.set('validCode');

      component.onSubmit();
      await fixture.whenStable();

      expect(component.error()).toBe('Failed to verify launch code');
    });
  });

  describe('ngOnInit', () => {
    it('should load remember me preference from localStorage', () => {
      localStorage.setItem('cupcake-excel-remember-me', 'false');

      component.ngOnInit();

      expect(component.rememberMe()).toBeFalse();
    });

    it('should default to true when no saved preference', () => {
      component.ngOnInit();

      expect(component.rememberMe()).toBeTrue();
    });
  });

  describe('clearError', () => {
    it('should clear the error', () => {
      component.error.set('Some error');

      component.clearError();

      expect(component.error()).toBeNull();
    });
  });

  describe('pending table', () => {
    it('should emit tableReady for pending table after credentials login', async () => {
      localStorage.setItem('cupcake-excel-pending-table', '456');
      authService.login.and.returnValue(of(mockAuthResponse));
      component.setMode('credentials');
      component.username.set('testuser');
      component.password.set('password123');
      const tableReadySpy = jasmine.createSpy('tableReady');
      component.tableReady.subscribe(tableReadySpy);

      component.onSubmit();
      await fixture.whenStable();

      expect(tableReadySpy).toHaveBeenCalledWith(456);
      expect(localStorage.getItem('cupcake-excel-pending-table')).toBeNull();
    });
  });
});
