import { Injectable, signal, computed, inject, InjectionToken, effect, untracked } from '@angular/core';
import { Subject, Observable, timer, EMPTY } from 'rxjs';
import { takeUntil, switchMap, tap } from 'rxjs/operators';
import { AuthService, CUPCAKE_CORE_CONFIG } from './auth';

export const WEBSOCKET_ENDPOINT = new InjectionToken<string>('WEBSOCKET_ENDPOINT', {
  providedIn: 'root',
  factory: () => 'ccc/notifications'
});

export interface WebSocketMessage {
  type: string;
  message?: string;
  timestamp?: string;
  [key: string]: unknown;
}

export interface WebSocketSubscriptionOptions {
  tableId?: number;
  userId?: number;
  [key: string]: unknown;
}

export interface WebSocketConfig {
  url: string;
  endpoint?: string;
  protocols?: string[];
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  pingInterval?: number;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  protected ws: WebSocket | null = null;
  protected config: WebSocketConfig;
  protected destroy$ = new Subject<void>();
  protected reconnectAttempts = 0;
  protected isConnecting = false;

  protected connectionState = signal<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  protected lastError = signal<string | null>(null);

  protected messageSubject = new Subject<WebSocketMessage>();
  private _connected = signal<boolean>(false);

  readonly messages$ = this.messageSubject.asObservable();
  readonly isConnected = this._connected.asReadonly();
  readonly connectionState$ = computed(() => this.connectionState());
  readonly lastError$ = computed(() => this.lastError());

  protected config_token = inject(CUPCAKE_CORE_CONFIG);
  protected endpoint = inject(WEBSOCKET_ENDPOINT, { optional: true }) || 'ccc/notifications';
  protected authService = inject(AuthService);

  constructor() {
    this.config = {
      url: this.getWebSocketUrl(),
      endpoint: this.endpoint,
      reconnectInterval: this.getAdaptiveReconnectInterval(),
      maxReconnectAttempts: 3
    };

    effect(() => {
      const isAuthenticated = this.authService.authenticated();
      if (!isAuthenticated && this.ws) {
        untracked(() => {
          this.disconnect();
        });
      }
    });

    this.setupBrowserResourceHandling();
  }

  protected getWebSocketUrl(): string {
    const endpoint = this.config?.endpoint || 'ccc/notifications';

    if (this.config_token.websocketUrl) {
      const wsUrl = this.config_token.websocketUrl.replace(/\/$/, '');
      return `${wsUrl}/${endpoint}/`;
    }

    const apiUrl = this.config_token.apiUrl;

    try {
      const url = new URL(apiUrl);
      const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = url.host;

      return `${protocol}//${host}/ws/${endpoint}/`;
    } catch {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      return `${protocol}//${host}/ws/${endpoint}/`;
    }
  }

