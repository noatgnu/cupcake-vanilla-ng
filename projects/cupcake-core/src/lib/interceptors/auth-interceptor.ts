import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse, HttpClient, HttpRequest, HttpEvent, HttpHandlerFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError, switchMap, BehaviorSubject, filter, take, Observable } from 'rxjs';
import { CUPCAKE_CORE_CONFIG } from '../services/auth';

// Global flag to prevent multiple simultaneous token refresh attempts
let isRefreshing = false;
// Subject to coordinate requests waiting for token refresh
const refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

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

  const token = localStorage.getItem('ccvAccessToken');

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

function addTokenToRequest(request: HttpRequest<any>, token: string): HttpRequest<any> {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}

function handle401Error(request: HttpRequest<any>, next: HttpHandlerFn, http: HttpClient, router: Router, config: any): Observable<HttpEvent<unknown>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    const refreshToken = localStorage.getItem('ccvRefreshToken');
    
    if (refreshToken) {
      return http.post<{access: string}>(`${config.apiUrl}/auth/token/refresh/`, {
        refresh: refreshToken
      }).pipe(
        switchMap((tokenResponse: {access: string}): Observable<HttpEvent<unknown>> => {
          isRefreshing = false;
          
          // Update stored tokens
          localStorage.setItem('ccvAccessToken', tokenResponse.access);
          refreshTokenSubject.next(tokenResponse.access);
          
          // Notify AuthService that token was refreshed
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('tokenRefreshed'));
          }
          
          // Retry the original request with new token
          return next(addTokenToRequest(request, tokenResponse.access));
        }),
        catchError((refreshError) => {
          // Refresh failed, clear tokens and redirect to login
          isRefreshing = false;
          localStorage.removeItem('ccvAccessToken');
          localStorage.removeItem('ccvRefreshToken');
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
      localStorage.removeItem('ccvAccessToken');
      localStorage.removeItem('ccvRefreshToken');
      
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
