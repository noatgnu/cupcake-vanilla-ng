import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse, HttpClient, HttpRequest, HttpEvent, HttpHandlerFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError, switchMap, BehaviorSubject, filter, take, Observable } from 'rxjs';
import { CUPCAKE_CORE_CONFIG } from '../services/auth';

let isRefreshing = false;
const refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const http = inject(HttpClient);
  const config = inject(CUPCAKE_CORE_CONFIG);

  // Skip auth for login/registration endpoints only, but allow profile and other authenticated endpoints
  if (req.url.includes('/auth/login/') || 
      req.url.includes('/auth/token/') || 
      req.url.includes('/auth/orcid/') || 
      req.url.includes('/auth/register/') ||
      req.url.includes('/site-config/public/')) {
    return next(req);
  }

  // Get the access token directly from localStorage
  const token = localStorage.getItem('ccv_access_token');

  // Clone the request and add the authorization header if token exists
  let authReq = req;
  if (token) {
    authReq = addTokenToRequest(req, token);
  }

  // Handle the request
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized responses
      if (error.status === 401) {
        return handle401Error(authReq, next, http, router, config);
      }
      
      // Re-throw other errors
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
