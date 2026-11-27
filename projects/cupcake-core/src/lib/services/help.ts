import { Injectable, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';

export interface HelpScreens {
  app: string;
  version: string;
  screens: Record<string, string>;
}

/**
 * The manual served with the app at /help/, and the page of it that explains the current screen.
 *
 * Screens are route paths such as `metadata-tables/:id`, as listed in the manual's screens.json.
 */
@Injectable({
  providedIn: 'root'
})
export class HelpService {
  static readonly BASE = '/help/';

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly screens = signal<Record<string, string> | null>(null);
  private readonly route = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.currentRoute())
    ),
    { initialValue: this.currentRoute() }
  );

  readonly available = computed(() => this.screens() !== null);
  readonly pageUrl = computed(() => (this.available() ? this.pageFor(this.route()) : null));

  constructor() {
    this.http.get<HelpScreens>(`${HelpService.BASE}screens.json`).subscribe({
      next: (manual) => this.screens.set(manual?.screens ?? {}),
      error: () => this.screens.set(null)
    });
  }

  /** The address of the manual's page for a route path, or of its first page when no page explains it. */
  pageFor(route: string): string {
    return HelpService.BASE + (this.screens()?.[route] ?? 'index.html');
  }

  /** The route path of the screen shown now, such as `metadata-tables/:id`. */
  currentRoute(): string {
    const parts: string[] = [];
    let snapshot = this.router.routerState.snapshot.root;
    while (snapshot) {
      const path = snapshot.routeConfig?.path;
      if (path) {
        parts.push(path);
      }
      snapshot = snapshot.firstChild!;
    }
    return parts.join('/');
  }
}
