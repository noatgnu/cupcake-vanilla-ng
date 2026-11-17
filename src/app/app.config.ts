import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';

import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { AuthService, authInterceptor, maintenanceInterceptor, CUPCAKE_CORE_CONFIG, CupcakeCoreConfig } from "@noatgnu/cupcake-core";
import { DesktopService } from "@noatgnu/cupcake-vanilla";
import { EnvironmentService } from './shared/services/environment';

/**
 * Resolves the runtime API URL before the first navigation so desktop builds
 * talk to the port the embedded backend actually bound instead of the
 * compile-time default, then signs in the account the desktop launcher signs
 * in automatically, when the user chose automatic sign-in.
 */
async function resolveApiUrl(): Promise<void> {
  const environmentService = inject(EnvironmentService);
  const coreConfig = inject(CUPCAKE_CORE_CONFIG);
  const desktop = inject(DesktopService);
  const authService = inject(AuthService);
  await environmentService.refreshEnvironment();
  coreConfig.apiUrl = environmentService.getApiUrl();
  if (!desktop.isDesktop) {
    return;
  }
  try {
    const signIn = await desktop.getAutomaticSignIn();
    if (signIn) {
      authService.handleExternalLogin(signIn);
    }
  } catch (error) {
    await desktop.logToFile(`Automatic sign-in failed, showing the login screen: ${error}`);
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withHashLocation()),
    { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: environment.apiUrl } satisfies CupcakeCoreConfig },
    provideAppInitializer(resolveApiUrl),
    provideHttpClient(withXhr(),
      withInterceptors([authInterceptor, maintenanceInterceptor])
    )
  ]
};
