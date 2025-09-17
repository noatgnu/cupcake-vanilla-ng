import { Injectable, inject, Inject, InjectionToken } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, throwError, catchError, map } from 'rxjs';
import { User } from '../models';

export interface CupcakeCoreConfig {
  apiUrl: string;
}

export const CUPCAKE_CORE_CONFIG = new InjectionToken<CupcakeCoreConfig>('CUPCAKE_CORE_CONFIG');

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
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
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidTokenOnInit());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

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

  private hasValidTokenOnInit(): boolean {
    if (typeof window === 'undefined') return false;
    
    const token = localStorage.getItem('ccvAccessToken');
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch {
      return false;
    }
  }

  private initializeAuthState(): void {
    const token = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    
    if (token && !this.isTokenExpired(token)) {
      this.isAuthenticatedSubject.next(true);
      
      const user = this.getUserFromToken();
      if (user) {
        this.currentUserSubject.next(user);
      }

      this.fetchUserProfile().subscribe({
        next: (fullUser) => {
        },
        error: (error) => {
        }
      });
    } else if (refreshToken && token && this.isTokenExpired(token)) {
      this.isAuthenticatedSubject.next(false);
      this.currentUserSubject.next(null);
    } else if (refreshToken && !token) {
      this.isAuthenticatedSubject.next(false);
      this.currentUserSubject.next(null);
    } else {
      this.isAuthenticatedSubject.next(false);
      this.currentUserSubject.next(null);
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp < now;
    } catch {
      return true;
    }
  }

  getUserFromToken(): User | null {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.user_id,
        username: payload.username || '',
        email: payload.email || '',
        firstName: payload.first_name || '',
        lastName: payload.last_name || '',
        isStaff: payload.is_staff || false,
        isSuperuser: payload.is_superuser || false,
        isActive: payload.is_active || true,
        dateJoined: payload.date_joined || '',
        lastLogin: payload.last_login || null,
        hasOrcid: payload.orcid_id ? true : false,
        orcidId: payload.orcid_id
      };
    } catch {
      return null;
    }
  }

  initiateORCIDLogin(): Observable<{authorizationUrl: string, state: string}> {
    return this.http.get<{authorization_url: string, state: string}>(`${this.apiUrl}/auth/orcid/login/`)
      .pipe(
        map(response => ({
          authorizationUrl: response.authorization_url,
          state: response.state
        }))
      );
  }

  handleORCIDCallback(code: string, state: string): Observable<AuthResponse> {
    const params = new URLSearchParams({ code, state });
    return this.http.get<AuthResponse>(`${this.apiUrl}/auth/orcid/callback/?${params}`)
      .pipe(
        tap(response => this.setAuthData(response))
      );
  }

  exchangeORCIDToken(accessToken: string, orcidId: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/orcid/token/`, {
      access_token: accessToken,
      orcid_id: orcidId
    }).pipe(
      tap(response => this.setAuthData(response))
    );
  }

  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login/`, {
      username,
      password
    }).pipe(
      tap(response => this.setAuthData(response))
    );
  }

  logout(): Observable<any> {
    const refreshToken = this.getRefreshToken();
    const payload = refreshToken ? { refresh: refreshToken } : {};
    
    return this.http.post(`${this.apiUrl}/auth/logout/`, payload)
      .pipe(
        tap(() => this.clearAuthData())
      );
  }

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

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  getAccessToken(): string | null {
    return localStorage.getItem('ccvAccessToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('ccvRefreshToken');
  }

  private setAuthData(response: AuthResponse): void {
    const accessToken = response.accessToken || (response as any).access_token || (response as any).access;
    const refreshToken = response.refreshToken || (response as any).refresh_token || (response as any).refresh;
    
    localStorage.setItem('ccvAccessToken', accessToken);
    localStorage.setItem('ccvRefreshToken', refreshToken);
    this.currentUserSubject.next(response.user);
    this.isAuthenticatedSubject.next(true);
  }

  tryRefreshToken(): Observable<{access: string}> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      this.clearAuthData();
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<{access: string}>(`${this.apiUrl}/auth/token/refresh/`, {
      refresh: refreshToken
    }).pipe(
      tap((response) => {
        localStorage.setItem('ccvAccessToken', response.access);
        this.isAuthenticatedSubject.next(true);

        const user = this.getUserFromToken();
        if (user) {
          this.currentUserSubject.next(user);
        }

        this.fetchUserProfile().subscribe({
          next: (fullUser) => {
          },
          error: (error) => {
          }
        });
      }),
      catchError((error) => {
        this.clearAuthData();
        return throwError(() => error);
      })
    );
  }

  refreshToken(): Observable<{access: string}> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    return this.http.post<{access: string}>(`${this.apiUrl}/auth/token/refresh/`, {
      refresh: refreshToken
    }).pipe(
      tap(response => {
        localStorage.setItem('ccvAccessToken', response.access);
        this.isAuthenticatedSubject.next(true);

        this.fetchUserProfile().subscribe({
          next: (fullUser) => {
          },
          error: (error) => {
          }
        });
      })
    );
  }

  updateAuthStateAfterRefresh(): void {
    const token = this.getAccessToken();
    if (token && !this.isTokenExpired(token)) {
      this.isAuthenticatedSubject.next(true);

      const user = this.getUserFromToken();
      if (user) {
        this.currentUserSubject.next(user);
      }

      this.fetchUserProfile().subscribe({
        next: (fullUser) => {
        },
        error: (error) => {
        }
      });
    }
  }

  private clearAuthData(): void {
    localStorage.removeItem('ccvAccessToken');
    localStorage.removeItem('ccvRefreshToken');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }
}
