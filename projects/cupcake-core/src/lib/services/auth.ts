import { Injectable, inject, Inject, InjectionToken } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, throwError, catchError, map } from 'rxjs';
import { User } from '../models';

/**
 * Configuration interface for CupcakeCore library
 * @example
 * ```typescript
 * const config: CupcakeCoreConfig = {
 *   apiUrl: 'https://api.example.com/v1'
 * };
 * ```
 */
export interface CupcakeCoreConfig {
  /** Base API URL for the backend service */
  apiUrl: string;
}

export const CUPCAKE_CORE_CONFIG = new InjectionToken<CupcakeCoreConfig>('CUPCAKE_CORE_CONFIG');

/**
 * Response structure from authentication endpoints
 * @example
 * ```typescript
 * const authResponse: AuthResponse = {
 *   access_token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...',
 *   refresh_token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...',
 *   user: {
 *     id: 1,
 *     username: 'john_doe',
 *     email: 'john@example.com'
 *   }
 * };
 * ```
 */
export interface AuthResponse {
  /** JWT access token for API authentication */
  access_token: string;
  /** JWT refresh token for token renewal */
  refresh_token: string;
  /** User information */
  user: User;
}

/**
 * Current authentication status from the backend
 * @example
 * ```typescript
 * const status: AuthStatus = {
 *   authenticated: true,
 *   user: {
 *     id: 1,
 *     username: 'john_doe'
 *   }
 * };
 * ```
 */
export interface AuthStatus {
  /** Whether the user is currently authenticated */
  authenticated: boolean;
  /** User information if authenticated */
  user?: User;
}

