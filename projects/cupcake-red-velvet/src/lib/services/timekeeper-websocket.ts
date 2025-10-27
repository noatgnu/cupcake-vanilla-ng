import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';

export interface TimeKeeperStartedEvent {
  type: 'timekeeper.started';
  timekeeperId: string;
  name?: string;
  sessionId?: string;
  stepId?: string;
  startTime: string;
  timestamp: string;
}

export interface TimeKeeperStoppedEvent {
  type: 'timekeeper.stopped';
  timekeeperId: string;
  name?: string;
  sessionId?: string;
  stepId?: string;
  duration?: number;
  durationFormatted?: string;
  timestamp: string;
}

export interface TimeKeeperUpdatedEvent {
  type: 'timekeeper.updated';
  timekeeperId: string;
  name?: string;
  sessionId?: string;
  stepId?: string;
  started?: boolean;
  duration?: number;
  timestamp: string;
}

export interface ConnectionEstablishedEvent {
  type: 'ccrv.connection.established';
  message: string;
  userId: number;
  username: string;
}

export interface PongEvent {
  type: 'pong';
}

export type WebSocketIncomingMessage =
  | TimeKeeperStartedEvent
  | TimeKeeperStoppedEvent
  | TimeKeeperUpdatedEvent
  | ConnectionEstablishedEvent
  | PongEvent;

export interface PingMessage {
  type: 'ping';
}

export type WebSocketOutgoingMessage = PingMessage;

@Injectable({
  providedIn: 'root'
})
export class TimeKeeperWebSocketService implements OnDestroy {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private reconnectTimer: number | null = null;

  private messageSubject = new Subject<WebSocketIncomingMessage>();
  private connectionStateSubject = new BehaviorSubject<'disconnected' | 'connecting' | 'connected'>('disconnected');

  public connectionState$ = this.connectionStateSubject.asObservable();
  public messages$ = this.messageSubject.asObservable();

  public timeKeeperStarted$: Observable<TimeKeeperStartedEvent> = this.messages$.pipe(
    filter((msg): msg is TimeKeeperStartedEvent => msg.type === 'timekeeper.started')
  );

  public timeKeeperStopped$: Observable<TimeKeeperStoppedEvent> = this.messages$.pipe(
    filter((msg): msg is TimeKeeperStoppedEvent => msg.type === 'timekeeper.stopped')
  );

  public timeKeeperUpdated$: Observable<TimeKeeperUpdatedEvent> = this.messages$.pipe(
    filter((msg): msg is TimeKeeperUpdatedEvent => msg.type === 'timekeeper.updated')
  );

  connect(wsBaseUrl: string, token?: string): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('CCRV WebSocket already connected');
      return;
    }

    this.connectionStateSubject.next('connecting');

    const fullUrl = `${wsBaseUrl.replace(/\/$/, '')}/ccrv/timekeepers/`;
    const url = token ? `${fullUrl}?token=${token}` : fullUrl;
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log('CCRV TimeKeeper WebSocket connected');
      this.connectionStateSubject.next('connected');
      this.reconnectAttempts = 0;
    };

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketIncomingMessage;
        this.messageSubject.next(message);

        if (message.type === 'ccrv.connection.established') {
          console.log('CCRV TimeKeeper connection established:', message);
        }
      } catch (error) {
        console.error('Error parsing CCRV WebSocket message:', error);
      }
    };

    this.socket.onerror = (error) => {
      console.error('CCRV TimeKeeper WebSocket error:', error);
    };

    this.socket.onclose = (event) => {
      console.log('CCRV TimeKeeper WebSocket closed:', event.code, event.reason);
      this.connectionStateSubject.next('disconnected');

      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect(wsBaseUrl, token);
      }
    };
  }

  private scheduleReconnect(wsBaseUrl: string, token?: string): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect(wsBaseUrl, token);
    }, delay);
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.connectionStateSubject.next('disconnected');
    this.reconnectAttempts = 0;
  }

  ping(): void {
    const message: PingMessage = { type: 'ping' };
    this.send(message);
  }

  private send(message: WebSocketOutgoingMessage): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message: CCRV WebSocket not connected');
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  getConnectionState(): 'disconnected' | 'connecting' | 'connected' {
    return this.connectionStateSubject.value;
  }
}
