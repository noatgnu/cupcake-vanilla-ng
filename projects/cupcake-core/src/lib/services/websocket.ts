import { Injectable, signal, computed, inject, InjectionToken, Optional } from '@angular/core';
import { BehaviorSubject, Subject, Observable, timer, EMPTY } from 'rxjs';
import { takeUntil, switchMap, retry, tap } from 'rxjs/operators';
import { AuthService, CUPCAKE_CORE_CONFIG } from './auth';

export const WEBSOCKET_ENDPOINT = new InjectionToken<string>('WEBSOCKET_ENDPOINT', {
  providedIn: 'root',
  factory: () => 'ccc/notifications'
});

export interface WebSocketMessage {
  type: string;
  message?: string;
  timestamp?: string;
  [key: string]: any;
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
  protected connectionSubject = new BehaviorSubject<boolean>(false);

  readonly messages$ = this.messageSubject.asObservable();
  readonly isConnected$ = this.connectionSubject.asObservable();
  readonly connectionState$ = computed(() => this.connectionState());
  readonly lastError$ = computed(() => this.lastError());

  protected config_token = inject(CUPCAKE_CORE_CONFIG);
  protected endpoint = inject(WEBSOCKET_ENDPOINT, { optional: true }) || 'ccc/notifications';

  constructor(protected authService: AuthService) {
    this.config = {
      url: this.getWebSocketUrl(),
      endpoint: this.endpoint,
      reconnectInterval: this.getAdaptiveReconnectInterval(),
      maxReconnectAttempts: 3
    };

    this.authService.isAuthenticated$.subscribe(isAuthenticated => {
      if (!isAuthenticated && this.ws) {
        console.log('User logged out - disconnecting WebSocket');
        this.disconnect();
      }
    });

    this.setupBrowserResourceHandling();
  }

  protected getWebSocketUrl(): string {
    const apiUrl = this.config_token.apiUrl;

    try {
      const url = new URL(apiUrl);
      const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = url.host;
      const endpoint = this.config?.endpoint || 'ccc/notifications';

      return `${protocol}//${host}/ws/${endpoint}/`;
    } catch (error) {
      console.error('Invalid API URL in cupcake config:', apiUrl);

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const endpoint = this.config?.endpoint || 'ccc/notifications';
      return `${protocol}//${host}/ws/${endpoint}/`;
    }
  }

  connect(): void {
    console.log('🔌 WebSocket connect() called');
    console.log('🔌 Current connection state:', this.connectionState());
    console.log('🔌 WebSocket URL:', this.config.url);

    if (this.isConnecting) {
      console.log('WebSocket connection already in progress');
      return;
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
      console.log('Closing existing WebSocket connection');
      this.ws.close();
      this.ws = null;
    }

    const token = this.authService.getAccessToken();
    if (!token) {
      console.error('❌ Cannot connect WebSocket - no authentication token');
      this.lastError.set('Authentication required');
      this.connectionState.set('error');
      return;
    }

    this.isConnecting = true;
    this.connectionState.set('connecting');
    this.lastError.set(null);

    try {
      const wsUrl = `${this.config.url}?token=${encodeURIComponent(token)}`;
      console.log('Connecting to WebSocket:', wsUrl.replace(token, '[TOKEN_HIDDEN]'));

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = this.onOpen.bind(this);
      this.ws.onmessage = this.onMessage.bind(this);
      this.ws.onerror = this.onError.bind(this);
      this.ws.onclose = this.onClose.bind(this);

      const connectionTimeout = setTimeout(() => {
        if (this.ws?.readyState === WebSocket.CONNECTING) {
          console.warn('WebSocket connection timeout - closing');
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
      console.error('WebSocket connection error:', error);
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
    this.connectionSubject.next(false);
    this.reconnectAttempts = 0;
  }

  send(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message:', message);
    }
  }

  subscribe(subscriptionType: string, options: any = {}): void {
    this.send({
      type: 'subscribe',
      subscription_type: subscriptionType,
      ...options
    });
  }

  protected onOpen(event: Event): void {
    console.log('WebSocket connected');
    this.isConnecting = false;
    this.connectionState.set('connected');
    this.connectionSubject.next(true);
    this.reconnectAttempts = 0;
    this.lastError.set(null);
  }

  protected onMessage(event: MessageEvent): void {
    try {
      const data: WebSocketMessage = JSON.parse(event.data);
      console.log('WebSocket message received:', data);
      this.messageSubject.next(data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  protected onError(event: Event): void {
    console.error('WebSocket error:', event);
    this.isConnecting = false;
    this.connectionState.set('error');
    this.lastError.set('Connection error occurred');
  }

  protected onClose(event: CloseEvent): void {
    console.log(`WebSocket closed: ${event.code} ${event.reason}`);
    this.isConnecting = false;
    this.connectionState.set('disconnected');
    this.connectionSubject.next(false);

    if (event.code === 4001) {
      this.lastError.set('Authentication failed');
      console.error('WebSocket authentication failed');
      return;
    } else if (event.code === 4003) {
      this.lastError.set('Insufficient permissions');
      console.error('WebSocket permission denied');
      return;
    }

    if (event.code !== 1000 && this.reconnectAttempts < (this.config.maxReconnectAttempts || 5)) {
      this.attemptReconnection();
    }
  }

  protected attemptReconnection(): void {
    this.reconnectAttempts++;
    const delay = this.config.reconnectInterval || 5000;

    console.log(`WebSocket reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);

    timer(delay).pipe(
      takeUntil(this.destroy$),
      tap(() => {
        if (this.reconnectAttempts <= (this.config.maxReconnectAttempts || 5)) {
          this.connect();
        } else {
          console.error('Max WebSocket reconnection attempts reached');
          this.lastError.set('Connection failed - max attempts reached');
        }
      })
    ).subscribe();
  }

  filterMessages<T extends WebSocketMessage>(type: string): Observable<T> {
    return this.messages$.pipe(
      tap(msg => console.log('Filtering message:', msg.type, 'looking for:', type)),
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
      console.log('Reconnecting WebSocket with new token');
      this.disconnect();
      setTimeout(() => this.connect(), 100);
    }
  }

  shouldConnect(): boolean {
    return this.authService.isAuthenticated() && !!this.authService.getAccessToken();
  }

  updateConfig(): void {
    this.config.url = this.getWebSocketUrl();
    console.log('WebSocket URL updated to:', this.config.url);
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
    } catch (error) {
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
          console.warn('High memory usage detected, delaying WebSocket connection');
          return false;
        }
      }

      const tabCount = this.estimateTabCount();
      if (tabCount > 30) {
        console.warn('Too many tabs detected, may affect WebSocket reliability');
        return false;
      }

      return true;
    } catch (error) {
      return true;
    }
  }

  protected setupBrowserResourceHandling(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        if (this.shouldConnect() && this.connectionState() === 'disconnected') {
          console.log('Tab became active - attempting WebSocket reconnection');
          setTimeout(() => this.connect(), 1000);
        }
      } else {
        const tabCount = this.estimateTabCount();
        if (tabCount > 15 && this.ws?.readyState === WebSocket.OPEN) {
          console.log('Tab inactive with high tab count - maintaining connection with reduced activity');
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