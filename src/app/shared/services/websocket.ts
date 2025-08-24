import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject, Subject, Observable, timer, EMPTY } from 'rxjs';
import { takeUntil, switchMap, retry, tap } from 'rxjs/operators';
import { AuthService } from 'cupcake-core';
import { environment } from '../../../environments/environment';

export interface WebSocketMessage {
  type: string;
  message?: string;
  timestamp?: string;
  [key: string]: any;
}

export interface WebSocketConfig {
  url: string;
  protocols?: string[];
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  pingInterval?: number;
}

@Injectable({
  providedIn: 'root'
})
export class Websocket {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private destroy$ = new Subject<void>();
  private reconnectAttempts = 0;
  private isConnecting = false; // Prevent multiple simultaneous connection attempts

  // Connection state management
  private connectionState = signal<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  private lastError = signal<string | null>(null);
  
  // Message streams
  private messageSubject = new Subject<WebSocketMessage>();
  private connectionSubject = new BehaviorSubject<boolean>(false);

  // Public observables and computed signals
  readonly messages$ = this.messageSubject.asObservable();
  readonly isConnected$ = this.connectionSubject.asObservable();
  readonly connectionState$ = computed(() => this.connectionState());
  readonly lastError$ = computed(() => this.lastError());

  constructor(private authService: AuthService) {
    this.config = {
      url: this.getWebSocketUrl(),
      reconnectInterval: 5000,
      maxReconnectAttempts: 5
    };

    // Subscribe to authentication changes to handle reconnections
    this.authService.isAuthenticated$.subscribe(isAuthenticated => {
      if (!isAuthenticated && this.ws) {
        console.log('User logged out - disconnecting WebSocket');
        this.disconnect();
      }
    });
  }

  private getWebSocketUrl(): string {
    // Use dedicated WebSocket URL from environment if available
    if ((environment as any).websocketUrl) {
      return (environment as any).websocketUrl;
    }

    // Fallback: construct URL from API URL
    const apiUrl = environment.apiUrl;
    
    try {
      const url = new URL(apiUrl);
      const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = url.host;
      
      // Construct WebSocket URL based on the environment API URL
      return `${protocol}//${host}/ws/notifications/`;
    } catch (error) {
      console.error('Invalid API URL in environment config:', apiUrl);
      
      // Final fallback to window location based URL
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      return `${protocol}//${host}/ws/notifications/`;
    }
  }

  connect(): void {
    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting) {
      console.log('WebSocket connection already in progress');
      return;
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    // Close existing connection if it's in a bad state
    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
      console.log('Closing existing WebSocket connection');
      this.ws.close();
      this.ws = null;
    }

    const token = this.authService.getAccessToken();
    if (!token) {
      console.error('Cannot connect WebSocket - no authentication token');
      this.lastError.set('Authentication required');
      this.connectionState.set('error');
      return;
    }

    this.isConnecting = true;
    this.connectionState.set('connecting');
    this.lastError.set(null);

    try {
      // Include token in URL query parameter for authentication
      const wsUrl = `${this.config.url}?token=${encodeURIComponent(token)}`;
      console.log('Connecting to WebSocket:', wsUrl.replace(token, '[TOKEN_HIDDEN]'));
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = this.onOpen.bind(this);
      this.ws.onmessage = this.onMessage.bind(this);
      this.ws.onerror = this.onError.bind(this);
      this.ws.onclose = this.onClose.bind(this);

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

  // Convenience methods for common message types

  subscribe(subscriptionType: string, options: any = {}): void {
    this.send({
      type: 'subscribe',
      subscription_type: subscriptionType,
      ...options
    });
  }

  private onOpen(event: Event): void {
    console.log('WebSocket connected');
    this.isConnecting = false;
    this.connectionState.set('connected');
    this.connectionSubject.next(true);
    this.reconnectAttempts = 0;
    this.lastError.set(null);
  }

  private onMessage(event: MessageEvent): void {
    try {
      const data: WebSocketMessage = JSON.parse(event.data);
      console.log('WebSocket message received:', data);
      this.messageSubject.next(data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  private onError(event: Event): void {
    console.error('WebSocket error:', event);
    this.isConnecting = false;
    this.connectionState.set('error');
    this.lastError.set('Connection error occurred');
  }

  private onClose(event: CloseEvent): void {
    console.log(`WebSocket closed: ${event.code} ${event.reason}`);
    this.isConnecting = false;
    this.connectionState.set('disconnected');
    this.connectionSubject.next(false);

    // Handle different close codes
    if (event.code === 4001) {
      this.lastError.set('Authentication failed');
      console.error('WebSocket authentication failed');
      return; // Don't attempt reconnection
    } else if (event.code === 4003) {
      this.lastError.set('Insufficient permissions');
      console.error('WebSocket permission denied');
      return; // Don't attempt reconnection
    }

    // Attempt reconnection if not manually disconnected
    if (event.code !== 1000 && this.reconnectAttempts < (this.config.maxReconnectAttempts || 5)) {
      this.attemptReconnection();
    }
  }

  private attemptReconnection(): void {
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


  // Message filtering helpers
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

  getMetadataTableUpdates(): Observable<WebSocketMessage> {
    return this.filterMessages('metadata_table.update');
  }

  getLabGroupUpdates(): Observable<WebSocketMessage> {
    return this.filterMessages('lab_group.update');
  }

  // Public method to refresh connection with new token (useful after token refresh)
  reconnectWithNewToken(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('Reconnecting WebSocket with new token');
      this.disconnect();
      // Use a small delay to ensure clean disconnection before reconnecting
      setTimeout(() => this.connect(), 100);
    }
  }

  // Public method to check if WebSocket should be connected based on auth state
  shouldConnect(): boolean {
    return this.authService.isAuthenticated() && !!this.authService.getAccessToken();
  }

  // Update WebSocket URL if environment changes
  updateConfig(): void {
    this.config.url = this.getWebSocketUrl();
    console.log('WebSocket URL updated to:', this.config.url);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
