import { Injectable, InjectionToken } from '@angular/core';

export interface WebSocketEndpointConfig {
  app: string;
  endpoint: string;
  description?: string;
}

export const WEBSOCKET_ENDPOINTS = new InjectionToken<WebSocketEndpointConfig[]>('WEBSOCKET_ENDPOINTS');

export class WebSocketEndpoints {
  static readonly CORE_NOTIFICATIONS = 'notifications';
  static readonly CORE_ADMIN = 'admin';
  static readonly CCV_NOTIFICATIONS = 'ccv/notifications';
  static readonly CCV_ADMIN = 'ccv/admin';
  static readonly CCM_NOTIFICATIONS = 'ccm/notifications';
  static readonly CCRV_NOTIFICATIONS = 'ccrv/notifications';
  static readonly CCSC_NOTIFICATIONS = 'ccsc/notifications';
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketConfigService {
  private readonly endpoints: Map<string, WebSocketEndpointConfig> = new Map();

  constructor() {
    this.registerDefaultEndpoints();
  }

  private registerDefaultEndpoints(): void {
    this.registerEndpoint({
      app: 'core',
      endpoint: WebSocketEndpoints.CORE_NOTIFICATIONS,
      description: 'Core notification endpoint'
    });

    this.registerEndpoint({
      app: 'core',
      endpoint: WebSocketEndpoints.CORE_ADMIN,
      description: 'Core admin notification endpoint'
    });

    this.registerEndpoint({
      app: 'ccv',
      endpoint: WebSocketEndpoints.CCV_NOTIFICATIONS,
      description: 'CCV notification endpoint'
    });

    this.registerEndpoint({
      app: 'ccv',
      endpoint: WebSocketEndpoints.CCV_ADMIN,
      description: 'CCV admin notification endpoint'
    });

    this.registerEndpoint({
      app: 'ccm',
      endpoint: WebSocketEndpoints.CCM_NOTIFICATIONS,
      description: 'CCM notification endpoint'
    });

    this.registerEndpoint({
      app: 'ccrv',
      endpoint: WebSocketEndpoints.CCRV_NOTIFICATIONS,
      description: 'CCRV notification endpoint'
    });

    this.registerEndpoint({
      app: 'ccsc',
      endpoint: WebSocketEndpoints.CCSC_NOTIFICATIONS,
      description: 'CCSC notification endpoint'
    });
  }

  registerEndpoint(config: WebSocketEndpointConfig): void {
    this.endpoints.set(config.endpoint, config);
  }

  getEndpoint(endpoint: string): WebSocketEndpointConfig | undefined {
    return this.endpoints.get(endpoint);
  }

  getEndpointsForApp(app: string): WebSocketEndpointConfig[] {
    return Array.from(this.endpoints.values()).filter(config => config.app === app);
  }

  getAllEndpoints(): WebSocketEndpointConfig[] {
    return Array.from(this.endpoints.values());
  }

  validateEndpoint(endpoint: string): boolean {
    return this.endpoints.has(endpoint);
  }

  getDefaultEndpointForApp(app: string): string {
    const endpoints = this.getEndpointsForApp(app);
    if (endpoints.length === 0) {
      return WebSocketEndpoints.CORE_NOTIFICATIONS;
    }

    const notificationEndpoint = endpoints.find(e => e.endpoint.includes('notifications'));
    return notificationEndpoint?.endpoint || endpoints[0].endpoint;
  }
}