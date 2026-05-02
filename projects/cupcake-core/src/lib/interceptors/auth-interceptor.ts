import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse, HttpClient, HttpRequest, HttpEvent, HttpHandlerFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError, switchMap, take, Observable, Subject } from 'rxjs';
import { CUPCAKE_CORE_CONFIG } from '../services/auth';

let isRefreshing = false;
let refreshSubject: Subject<string> | null = null;

export function resetRefreshState(): void {
  isRefreshing = false;
  if (refreshSubject) {
    refreshSubject.complete();
    refreshSubject = null;
  }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const http = inject(HttpClient);
  const config = inject(CUPCAKE_CORE_CONFIG);

  if (
    req.url.includes('/auth/login/') ||
    req.url.includes('/auth/token/') ||
    req.url.includes('/auth/orcid/') ||
    req.url.includes('/auth/register/') ||
    req.url.includes('/auth/exchange-code/') ||
    req.url.includes('/site-config/public/') ||
    req.url.includes('/users/auth_config/') ||
    req.url.includes('/users/registration_status/') ||
    req.url.includes('/excel-launch/claim/')
  ) {
    return next(req);
  }

  const token = localStorage.getItem('ccvAccessToken');

  const authReq = token ? addTokenToRequest(req, token) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        return handle401Error(authReq, next, http, router, config);
      }
      return throwError(() => error);
    })
  );
};

function addTokenToRequest(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return request.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

function handle401Error(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
  http: HttpClient,
  router: Router,
  config: { apiUrl: string },
): Observable<HttpEvent<unknown>> {
  if (isRefreshing) {
    if (!refreshSubject) {
      return throwError(() => new Error('Refresh in progress but subject lost'));
    }
    return refreshSubject.pipe(
      take(1),
      switchMap((token) => next(addTokenToRequest(request, token))),
    );
  }

  const storedRefreshToken = localStorage.getItem('ccvRefreshToken');

  if (!storedRefreshToken) {
    dispatchAuthCleared();
    router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
    return throwError(() => new Error('No refresh token available'));
  }

  isRefreshing = true;
  refreshSubject = new Subject<string>();

  return http
    .post<{ access: string; refresh?: string }>(`${config.apiUrl}/auth/token/refresh/`, {
      refresh: storedRefreshToken,
    })
    .pipe(
      switchMap((tokenResponse): Observable<HttpEvent<unknown>> => {
        const newAccess = tokenResponse.access;
        localStorage.setItem('ccvAccessToken', newAccess);

        if (tokenResponse.refresh) {
          localStorage.setItem('ccvRefreshToken', tokenResponse.refresh);
        }

        const subject = refreshSubject!;
        isRefreshing = false;
        refreshSubject = null;

        subject.next(newAccess);
        subject.complete();

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('tokenRefreshed'));
        }

        return next(addTokenToRequest(request, newAccess));
      }),
      catchError((refreshError) => {
        const subject = refreshSubject!;
        isRefreshing = false;
        refreshSubject = null;

        localStorage.removeItem('ccvAccessToken');
        localStorage.removeItem('ccvRefreshToken');

        subject.error(refreshError);

        dispatchAuthCleared();
        router.navigate(['/login'], { queryParams: { returnUrl: router.url } });

        return throwError(() => refreshError);
      }),
    );
}

function dispatchAuthCleared(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('authCleared'));
  }
}
