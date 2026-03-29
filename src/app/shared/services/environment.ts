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
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  private environmentSubject = new BehaviorSubject<DynamicEnvironment>({
    ...environment,
    isDesktop: false,
    runtime: 'web'
  });

  public environment$ = this.environmentSubject.asObservable();

  get currentEnvironment(): DynamicEnvironment {
    return this.environmentSubject.value;
  }

  private async initializeEnvironment(): Promise<void> {
    if (this.desktopService.isDesktop) {
      try {
        const backendPort = await this.getBackendPortWithRetry(3, 500);

        const desktopEnvironment: DynamicEnvironment = {
          production: environment.production,
          apiUrl: `http://localhost:${backendPort}/api/v1`,
          features: environment.features,
          isDesktop: true,
          runtime: this.desktopService.runtime
        };

        this.environmentSubject.next(desktopEnvironment);
        this.desktopService.logToFile(`Desktop environment (${this.desktopService.runtime}) initialized with backend port: ${backendPort}`);
      } catch (error) {
        this.desktopService.logToFile(`Failed to get backend port: ${error}`);
        this.environmentSubject.next({
          ...environment,
          apiUrl: 'http://localhost:8000/api/v1',
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
    this.initialized = true;
  }

  private async getBackendPortWithRetry(maxRetries: number, delayMs: number): Promise<number> {
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const port = await Promise.race([
          this.desktopService.getBackendPort(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout getting backend port')), 5000)
          )
        ]);
        return port;
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    throw lastError || new Error('Failed to get backend port after retries');
  }

  async refreshEnvironment(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.initializeEnvironment();

    try {
      await this.initializationPromise;
    } finally {
      this.initializationPromise = null;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
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
