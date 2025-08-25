import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse, HttpClient, HttpRequest, HttpEvent, HttpHandlerFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError, switchMap, BehaviorSubject, filter, take, Observable } from 'rxjs';
import { CUPCAKE_CORE_CONFIG } from '../services/auth';

/** Global flag to prevent multiple simultaneous token refresh attempts */
let isRefreshing = false;
/** Subject to coordinate requests waiting for token refresh */
const refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

/**
 * HTTP interceptor that handles JWT authentication and automatic token refresh
 * 
 * This interceptor automatically:
 * - Adds JWT tokens to outgoing requests
 * - Handles 401 responses with automatic token refresh
 * - Coordinates multiple requests during token refresh
 * - Redirects to login on authentication failure
 * 
 * @param req - The outgoing HTTP request
 * @param next - The next handler in the interceptor chain
 * @returns Observable of the HTTP event
 * 
 * @example Interceptor registration
 * ```typescript
 * // In app.config.ts or main.ts
 * import { authInterceptor } from 'cupcake-core';
 * 
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideHttpClient(
 *       withInterceptors([authInterceptor])
 *     )
 *   ]
 * };
 * ```
 * 
 * @example Automatic token handling
 * ```typescript
 * // The interceptor automatically handles authentication for you
 * this.http.get('/api/protected-resource').subscribe({
 *   next: (data) => {
 *     // Data received successfully
 *     // If token was expired, it was refreshed automatically
 *   },
 *   error: (error) => {
 *     // If refresh failed, user is redirected to login
 *   }
 * });
 * ```
 * 
 * @example Excluded endpoints
 * ```typescript
 * // These endpoints bypass the interceptor:
 * // - /auth/login/
 * // - /auth/token/
 * // - /auth/orcid/
 * // - /auth/register/
 * // - /site-config/public/
 * ```
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const http = inject(HttpClient);
  const config = inject(CUPCAKE_CORE_CONFIG);

  if (req.url.includes('/auth/login/') || 
      req.url.includes('/auth/token/') || 
      req.url.includes('/auth/orcid/') || 
      req.url.includes('/auth/register/') ||
      req.url.includes('/site-config/public/')) {
    return next(req);
  }

  const token = localStorage.getItem('ccv_access_token');

  let authReq = req;
  if (token) {
    authReq = addTokenToRequest(req, token);
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        return handle401Error(authReq, next, http, router, config);
      }
      
      return throwError(() => error);
    })
  );
};

/**
 * Add JWT token to the Authorization header of an HTTP request
 * @param request - The HTTP request to modify
 * @param token - The JWT token to add
 * @returns Cloned request with Authorization header
 * @example
 * ```typescript
 * const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...';
 * const authenticatedRequest = addTokenToRequest(originalRequest, token);
 * // Results in header: Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
 * ```
 */
function addTokenToRequest(request: HttpRequest<any>, token: string): HttpRequest<any> {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}

/**
 * Handle 401 Unauthorized errors with automatic token refresh
 * 
 * This function coordinates token refresh to prevent race conditions when
 * multiple requests fail simultaneously due to expired tokens.
 * 
 * @param request - The original HTTP request that failed
 * @param next - The HTTP handler to retry the request
 * @param http - HTTP client for making refresh requests
 * @param router - Router for navigation on auth failure
 * @param config - Configuration containing API URL
 * @returns Observable of the HTTP event after refresh attempt
 * 
 * @example Token refresh flow
 * ```typescript
 * // When a request returns 401:
 * // 1. Check if refresh is already in progress
 * // 2. If not, start refresh with stored refresh token
 * // 3. On success: update tokens, retry original request
 * // 4. On failure: clear tokens, redirect to login
 * // 5. Other requests wait for refresh to complete
 * ```
 */
function handle401Error(request: HttpRequest<any>, next: HttpHandlerFn, http: HttpClient, router: Router, config: any): Observable<HttpEvent<unknown>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    const refreshToken = localStorage.getItem('ccv_refresh_token');
    console.log('Interceptor handle401Error - refreshToken:', refreshToken);
    console.log('Interceptor handle401Error - timestamp:', new Date().toISOString());
    console.log('Interceptor handle401Error - localStorage keys:', Object.keys(localStorage));
    console.log('Interceptor handle401Error - all localStorage ccv keys:', 
      Object.keys(localStorage).filter(key => key.startsWith('ccv_')));
    
    if (refreshToken) {
      return http.post<{access: string}>(`${config.apiUrl}/auth/token/refresh/`, {
        refresh: refreshToken
      }).pipe(
        switchMap((tokenResponse: {access: string}): Observable<HttpEvent<unknown>> => {
          isRefreshing = false;
          console.log('Interceptor handle401Error - refresh success:', tokenResponse);
          
          // Update stored tokens
          localStorage.setItem('ccv_access_token', tokenResponse.access);
          refreshTokenSubject.next(tokenResponse.access);
          
          // Notify AuthService that token was refreshed
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('tokenRefreshed'));
          }
          
          // Retry the original request with new token
          return next(addTokenToRequest(request, tokenResponse.access));
        }),
        catchError((refreshError) => {
          console.log('Interceptor handle401Error - refresh failed:', refreshError);
          // Refresh failed, clear tokens and redirect to login
          isRefreshing = false;
          localStorage.removeItem('ccv_access_token');
          localStorage.removeItem('ccv_refresh_token');
          refreshTokenSubject.next(null);
          
          // Notify AuthService that auth was cleared
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('authCleared'));
          }
          
          router.navigate(['/login'], {
            queryParams: { returnUrl: router.url }
          });
          
          return throwError(() => refreshError) as Observable<HttpEvent<unknown>>;
        })
      );
    } else {
      // No refresh token, clear storage and redirect
      isRefreshing = false;
      localStorage.removeItem('ccv_access_token');
      localStorage.removeItem('ccv_refresh_token');
      
      // Notify AuthService that auth was cleared
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('authCleared'));
      }
      
      router.navigate(['/login'], {
        queryParams: { returnUrl: router.url }
      });
      
      return throwError(() => new Error('No refresh token available')) as Observable<HttpEvent<unknown>>;
    }
  } else {
    // If refresh is in progress, wait for it to complete
    return refreshTokenSubject.pipe(
      filter((token): token is string => token !== null),
      take(1),
      switchMap((token: string): Observable<HttpEvent<unknown>> => {
        return next(addTokenToRequest(request, token));
      })
    );
  }
}
