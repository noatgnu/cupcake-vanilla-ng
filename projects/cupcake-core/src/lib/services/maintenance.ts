import { Injectable, inject, signal } from '@angular/core';
import { HttpBackend, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Subscription, catchError, map, of, switchMap, timer } from 'rxjs';

import { CUPCAKE_CORE_CONFIG } from './auth';

export type MaintenanceReason = 'restarting' | 'unreachable';

const CHECK_START_MS = 3000;
const CHECK_EVERY_MS = 4000;
const DOWN_STATUSES = [0, 502, 503, 504];

/**
 * Whether the backend is restarting or out of reach, and the checks that notice when it answers again.
 */
@Injectable({
  providedIn: 'root'
})
export class MaintenanceService {
  private readonly http = new HttpClient(inject(HttpBackend));
  private readonly config = inject(CUPCAKE_CORE_CONFIG, { optional: true });
  private checks?: Subscription;

  readonly active = signal(false);
  readonly reason = signal<MaintenanceReason>('restarting');

  /**
   * Show that the backend is down, and keep checking until it answers.
   */
  start(reason: MaintenanceReason): void {
    this.reason.set(reason);
    if (this.active()) {
      return;
    }
    this.active.set(true);
    this.checks = timer(CHECK_START_MS, CHECK_EVERY_MS).pipe(
      switchMap(() => this.http.get(`${this.config?.apiUrl ?? '/api/v1'}/appliance/network-info/`).pipe(
        map(() => true),
        catchError((error: HttpErrorResponse) => of(!DOWN_STATUSES.includes(error.status)))
      ))
    ).subscribe(up => {
      if (up) {
        this.stop();
      }
    });
  }

  stop(): void {
    this.checks?.unsubscribe();
    this.checks = undefined;
    this.active.set(false);
  }
}
