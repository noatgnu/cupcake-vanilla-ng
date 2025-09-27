import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ElectronService } from './electron';
import { environment } from '../../../environments/environment';

export interface DynamicEnvironment {
  production: boolean;
  apiUrl: string;
  websocketUrl: string;
  features: {
    asyncTasks: boolean;
  };
  isElectron: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class EnvironmentService {
  private environmentSubject = new BehaviorSubject<DynamicEnvironment>({
    ...environment,
    isElectron: false
  });

  public environment$ = this.environmentSubject.asObservable();

  constructor(private electronService: ElectronService) {
    this.initializeEnvironment();
  }

  get currentEnvironment(): DynamicEnvironment {
    return this.environmentSubject.value;
  }

  private async initializeEnvironment(): Promise<void> {
    if (this.electronService.isElectron) {
      try {
        const backendPort = await this.electronService.getBackendPort();

        const electronEnvironment: DynamicEnvironment = {
          production: environment.production,
          apiUrl: `http://localhost:${backendPort}/api/v1`,
          websocketUrl: `ws://localhost:${backendPort}/ws/notifications/`,
          features: environment.features,
          isElectron: true
        };

        this.environmentSubject.next(electronEnvironment);
        console.log(`Electron environment initialized with backend port: ${backendPort}`);
      } catch (error) {
        console.error('Failed to get backend port from Electron:', error);
        // Fallback to default environment but mark as Electron
        this.environmentSubject.next({
          ...environment,
          isElectron: true
        });
      }
    } else {
      // Browser environment - use static configuration
      this.environmentSubject.next({
        ...environment,
        isElectron: false
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
    return this.currentEnvironment.websocketUrl;
  }

  isElectron(): boolean {
    return this.currentEnvironment.isElectron;
  }

  isProduction(): boolean {
    return this.currentEnvironment.production;
  }
}
