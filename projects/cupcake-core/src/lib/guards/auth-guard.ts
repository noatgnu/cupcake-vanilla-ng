import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { AuthService } from '../services/auth';

function getCleanReturnUrl(currentUrl: string): string {
  try {
    const url = new URL(currentUrl, window.location.origin);
    if (url.pathname === '/login') {
      const innerReturnUrl = url.searchParams.get('returnUrl');
      if (innerReturnUrl) {
        return getCleanReturnUrl(innerReturnUrl);
      }
      return '/';
    }
    return url.pathname + url.search;
  } catch {
    if (currentUrl.startsWith('/login')) {
      const urlParams = new URLSearchParams(currentUrl.split('?')[1]);
      const innerReturnUrl = urlParams.get('returnUrl');
      if (innerReturnUrl) {
        return getCleanReturnUrl(innerReturnUrl);
      }
      return '/';
    }
    return currentUrl;
  }
}

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.authenticated()) {
    return true;
  }

  if (authService.getRefreshToken()) {
    return authService.tryRefreshToken().pipe(
      map(() => true),
      catchError(() => {
        router.navigate(['/login'], { queryParams: { returnUrl: getCleanReturnUrl(state.url) } });
        return of(false);
      })
    );
  }

  router.navigate(['/login'], { queryParams: { returnUrl: getCleanReturnUrl(state.url) } });
  return false;
};
