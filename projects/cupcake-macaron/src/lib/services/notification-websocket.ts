import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';

export interface TranscriptionStartedEvent {
  type: 'transcription.started';
  message: string;
  timestamp: string;
  user_id: number;
  annotation_id: number;
}

export interface TranscriptionCompletedEvent {
  type: 'transcription.completed';
  message: string;
  timestamp: string;
  user_id: number;
  annotation_id: number;
  language?: string;
  has_translation?: boolean;
}

export interface TranscriptionFailedEvent {
  type: 'transcription.failed';
  message: string;
  timestamp: string;
  user_id: number;
  annotation_id: number;
  error: string;
}

export interface CCMConnectionEstablishedEvent {
  type: 'connection.established';
  message: string;
  userId: number;
  username: string;
}

export interface NotificationPongEvent {
  type: 'pong';
}

export type CCMNotificationMessage =
  | TranscriptionStartedEvent
  | TranscriptionCompletedEvent
  | TranscriptionFailedEvent
  | CCMConnectionEstablishedEvent
  | NotificationPongEvent;

export interface NotificationPingMessage {
  type: 'ping';
}

export type CCMOutgoingMessage = NotificationPingMessage;

@Injectable({
  providedIn: 'root'
})
export class CCMNotificationWebSocketService implements OnDestroy {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private reconnectTimer: number | null = null;

  private messageSubject = new Subject<CCMNotificationMessage>();
  private connectionStateSubject = new BehaviorSubject<'disconnected' | 'connecting' | 'connected'>('disconnected');

  public connectionState$ = this.connectionStateSubject.asObservable();
  public messages$ = this.messageSubject.asObservable();

  public transcriptionStarted$: Observable<TranscriptionStartedEvent> = this.messages$.pipe(
    filter((msg): msg is TranscriptionStartedEvent => msg.type === 'transcription.started')
  );

  public transcriptionCompleted$: Observable<TranscriptionCompletedEvent> = this.messages$.pipe(
    filter((msg): msg is TranscriptionCompletedEvent => msg.type === 'transcription.completed')
  );

  public transcriptionFailed$: Observable<TranscriptionFailedEvent> = this.messages$.pipe(
    filter((msg): msg is TranscriptionFailedEvent => msg.type === 'transcription.failed')
  );

  connect(wsBaseUrl: string, token?: string): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('CCM Notification WebSocket already connected');
      return;
    }

    this.connectionStateSubject.next('connecting');

    const fullUrl = `${wsBaseUrl.replace(/\/$/, '')}/ccm/notifications/`;
    const url = token ? `${fullUrl}?token=${token}` : fullUrl;
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log('CCM Notification WebSocket connected');
      this.connectionStateSubject.next('connected');
      this.reconnectAttempts = 0;
    };

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as CCMNotificationMessage;
        this.messageSubject.next(message);

        if (message.type === 'connection.established') {
          console.log('CCM Notification connection established:', message);
        } else if (message.type === 'transcription.started') {
          console.log('Transcription started (CCM):', message);
        } else if (message.type === 'transcription.completed') {
          console.log('Transcription completed (CCM):', message);
        } else if (message.type === 'transcription.failed') {
          console.error('Transcription failed (CCM):', message);
        }
      } catch (error) {
        console.error('Error parsing CCM Notification WebSocket message:', error);
      }
    };

    this.socket.onerror = (error) => {
      console.error('CCM Notification WebSocket error:', error);
    };

    this.socket.onclose = (event) => {
      console.log('CCM Notification WebSocket closed:', event.code, event.reason);
      this.connectionStateSubject.next('disconnected');

      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect(wsBaseUrl, token);
      }
    };
  }

  private scheduleReconnect(wsBaseUrl: string, token?: string): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;

    console.log(`Reconnecting CCM Notification WebSocket in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

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
    const message: NotificationPingMessage = { type: 'ping' };
    this.send(message);
  }

  private send(message: CCMOutgoingMessage): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message: CCM Notification WebSocket not connected');
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