/**
 * Authentication service providing JWT-based authentication with ORCID integration
 * 
 * This service manages user authentication state, token storage, and automatic token refresh.
 * It supports both traditional username/password login and ORCID OAuth flow.
 * 
 * @example Basic usage
 * ```typescript
 * constructor(private authService: AuthService) {}
 * 
 * // Check if user is authenticated
 * if (this.authService.isAuthenticated()) {
 *   console.log('User is logged in');
 * }
 * 
 * // Login with username/password
 * this.authService.login('username', 'password').subscribe({
 *   next: (response) => console.log('Logged in:', response.user),
 *   error: (error) => console.error('Login failed:', error)
 * });
 * 
 * // Get current user
 * const user = this.authService.getCurrentUser();
 * ```
 * 
 * @example ORCID authentication
 * ```typescript
 * // Initiate ORCID login
 * this.authService.initiateORCIDLogin().subscribe({
 *   next: (response) => {
 *     window.location.href = response.authorization_url;
 *   }
 * });
 * 
 * // Handle ORCID callback
 * this.authService.handleORCIDCallback(code, state).subscribe({
 *   next: (response) => console.log('ORCID login successful:', response.user)
 * });
 * ```
 * 
 * @example Reactive authentication state
 * ```typescript
 * // Subscribe to authentication state changes
 * this.authService.isAuthenticated$.subscribe(isAuth => {
 *   if (isAuth) {
 *     console.log('User authenticated');
 *   } else {
 *     this.router.navigate(['/login']);
 *   }
 * });
 * 
 * // Subscribe to user changes
 * this.authService.currentUser$.subscribe(user => {
 *   this.currentUser = user;
 * });
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private config = inject(CUPCAKE_CORE_CONFIG);
  private apiUrl = this.config.apiUrl;

  /** Subject holding the current user state */
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  /** Observable for current user state changes */
  public currentUser$ = this.currentUserSubject.asObservable();

  /** Subject holding the authentication state, initialized to prevent UI flickering */
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidTokenOnInit());
  /** Observable for authentication state changes */
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  /**
   * Initialize the authentication service
   * Sets up event listeners for token refresh and auth clearing events
   */
  constructor() {
    this.initializeAuthState();

    if (typeof window !== 'undefined') {
      window.addEventListener('tokenRefreshed', () => {
        this.updateAuthStateAfterRefresh();
      });
      
      window.addEventListener('authCleared', () => {
        this.clearAuthData();
      });
    }
  }

  /**
   * Check if we have a valid token on initialization to prevent UI flickering
   * @returns True if a non-expired JWT token exists in localStorage
   * @example
   * ```typescript
   * // This is called automatically during service initialization
   * const hasValidToken = this.hasValidTokenOnInit(); // true/false
   * ```
   */
  private hasValidTokenOnInit(): boolean {
    if (typeof window === 'undefined') return false;
    
    const token = localStorage.getItem('ccv_access_token');
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch {
      return false;
    }
  }

  /**
   * Initialize authentication state from stored tokens and set up reactive state
   * Handles different scenarios: valid token, expired token with refresh, no tokens
   * @example
   * ```typescript
   * // Called automatically in constructor
   * this.initializeAuthState();
   * 
   * // State will be set based on token validity:
   * // - Valid token: isAuthenticated$ = true, user loaded
   * // - Expired token: isAuthenticated$ = false, tokens preserved for refresh
   * // - No tokens: isAuthenticated$ = false, no user data
   * ```
   */
  private initializeAuthState(): void {
    const token = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    
    console.log('AuthService.initializeAuthState - access token:', token);
    console.log('AuthService.initializeAuthState - refresh token:', refreshToken);
    console.log('AuthService.initializeAuthState - token expired:', token ? this.isTokenExpired(token) : 'no token');
    console.log('AuthService.initializeAuthState - timestamp:', new Date().toISOString());
    
    if (token && !this.isTokenExpired(token)) {
      this.isAuthenticatedSubject.next(true);
      
      // Try to get basic user info from token first (for immediate display)
      const user = this.getUserFromToken();
      if (user) {
        this.currentUserSubject.next(user);
      }
      
      // Then fetch complete user profile from backend to ensure we have latest data
      this.fetchUserProfile().subscribe({
        next: (fullUser) => {
          console.log('AuthService: Fetched complete user profile after initialization:', fullUser);
        },
        error: (error) => {
          console.warn('AuthService: Failed to fetch user profile after initialization:', error);
          // Don't clear auth state on profile fetch failure - user might still be authenticated
        }
      });
    } else if (refreshToken && token && this.isTokenExpired(token)) {
      // Token is expired but we have refresh token
      // Don't try to refresh here - let the interceptor handle it when needed
      // Just clear the auth state for now but keep the tokens
      this.isAuthenticatedSubject.next(false);
      this.currentUserSubject.next(null);
    } else if (refreshToken && !token) {
      // We have refresh token but no access token
      // Keep the refresh token, clear auth state
      this.isAuthenticatedSubject.next(false);
      this.currentUserSubject.next(null);
    } else {
      // No tokens at all, just set auth state to false without clearing
      // (tokens might be missing for other reasons, let auth guard handle redirect)
      this.isAuthenticatedSubject.next(false);
      this.currentUserSubject.next(null);
    }
  }

  /**
   * Check if a JWT token is expired
   * @param token - The JWT token to check
   * @returns True if the token is expired or invalid
   * @example
   * ```typescript
   * const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...';
   * if (this.isTokenExpired(token)) {
   *   console.log('Token is expired, need to refresh');
   * }
   * ```
   */
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp < now;
    } catch {
      return true;
    }
  }

  /**
   * Extract user information from the JWT token payload
   * @returns User object if token is valid, null otherwise
   * @example
   * ```typescript
   * const user = this.getUserFromToken();
   * if (user) {
   *   console.log(`Welcome ${user.first_name} ${user.last_name}`);
   * }
   * ```
   */
  getUserFromToken(): User | null {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.user_id,
        username: payload.username || '',
        email: payload.email || '',
        first_name: payload.first_name || '',
        last_name: payload.last_name || '',
        is_staff: payload.is_staff || false,
        is_superuser: payload.is_superuser || false,
        date_joined: payload.date_joined || '',
        last_login: payload.last_login || null,
        orcid_id: payload.orcid_id
      };
    } catch {
      return null;
    }
  }

  /**
   * Initiate ORCID OAuth authentication flow
   * @returns Observable containing authorization URL and state parameter
   * @example
   * ```typescript
   * this.authService.initiateORCIDLogin().subscribe({
   *   next: (response) => {
   *     // Redirect user to ORCID for authentication
   *     localStorage.setItem('oauth_state', response.state);
   *     window.location.href = response.authorization_url;
   *   },
   *   error: (error) => console.error('ORCID login initiation failed:', error)
   * });
   * ```
   */
  initiateORCIDLogin(): Observable<{authorization_url: string, state: string}> {
    return this.http.get<{authorization_url: string, state: string}>(`${this.apiUrl}/auth/orcid/login/`);
  }

  /**
   * Handle the OAuth callback from ORCID
   * @param code - Authorization code from ORCID
   * @param state - State parameter for CSRF protection
   * @returns Observable containing authentication response
   * @example
   * ```typescript
   * // In your callback component
   * const code = this.route.snapshot.queryParams['code'];
   * const state = this.route.snapshot.queryParams['state'];
   * 
   * this.authService.handleORCIDCallback(code, state).subscribe({
   *   next: (response) => {
   *     console.log('ORCID login successful:', response.user);
   *     this.router.navigate(['/dashboard']);
   *   },
   *   error: (error) => console.error('ORCID callback failed:', error)
   * });
   * ```
   */
  handleORCIDCallback(code: string, state: string): Observable<AuthResponse> {
    const params = new URLSearchParams({ code, state });
    return this.http.get<AuthResponse>(`${this.apiUrl}/auth/orcid/callback/?${params}`)
      .pipe(
        tap(response => this.setAuthData(response))
      );
  }

  /**
   * Exchange ORCID access token for application JWT tokens
   * @param access_token - ORCID access token
   * @param orcid_id - User's ORCID identifier
   * @returns Observable containing authentication response
   * @example
   * ```typescript
   * const orcidToken = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
   * const orcidId = '0000-0000-0000-0000';
   * 
   * this.authService.exchangeORCIDToken(orcidToken, orcidId).subscribe({
   *   next: (response) => {
   *     console.log('Token exchange successful:', response.user);
   *   },
   *   error: (error) => console.error('Token exchange failed:', error)
   * });
   * ```
   */
  exchangeORCIDToken(access_token: string, orcid_id: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/orcid/token/`, {
      access_token,
      orcid_id
    }).pipe(
      tap(response => this.setAuthData(response))
    );
  }

  /**
   * Authenticate user with username and password
   * @param username - User's username or email
   * @param password - User's password
   * @returns Observable containing authentication response
   * @example
   * ```typescript
   * this.authService.login('john_doe', 'secure_password').subscribe({
   *   next: (response) => {
   *     console.log('Login successful:', response.user.username);
   *     this.router.navigate(['/dashboard']);
   *   },
   *   error: (error) => {
   *     console.error('Login failed:', error);
   *     this.showErrorMessage('Invalid credentials');
   *   }
   * });
   * ```
   */
  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login/`, {
      username,
      password
    }).pipe(
      tap(response => this.setAuthData(response))
    );
  }

  /**
   * Logout the current user and clear authentication data
   * @returns Observable for logout operation
   * @example
   * ```typescript
   * this.authService.logout().subscribe({
   *   next: () => {
   *     console.log('Logout successful');
   *     this.router.navigate(['/login']);
   *   },
   *   error: (error) => {
   *     console.warn('Logout request failed:', error);
   *     // Auth data is cleared anyway for security
   *     this.router.navigate(['/login']);
   *   }
   * });
   * ```
   */
  logout(): Observable<any> {
    const refreshToken = this.getRefreshToken();
    const payload = refreshToken ? { refresh_token: refreshToken } : {};
    
    return this.http.post(`${this.apiUrl}/auth/logout/`, payload)
      .pipe(
        tap(() => this.clearAuthData())
      );
  }

  /**
   * Check current authentication status with the backend
   * @returns Observable containing authentication status
   * @example
   * ```typescript
   * this.authService.checkAuthStatus().subscribe({
   *   next: (status) => {
   *     if (status.authenticated) {
   *       console.log('User is authenticated:', status.user?.username);
   *     } else {
   *       console.log('User is not authenticated');
   *       this.router.navigate(['/login']);
   *     }
   *   },
   *   error: (error) => console.error('Auth status check failed:', error)
   * });
   * ```
   */
  checkAuthStatus(): Observable<AuthStatus> {
    return this.http.get<AuthStatus>(`${this.apiUrl}/auth/status/`)
      .pipe(
        tap(status => {
          if (status.authenticated && status.user) {
            this.currentUserSubject.next(status.user);
            this.isAuthenticatedSubject.next(true);
          } else {
            this.clearAuthData();
          }
        })
      );
  }

  /**
   * Fetch complete user profile from the backend
   * @returns Observable containing user profile data
   * @example
   * ```typescript
   * this.authService.fetchUserProfile().subscribe({
   *   next: (user) => {
   *     console.log('Profile loaded:', user.first_name, user.last_name);
   *     this.userProfile = user;
   *   },
   *   error: (error) => console.error('Failed to load profile:', error)
   * });
   * ```
   */
  fetchUserProfile(): Observable<User> {
    return this.http.get<{user: User}>(`${this.apiUrl}/auth/profile/`)
      .pipe(
        tap(response => {
          this.currentUserSubject.next(response.user);
          this.isAuthenticatedSubject.next(true);
        }),
        map(response => response.user)
      );
  }

  /**
   * Get the currently authenticated user synchronously
   * @returns Current user object or null if not authenticated
   * @example
   * ```typescript
   * const user = this.authService.getCurrentUser();
   * if (user) {
   *   console.log(`Welcome back, ${user.first_name}!`);
   * } else {
   *   console.log('No user is currently logged in');
   * }
   * ```
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if user is currently authenticated synchronously
   * @returns True if user is authenticated, false otherwise
   * @example
   * ```typescript
   * if (this.authService.isAuthenticated()) {
   *   // User is logged in, show protected content
   *   this.loadUserData();
   * } else {
   *   // User is not logged in, redirect to login
   *   this.router.navigate(['/login']);
   * }
   * ```
   */
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Get the stored JWT access token from localStorage
   * @returns Access token string or null if not found
   * @example
   * ```typescript
   * const token = this.authService.getAccessToken();
   * if (token) {
   *   // Use token for API requests
   *   const headers = { Authorization: `Bearer ${token}` };
   * }
   * ```
   */
  getAccessToken(): string | null {
    return localStorage.getItem('ccv_access_token');
  }

  /**
   * Get the stored JWT refresh token from localStorage
   * @returns Refresh token string or null if not found
   * @example
   * ```typescript
   * const refreshToken = this.authService.getRefreshToken();
   * if (refreshToken) {
   *   // Use refresh token to get new access token
   *   this.refreshAccessToken();
   * }
   * ```
   */
  getRefreshToken(): string | null {
    const token = localStorage.getItem('ccv_refresh_token');
    console.log('AuthService.getRefreshToken - token:', token);
    return token;
  }

  /**
   * Store authentication data after successful login
   * Updates localStorage and reactive state observables
   * @param response - Authentication response from login/OAuth
   * @example
   * ```typescript
   * // This is called automatically after successful login
   * const response: AuthResponse = {
   *   access_token: 'jwt_token_here',
   *   refresh_token: 'refresh_token_here',
   *   user: { id: 1, username: 'john_doe' }
   * };
   * this.setAuthData(response);
   * ```
   */
  private setAuthData(response: AuthResponse): void {
    // Handle both naming conventions (access_token/access, refresh_token/refresh)
    const accessToken = response.access_token || (response as any).access;
    const refreshToken = response.refresh_token || (response as any).refresh;
    
    console.log('AuthService.setAuthData - response:', response);
    console.log('AuthService.setAuthData - accessToken:', accessToken);
    console.log('AuthService.setAuthData - refreshToken:', refreshToken);
    
    localStorage.setItem('ccv_access_token', accessToken);
    localStorage.setItem('ccv_refresh_token', refreshToken);
    this.currentUserSubject.next(response.user);
    this.isAuthenticatedSubject.next(true);
  }

  /**
   * Attempt to refresh the access token using the stored refresh token
   * @returns Observable containing the new access token
   * @throws Error if no refresh token is available
   * @example
   * ```typescript
   * this.authService.tryRefreshToken().subscribe({
   *   next: (response) => {
   *     console.log('Token refreshed successfully');
   *     // Continue with the original request
   *   },
   *   error: (error) => {
   *     console.error('Token refresh failed:', error);
   *     // Redirect to login page
   *     this.router.navigate(['/login']);
   *   }
   * });
   * ```
   */
  tryRefreshToken(): Observable<{access: string}> {
    const refreshToken = this.getRefreshToken();
    console.log('AuthService.tryRefreshToken - refreshToken:', refreshToken);
    
    if (!refreshToken) {
      console.log('AuthService.tryRefreshToken - No refresh token, clearing auth data');
      this.clearAuthData();
      return throwError(() => new Error('No refresh token available'));
    }

    console.log('AuthService.tryRefreshToken - Making refresh request to:', `${this.apiUrl}/auth/token/refresh/`);
    console.log('AuthService.tryRefreshToken - Request body:', { refresh: refreshToken });

    return this.http.post<{access: string}>(`${this.apiUrl}/auth/token/refresh/`, {
      refresh: refreshToken
    }).pipe(
      tap((response) => {
        console.log('AuthService.tryRefreshToken - Success response:', response);
        localStorage.setItem('ccv_access_token', response.access);
        this.isAuthenticatedSubject.next(true);
        
        // Try to get basic user info from new token first (for immediate display)
        const user = this.getUserFromToken();
        if (user) {
          this.currentUserSubject.next(user);
        }
        
        // Fetch complete user profile from backend after successful token refresh
        this.fetchUserProfile().subscribe({
          next: (fullUser) => {
            console.log('AuthService: Fetched complete user profile after tryRefreshToken:', fullUser);
          },
          error: (error) => {
            console.warn('AuthService: Failed to fetch user profile after tryRefreshToken:', error);
          }
        });
      }),
      catchError((error) => {
        console.log('AuthService.tryRefreshToken - Error:', error);
        // Refresh failed, clear all auth data
        this.clearAuthData();
        return throwError(() => error);
      })
    );
  }

  /**
   * Refresh the access token using the stored refresh token
   * @returns Observable containing the new access token
   * @throws Error if no refresh token is available
   * @example
   * ```typescript
   * this.authService.refreshToken().subscribe({
   *   next: (response) => {
   *     console.log('New access token received:', response.access);
   *     // Token is automatically stored in localStorage
   *   },
   *   error: (error) => {
   *     console.error('Token refresh failed:', error);
   *   }
   * });
   * ```
   */
  refreshToken(): Observable<{access: string}> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    return this.http.post<{access: string}>(`${this.apiUrl}/auth/token/refresh/`, {
      refresh: refreshToken
    }).pipe(
      tap(response => {
        localStorage.setItem('ccv_access_token', response.access);
        this.isAuthenticatedSubject.next(true);
        
        // Fetch complete user profile from backend after successful token refresh
        this.fetchUserProfile().subscribe({
          next: (fullUser) => {
            console.log('AuthService: Fetched complete user profile after refreshToken:', fullUser);
          },
          error: (error) => {
            console.warn('AuthService: Failed to fetch user profile after refreshToken:', error);
          }
        });
      })
    );
  }

  /**
   * Update authentication state after successful token refresh
   * Called automatically by the auth interceptor when tokens are refreshed
   * @example
   * ```typescript
   * // This is called automatically by the interceptor
   * // or manually after successful token refresh
   * this.updateAuthStateAfterRefresh();
   * 
   * // The method will:
   * // 1. Verify the new token is valid
   * // 2. Update authentication state
   * // 3. Fetch fresh user profile data
   * ```
   */
  updateAuthStateAfterRefresh(): void {
    const token = this.getAccessToken();
    if (token && !this.isTokenExpired(token)) {
      this.isAuthenticatedSubject.next(true);
      
      // Try to get basic user info from new token first (for immediate display)
      const user = this.getUserFromToken();
      if (user) {
        this.currentUserSubject.next(user);
      }
      
      // Fetch complete user profile from backend after token refresh
      this.fetchUserProfile().subscribe({
        next: (fullUser) => {
          console.log('AuthService: Fetched complete user profile after token refresh:', fullUser);
        },
        error: (error) => {
          console.warn('AuthService: Failed to fetch user profile after token refresh:', error);
          // Don't clear auth state on profile fetch failure - token refresh was successful
        }
      });
    }
  }

  /**
   * Clear all authentication data from storage and reset state
   * Removes tokens from localStorage and resets reactive observables
   * @example
   * ```typescript
   * // This is called automatically during logout
   * // or when authentication fails
   * this.clearAuthData();
   * 
   * // After calling this method:
   * // - localStorage tokens are removed
   * // - isAuthenticated$ emits false
   * // - currentUser$ emits null
   * ```
   */
  private clearAuthData(): void {
    localStorage.removeItem('ccv_access_token');
    localStorage.removeItem('ccv_refresh_token');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }
}
