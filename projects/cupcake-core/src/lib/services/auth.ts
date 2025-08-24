import { Injectable, inject, Inject, InjectionToken } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, throwError, catchError, map } from 'rxjs';
import { User } from '../models';

export interface CupcakeCoreConfig {
  apiUrl: string;
}

export const CUPCAKE_CORE_CONFIG = new InjectionToken<CupcakeCoreConfig>('CUPCAKE_CORE_CONFIG');

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface AuthStatus {
  authenticated: boolean;
  user?: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private config = inject(CUPCAKE_CORE_CONFIG);
  private apiUrl = this.config.apiUrl;

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Initialize with token presence to prevent navbar flickering
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidTokenOnInit());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor() {
    // Initialize auth state from localStorage
    this.initializeAuthState();

    // Listen for token refresh events from interceptor
    if (typeof window !== 'undefined') {
      window.addEventListener('tokenRefreshed', () => {
        this.updateAuthStateAfterRefresh();
      });
      
      window.addEventListener('authCleared', () => {
        this.clearAuthData();
      });
    }

    // Don't make HTTP calls in constructor - let the auth guard and interceptor handle verification
    // This prevents premature token deletion during page refresh
  }

  /**
   * Check if we have a valid token on initialization to prevent navbar flickering
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
   * Initialize authentication state from stored tokens
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
   * Check if JWT token is expired
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
   * Get user info from JWT token
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
   * Initiate ORCID OAuth login
   */
  initiateORCIDLogin(): Observable<{authorization_url: string, state: string}> {
    return this.http.get<{authorization_url: string, state: string}>(`${this.apiUrl}/auth/orcid/login/`);
  }

  /**
   * Handle ORCID OAuth callback
   */
  handleORCIDCallback(code: string, state: string): Observable<AuthResponse> {
    const params = new URLSearchParams({ code, state });
    return this.http.get<AuthResponse>(`${this.apiUrl}/auth/orcid/callback/?${params}`)
      .pipe(
        tap(response => this.setAuthData(response))
      );
  }

  /**
   * Exchange ORCID token for JWT tokens
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
   * Traditional login with username/password
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
   * Logout user
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
   * Check current authentication status
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
   * Get complete user profile from backend
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
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Get stored access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem('ccv_access_token');
  }

  /**
   * Get stored refresh token
   */
  getRefreshToken(): string | null {
    const token = localStorage.getItem('ccv_refresh_token');
    console.log('AuthService.getRefreshToken - token:', token);
    return token;
  }

  /**
   * Set authentication data after successful login
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
   * Try to refresh the access token using refresh token
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
   * Refresh access token
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
   * Update auth state after successful token refresh (called from interceptor)
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
   * Clear authentication data on logout
   */
  private clearAuthData(): void {
    localStorage.removeItem('ccv_access_token');
    localStorage.removeItem('ccv_refresh_token');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }
}
