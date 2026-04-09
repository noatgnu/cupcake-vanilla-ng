import { ApplicationConfig, provideZonelessChangeDetection, Injectable, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { LocationStrategy, HashLocationStrategy } from '@angular/common';
import { routes } from './app.routes';
import { CUPCAKE_CORE_CONFIG, CupcakeCoreConfig, authInterceptor } from '@noatgnu/cupcake-core';
import { ConnectionService } from './core/services/connection.service';

@Injectable()
export class SafeHashLocationStrategy extends HashLocationStrategy {
  override replaceState(state: any, title: string, url: string, queryParams: string): void {
    try {
      super.replaceState(state, title, url, queryParams);
    } catch {
    }
  }

  override pushState(state: any, title: string, url: string, queryParams: string): void {
    try {
      super.pushState(state, title, url, queryParams);
    } catch {
    }
  }
}

class DynamicCupcakeConfig implements CupcakeCoreConfig {
  constructor(private connectionService: ConnectionService) {}

  get apiUrl(): string {
    return this.connectionService.baseUrl();
  }
}

function cupcakeConfigFactory(connectionService: ConnectionService): CupcakeCoreConfig {
  return new DynamicCupcakeConfig(connectionService);
}

function initializeConnection(connectionService: ConnectionService): () => Promise<void> {
  return async () => {
    await connectionService.testConnection();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: LocationStrategy, useClass: SafeHashLocationStrategy },
    {
      provide: CUPCAKE_CORE_CONFIG,
      useFactory: cupcakeConfigFactory,
      deps: [ConnectionService]
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeConnection,
      deps: [ConnectionService],
      multi: true
    }
  ]
};
