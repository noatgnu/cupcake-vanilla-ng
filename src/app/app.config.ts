import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';

import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { authInterceptor, CUPCAKE_CORE_CONFIG, CupcakeCoreConfig } from "@noatgnu/cupcake-core";
import { EnvironmentService } from './shared/services/environment';

/**
 * Resolves the runtime API URL before the first navigation so desktop builds
 * talk to the port the embedded backend actually bound instead of the
 * compile-time default.
 */
async function resolveApiUrl(): Promise<void> {
  const environmentService = inject(EnvironmentService);
  const coreConfig = inject(CUPCAKE_CORE_CONFIG);
  await environmentService.refreshEnvironment();
  coreConfig.apiUrl = environmentService.getApiUrl();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withHashLocation()),
    { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: environment.apiUrl } satisfies CupcakeCoreConfig },
    provideAppInitializer(resolveApiUrl),
    provideHttpClient(withXhr(),
      withInterceptors([authInterceptor])
    )
  ]
};
