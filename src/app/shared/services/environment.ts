import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DesktopService } from '@noatgnu/cupcake-vanilla';
import { DesktopRuntime } from '@noatgnu/cupcake-core';
import { environment } from '../../../environments/environment';

export interface DynamicEnvironment {
  production: boolean;
  apiUrl: string;
  websocketUrl?: string;
  features: {
    asyncTasks: boolean;
  };
  isDesktop: boolean;
  runtime: DesktopRuntime;
}

@Injectable({
  providedIn: 'root'
})
export class EnvironmentService {
  private desktopService = inject(DesktopService);

  private environmentSubject = new BehaviorSubject<DynamicEnvironment>({
    ...environment,
    isDesktop: false,
    runtime: 'web'
  });

  public environment$ = this.environmentSubject.asObservable();

  constructor() {
    this.initializeEnvironment();
  }

  get currentEnvironment(): DynamicEnvironment {
    return this.environmentSubject.value;
  }

  private async initializeEnvironment(): Promise<void> {
    if (this.desktopService.isDesktop) {
      try {
        const backendPort = await this.desktopService.getBackendPort();

        const desktopEnvironment: DynamicEnvironment = {
          production: environment.production,
          apiUrl: `http://localhost:${backendPort}/api/v1`,
          features: environment.features,
          isDesktop: true,
          runtime: this.desktopService.runtime
        };

        this.environmentSubject.next(desktopEnvironment);
        console.log(`Desktop environment (${this.desktopService.runtime}) initialized with backend port: ${backendPort}`);
      } catch (error) {
        console.error('Failed to get backend port:', error);
        this.environmentSubject.next({
          ...environment,
          isDesktop: true,
          runtime: this.desktopService.runtime
        });
      }
    } else {
      this.environmentSubject.next({
        ...environment,
        isDesktop: false,
        runtime: 'web'
      });
    }
  }

  async refreshEnvironment(): Promise<void> {
    await this.initializeEnvironment();
  }

  getApiUrl(): string {
    return this.currentEnvironment.apiUrl;
  }

  getWebsocketUrl(): string {
    if (this.currentEnvironment.websocketUrl) {
      return this.currentEnvironment.websocketUrl;
    }

    const apiUrl = this.currentEnvironment.apiUrl;
    try {
      const url = new URL(apiUrl);
      const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = url.host;
      return `${protocol}//${host}/ws/ccc/notifications/`;
    } catch (error) {
      console.error('Invalid API URL:', apiUrl);
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      return `${protocol}//${host}/ws/ccc/notifications/`;
    }
  }

  isDesktop(): boolean {
    return this.currentEnvironment.isDesktop;
  }

  isElectron(): boolean {
    return this.currentEnvironment.runtime === 'electron';
  }

  isWails(): boolean {
    return this.currentEnvironment.runtime === 'wails';
  }

  isProduction(): boolean {
    return this.currentEnvironment.production;
  }
}
