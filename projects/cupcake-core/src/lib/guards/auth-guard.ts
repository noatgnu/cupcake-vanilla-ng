import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { map, take } from 'rxjs';

/**
 * Extract original return URL to prevent accumulating login URLs
 */
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
  } catch (error) {
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

  return authService.isAuthenticated$.pipe(
    take(1),
    map(isAuthenticated => {
      if (isAuthenticated) {
        return true;
      }

      const cleanReturnUrl = getCleanReturnUrl(state.url);

      router.navigate(['/login'], {
        queryParams: { returnUrl: cleanReturnUrl }
      });

      return false;
    })
  );
};