  connect(): void {
    if (this.isConnecting) {
      return;
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
      this.ws.close();
      this.ws = null;
    }

    const token = this.authService.getAccessToken();
    if (!token) {
      this.lastError.set('Authentication required');
      this.connectionState.set('error');
      return;
    }

    this.isConnecting = true;
    this.connectionState.set('connecting');
    this.lastError.set(null);

    try {
      const wsUrl = `${this.config.url}?token=${encodeURIComponent(token)}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onmessage = this.onMessage.bind(this);
      this.ws.onerror = this.onError.bind(this);
      this.ws.onclose = this.onClose.bind(this);

      const connectionTimeout = setTimeout(() => {
        if (this.ws?.readyState === WebSocket.CONNECTING) {
          this.ws.close();
          this.lastError.set('Connection timeout');
          this.connectionState.set('error');
          this.isConnecting = false;
        }
      }, 10000);

      this.ws.onopen = (event) => {
        clearTimeout(connectionTimeout);
        this.onOpen(event);
      };

    } catch (error) {
      this.connectionState.set('error');
      this.lastError.set('Connection failed');
      this.isConnecting = false;
    }
  }

  disconnect(): void {
    this.destroy$.next();
    this.isConnecting = false;

    if (this.ws) {
      this.ws.close(1000, 'User disconnected');
      this.ws = null;
    }

    this.connectionState.set('disconnected');
    this._connected.set(false);
    this.reconnectAttempts = 0;
  }

  send(message: Record<string, unknown>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  subscribe(subscriptionType: string, options: WebSocketSubscriptionOptions = {}): void {
    this.send({
      type: 'subscribe',
      subscription_type: subscriptionType,
      ...options
    });
  }

  protected onOpen(_event: Event): void {
    this.isConnecting = false;
    this.connectionState.set('connected');
    this._connected.set(true);
    this.reconnectAttempts = 0;
    this.lastError.set(null);
  }

  protected onMessage(event: MessageEvent): void {
    try {
      const data: WebSocketMessage = JSON.parse(event.data);
      this.messageSubject.next(data);
    } catch {
      // silently discard malformed messages
    }
  }

  protected onError(_event: Event): void {
    this.isConnecting = false;
    this.connectionState.set('error');
    this.lastError.set('Connection error occurred');
  }

  protected onClose(event: CloseEvent): void {
    this.isConnecting = false;
    this.connectionState.set('disconnected');
    this._connected.set(false);

    if (event.code === 4001) {
      this.lastError.set('Authentication failed');
      return;
    } else if (event.code === 4003) {
      this.lastError.set('Insufficient permissions');
      return;
    }

    if (event.code !== 1000 && this.reconnectAttempts < (this.config.maxReconnectAttempts || 5)) {
      this.attemptReconnection();
    }
  }

  protected attemptReconnection(): void {
    this.reconnectAttempts++;
    const delay = this.config.reconnectInterval || 5000;

    timer(delay).pipe(
      takeUntil(this.destroy$),
      tap(() => {
        if (this.reconnectAttempts <= (this.config.maxReconnectAttempts || 5)) {
          this.connect();
        } else {
          this.lastError.set('Connection failed - max attempts reached');
        }
      })
    ).subscribe();
  }

  filterMessages<T extends WebSocketMessage>(type: string): Observable<T> {
    return this.messages$.pipe(
      switchMap(message => message.type === type ? [message as T] : EMPTY)
    );
  }

  getNotifications(): Observable<WebSocketMessage> {
    return this.filterMessages('notification');
  }

  getSystemNotifications(): Observable<WebSocketMessage> {
    return this.filterMessages('system.notification');
  }

  reconnectWithNewToken(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.disconnect();
      setTimeout(() => this.connect(), 100);
    }
  }

  shouldConnect(): boolean {
    return this.authService.isAuthenticated() && !!this.authService.getAccessToken();
  }

  updateConfig(): void {
    this.config.url = this.getWebSocketUrl();
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  protected getAdaptiveReconnectInterval(): number {
    const baseInterval = 5000;
    const tabCount = this.estimateTabCount();

    if (tabCount > 20) {
      return baseInterval * 3;
    } else if (tabCount > 10) {
      return baseInterval * 2;
    }

    return baseInterval;
  }

  protected estimateTabCount(): number {
    try {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedMB = memory.usedJSHeapSize / (1024 * 1024);

        if (usedMB > 500) return 25;
        if (usedMB > 300) return 15;
        if (usedMB > 150) return 10;
        return 5;
      }

      return 10;
    } catch {
      return 10;
    }
  }

  protected canConnectSafely(): boolean {
    try {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedMB = memory.usedJSHeapSize / (1024 * 1024);
        const totalMB = memory.totalJSHeapSize / (1024 * 1024);

        const memoryUsageRatio = usedMB / totalMB;
        if (memoryUsageRatio > 0.9) {
          return false;
        }
      }

      const tabCount = this.estimateTabCount();
      if (tabCount > 30) {
        return false;
      }

      return true;
    } catch {
      return true;
    }
  }

  protected setupBrowserResourceHandling(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        if (this.shouldConnect() && this.connectionState() === 'disconnected') {
          setTimeout(() => this.connect(), 1000);
        }
      }
    });

    window.addEventListener('beforeunload', () => {
      if (this.ws) {
        this.ws.close(1000, 'Page unloading');
      }
    });
  }
}
