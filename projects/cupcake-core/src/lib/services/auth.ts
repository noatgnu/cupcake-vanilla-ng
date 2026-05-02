import { Injectable, inject, Inject, InjectionToken, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, throwError, catchError, map } from 'rxjs';
import { User } from '../models';
import { resetRefreshState } from '../interceptors';

export interface CupcakeCoreConfig {
  apiUrl: string;
  websocketUrl?: string;
}

export const CUPCAKE_CORE_CONFIG = new InjectionToken<CupcakeCoreConfig>('CUPCAKE_CORE_CONFIG');

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface AuthStatus {
  authenticated: boolean;
  orcidLoginEnabled?: boolean;
  registrationEnabled?: boolean;
  user?: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private config = inject(CUPCAKE_CORE_CONFIG);

  private get apiUrl(): string {
    return this.config.apiUrl;
  }

  private _currentUser = signal<User | null>(null);
  public currentUser = this._currentUser.asReadonly();

  private _isAuthenticated = signal<boolean>(this.hasValidTokenOnInit());
  public authenticated = this._isAuthenticated.asReadonly();

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
      return payload.exp > Math.floor(Date.now() / 1000);
    } catch {
      return false;
    }
  }

  private initializeAuthState(): void {
    const token = this.getAccessToken();
    const refreshToken = this.getRefreshToken();

    if (token && !this.isTokenExpired(token)) {
      this._isAuthenticated.set(true);
      const user = this.getUserFromToken();
      if (user) {
        this._currentUser.set(user);
      }
      this.fetchUserProfile().subscribe({ next: () => {}, error: () => {} });
    } else if (refreshToken) {
      this.tryRefreshToken().subscribe({ next: () => {}, error: () => {} });
    } else {
      this._isAuthenticated.set(false);
      this._currentUser.set(null);
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp < Math.floor(Date.now() / 1000);
    } catch {
      return true;
    }
  }

  private convertUserFromSnakeToCamel(user: any): User {
    return {
      id: user.id || user.user_id,
      username: user.username || '',
      email: user.email || '',
      firstName: user.firstName || user.first_name || '',
      lastName: user.lastName || user.last_name || '',
      isStaff: user.isStaff !== undefined ? user.isStaff : (user.is_staff || false),
      isSuperuser: user.isSuperuser !== undefined ? user.isSuperuser : (user.is_superuser || false),
      isActive: user.isActive !== undefined ? user.isActive : (user.is_active !== undefined ? user.is_active : true),
      dateJoined: user.dateJoined || user.date_joined || '',
      lastLogin: user.lastLogin || user.last_login || null,
      hasOrcid: user.hasOrcid !== undefined ? user.hasOrcid : (user.orcid_id ? true : false),
      orcidId: user.orcidId || user.orcid_id
    };
  }

  getUserFromToken(): User | null {
    const token = this.getAccessToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return this.convertUserFromSnakeToCamel({
        id: payload.user_id,
        username: payload.username,
        email: payload.email,
        first_name: payload.first_name,
        last_name: payload.last_name,
        is_staff: payload.is_staff,
        is_superuser: payload.is_superuser,
        is_active: payload.is_active,
        date_joined: payload.date_joined,
        last_login: payload.last_login,
        orcid_id: payload.orcid_id
      });
    } catch {
      return null;
    }
  }

  initiateORCIDLogin(rememberMe: boolean = false): Observable<{ authorizationUrl: string; state: string }> {
    const params = rememberMe ? '?remember_me=true' : '';
    return this.http.get<{ authorization_url: string; state: string }>(`${this.apiUrl}/auth/orcid/login/${params}`).pipe(
      map(response => ({ authorizationUrl: response.authorization_url, state: response.state }))
    );
  }

  exchangeAuthCode(authCode: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/exchange-code/`, { auth_code: authCode }).pipe(
      tap(response => this.setAuthData(response))
    );
  }

  handleORCIDCallback(code: string, state: string, rememberMe: boolean = false): Observable<AuthResponse> {
    const params = new URLSearchParams({ code, state, remember_me: rememberMe.toString() });
    return this.http.get<AuthResponse>(`${this.apiUrl}/auth/orcid/callback/?${params}`).pipe(
      tap(response => this.setAuthData(response))
    );
  }

  exchangeORCIDToken(accessToken: string, orcidId: string, rememberMe: boolean = false): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/orcid/token/`, {
      access_token: accessToken,
      orcid_id: orcidId,
      remember_me: rememberMe
    }).pipe(
      tap(response => this.setAuthData(response))
    );
  }

  login(username: string, password: string, rememberMe: boolean = false): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login/`, { username, password, remember_me: rememberMe }).pipe(
      tap(response => this.setAuthData(response))
    );
  }

  logout(): Observable<any> {
    const refreshToken = this.getRefreshToken();
    const payload = refreshToken ? { refresh: refreshToken } : {};
    return this.http.post(`${this.apiUrl}/auth/logout/`, payload).pipe(
      tap(() => this.clearAuthData())
    );
  }

  checkAuthStatus(): Observable<AuthStatus> {
    return this.http.get<AuthStatus>(`${this.apiUrl}/auth/status/`).pipe(
      tap(status => {
        if (status.authenticated && status.user) {
          this._currentUser.set(status.user);
          this._isAuthenticated.set(true);
        } else {
          this.clearAuthData();
        }
      })
    );
  }

  fetchUserProfile(): Observable<User> {
    return this.http.get<{ user: any }>(`${this.apiUrl}/auth/profile/`).pipe(
      map(response => this.convertUserFromSnakeToCamel(response.user)),
      tap(user => {
        this._currentUser.set(user);
        this._isAuthenticated.set(true);
      })
    );
  }

  getCurrentUser(): User | null {
    return this._currentUser();
  }

  isAuthenticated(): boolean {
    return this._isAuthenticated();
  }

  getAccessToken(): string | null {
    return localStorage.getItem('ccvAccessToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('ccvRefreshToken');
  }

  handleExternalLogin(response: AuthResponse): void {
    this.setAuthData(response);
  }

  private setAuthData(response: AuthResponse): void {
    const accessToken = response.accessToken || (response as any).access_token || (response as any).access;
    const refreshToken = response.refreshToken || (response as any).refresh_token || (response as any).refresh;

    localStorage.setItem('ccvAccessToken', accessToken);
    localStorage.setItem('ccvRefreshToken', refreshToken);
    const convertedUser = this.convertUserFromSnakeToCamel(response.user);
    this._currentUser.set(convertedUser);
    this._isAuthenticated.set(true);
    resetRefreshState();
  }

  tryRefreshToken(): Observable<{ access: string; refresh?: string }> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      this.clearAuthData();
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<{ access: string; refresh?: string }>(`${this.apiUrl}/auth/token/refresh/`, {
      refresh: refreshToken
    }).pipe(
      tap((response) => {
        localStorage.setItem('ccvAccessToken', response.access);
        if (response.refresh) {
          localStorage.setItem('ccvRefreshToken', response.refresh);
        }
        this._isAuthenticated.set(true);
        const user = this.getUserFromToken();
        if (user) {
          this._currentUser.set(user);
        }
        this.fetchUserProfile().subscribe({ next: () => {}, error: () => {} });
      }),
      catchError((error) => {
        this.clearAuthData();
        return throwError(() => error);
      })
    );
  }

  updateAuthStateAfterRefresh(): void {
    const token = this.getAccessToken();
    if (token && !this.isTokenExpired(token)) {
      this._isAuthenticated.set(true);
      const user = this.getUserFromToken();
      if (user) {
        this._currentUser.set(user);
      }
      this.fetchUserProfile().subscribe({ next: () => {}, error: () => {} });
    }
  }

  private clearAuthData(): void {
    localStorage.removeItem('ccvAccessToken');
    localStorage.removeItem('ccvRefreshToken');
    this._currentUser.set(null);
    this._isAuthenticated.set(false);
  }
}
