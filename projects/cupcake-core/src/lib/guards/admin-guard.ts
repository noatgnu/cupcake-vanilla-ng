import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

/**
 * Admin guard that restricts access to routes requiring administrative privileges
 * 
 * This guard checks if the user is authenticated and has staff permissions.
 * Non-admin users are redirected to the main application area.
 * 
 * @param route - The activated route snapshot
 * @param state - The router state snapshot
 * @returns Boolean indicating if navigation is allowed
 * 
 * @example Admin route protection
 * ```typescript
 * // In your routing module
 * const routes: Routes = [
 *   {
 *     path: 'admin',
 *     canActivate: [authGuard, adminGuard],
 *     children: [
 *       { path: 'users', component: UserManagementComponent },
 *       { path: 'lab-groups', component: LabGroupManagementComponent },
 *       { path: 'site-config', component: SiteConfigComponent }
 *     ]
 *   }
 * ];
 * ```
 * 
 * @example Combined with auth guard
 * ```typescript
 * // Ensure user is authenticated AND has admin privileges
 * const routes: Routes = [
 *   {
 *     path: 'admin/settings',
 *     component: AdminSettingsComponent,
 *     canActivate: [authGuard, adminGuard]  // Order matters: auth first, then admin
 *   }
 * ];
 * ```
 * 
 * @example Multiple admin routes
 * ```typescript
 * const adminRoutes: Routes = [
 *   {
 *     path: 'admin',
 *     canActivateChild: [adminGuard],  // Protect all child routes
 *     children: [
 *       { path: 'dashboard', component: AdminDashboardComponent },
 *       { path: 'reports', component: AdminReportsComponent },
 *       { path: 'audit', component: AuditLogComponent }
 *     ]
 *   }
 * ];
 * ```
 */
export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.getCurrentUser();
  
  if (!user) {
    router.navigate(['/login']);
    return false;
  }

  if (!user.is_staff) {
    router.navigate(['/metadata']);
    return false;
  }

  return true;
};
