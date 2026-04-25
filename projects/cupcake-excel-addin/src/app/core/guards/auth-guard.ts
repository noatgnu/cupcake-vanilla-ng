import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@noatgnu/cupcake-core';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.authenticated()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};
