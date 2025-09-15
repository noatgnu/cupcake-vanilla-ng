import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

/**
 * Extract original return URL to prevent accumulating login URLs
 */
function getCleanReturnUrl(currentUrl: string): string {
  try {
    const url = new URL(currentUrl, window.location.origin);

    // If current URL is already a login page, extract its returnUrl
    if (url.pathname === '/login') {
      const innerReturnUrl = url.searchParams.get('returnUrl');
      if (innerReturnUrl) {
        // Recursively clean in case of nested login URLs
        return getCleanReturnUrl(innerReturnUrl);
      }
      // If no returnUrl in login URL, use home page
      return '/';
    }

    // Return clean URL without origin
    return url.pathname + url.search;
  } catch (error) {
    // Fallback for relative URLs
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

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.getCurrentUser();

  if (!user) {
    // Clean the return URL to prevent login URL accumulation
    const cleanReturnUrl = getCleanReturnUrl(state.url);

    router.navigate(['/login'], {
      queryParams: { returnUrl: cleanReturnUrl }
    });
    return false;
  }

  if (!user.isStaff) {
    router.navigate(['/metadata']);
    return false;
  }

  return true;
};
