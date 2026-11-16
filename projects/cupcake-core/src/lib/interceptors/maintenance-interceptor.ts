import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { tap } from 'rxjs';

import { CUPCAKE_CORE_CONFIG } from '../services/auth';
import { MaintenanceReason, MaintenanceService } from '../services/maintenance';

/**
 * Why an API error means the backend is down: the appliance's maintenance reply or a gateway error while it
 * restarts, or no reply at all when it cannot be reached.
 */
export function backendDownReason(error: HttpErrorResponse): MaintenanceReason | null {
  if (error.status === 503 && error.error?.maintenance) {
    return 'restarting';
  }
  if (error.status === 502 || error.status === 504) {
    return 'restarting';
  }
  if (error.status === 0) {
    return 'unreachable';
  }
  return null;
}

/**
 * Shows the maintenance overlay when calls to the backend fail because it is restarting or out of reach.
 */
export const maintenanceInterceptor: HttpInterceptorFn = (req, next) => {
  const maintenance = inject(MaintenanceService);
  const apiUrl = inject(CUPCAKE_CORE_CONFIG, { optional: true })?.apiUrl;
  if (!apiUrl || !req.url.startsWith(apiUrl)) {
    return next(req);
  }
  return next(req).pipe(
    tap({
      error: (error: unknown) => {
        const reason = error instanceof HttpErrorResponse ? backendDownReason(error) : null;
        if (reason) {
          maintenance.start(reason);
        }
      }
    })
  );
};
