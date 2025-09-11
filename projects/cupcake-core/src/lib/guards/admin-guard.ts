import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.getCurrentUser();
  
  if (!user) {
    router.navigate(['/login']);
    return false;
  }

  if (!user.isStaff) {
    router.navigate(['/metadata']);
    return false;
  }

  return true;
};
