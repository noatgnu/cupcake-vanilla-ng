import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { map, take } from 'rxjs';

/**
 * Authentication guard that protects routes from unauthorized access
 * 
 * This guard checks if the user is authenticated and redirects to login if not.
 * It uses reactive authentication state for better responsiveness to auth changes.
 * 
 * @param route - The activated route snapshot
 * @param state - The router state snapshot
 * @returns Observable<boolean> indicating if navigation is allowed
 * 
 * @example Route protection
 * ```typescript
 * // In your routing module
 * const routes: Routes = [
 *   {
 *     path: 'dashboard',
 *     component: DashboardComponent,
 *     canActivate: [authGuard]
 *   },
 *   {
 *     path: 'profile',
 *     component: ProfileComponent,
 *     canActivate: [authGuard]
 *   }
 * ];
 * ```
 * 
 * @example Protecting child routes
 * ```typescript
 * const routes: Routes = [
 *   {
 *     path: 'admin',
 *     canActivate: [authGuard],
 *     children: [
 *       { path: 'users', component: UserManagementComponent },
 *       { path: 'settings', component: AdminSettingsComponent }
 *     ]
 *   }
 * ];
 * ```
 * 
 * @example Return URL handling
 * ```typescript
 * // When user is redirected to login, the attempted URL is preserved
 * // After successful login, they can be redirected back:
 * 
 * // In login component
 * ngOnInit() {
 *   this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
 * }
 * 
 * onLogin() {
 *   this.authService.login(username, password).subscribe(() => {
 *     this.router.navigate([this.returnUrl]);
 *   });
 * }
 * ```
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated$.pipe(
    take(1),
    map(isAuthenticated => {
      if (isAuthenticated) {
        return true;
      }

      router.navigate(['/login'], { 
        queryParams: { returnUrl: state.url } 
      });
      
      return false;
    })
  );
};
