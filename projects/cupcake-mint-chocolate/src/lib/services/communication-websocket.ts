import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { NotificationType, NotificationPriority, MessageType } from '../models';

export interface NewNotificationEvent {
  type: 'notification.new';
  notificationId: string;
  title: string;
  message: string;
  notificationType: NotificationType;
  priority: NotificationPriority;
  data: {
    alertType?: string;
    quantity?: number;
    link?: string;
    [key: string]: string | number | boolean | undefined;
  };
  timestamp: string;
}

export interface NewMessageEvent {
  type: 'message.new';
  threadId: string;
  messageId: string;
  senderId: number;
  senderUsername: string;
  content: string;
  messageType: MessageType;
  timestamp: string;
}

export interface ThreadUpdateEvent {
  type: 'thread.update';
  threadId: string;
  action: string;
  message: string;
  timestamp: string;
}

export interface NotificationUpdateEvent {
  type: 'notification.update';
  notificationId: string;
  status: string;
  timestamp: string;
}

export interface ConnectionEstablishedEvent {
  type: 'ccmc.connection.established';
  message: string;
  userId: number;
  username: string;
}

export interface ThreadSubscriptionConfirmedEvent {
  type: 'thread.subscription.confirmed';
  threadId: string;
}

export interface ThreadSubscriptionDeniedEvent {
  type: 'thread.subscription.denied';
  threadId: string;
  error: string;
}

export interface ThreadUnsubscriptionConfirmedEvent {
  type: 'thread.unsubscription.confirmed';
  threadId: string;
}

export interface NotificationMarkedReadEvent {
  type: 'notification.marked_read';
  notificationId: string;
}

export interface PongEvent {
  type: 'pong';
}

export type WebSocketIncomingMessage =
  | NewNotificationEvent
  | NewMessageEvent
  | ThreadUpdateEvent
  | NotificationUpdateEvent
  | ConnectionEstablishedEvent
  | ThreadSubscriptionConfirmedEvent
  | ThreadSubscriptionDeniedEvent
  | ThreadUnsubscriptionConfirmedEvent
  | NotificationMarkedReadEvent
  | PongEvent;

export interface SubscribeThreadMessage {
  type: 'subscribe_thread';
  thread_id: string;
}

export interface UnsubscribeThreadMessage {
  type: 'unsubscribe_thread';
  thread_id: string;
}

export interface MarkNotificationReadMessage {
  type: 'mark_notification_read';
  notification_id: string;
}

export interface PingMessage {
  type: 'ping';
}

export type WebSocketOutgoingMessage =
  | SubscribeThreadMessage
  | UnsubscribeThreadMessage
  | MarkNotificationReadMessage
  | PingMessage;

@Injectable({
  providedIn: 'root'
})
export class CommunicationWebSocketService implements OnDestroy {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private reconnectTimer: number | null = null;

  private messageSubject = new Subject<WebSocketIncomingMessage>();
  private connectionStateSubject = new BehaviorSubject<'disconnected' | 'connecting' | 'connected'>('disconnected');

  public connectionState$ = this.connectionStateSubject.asObservable();
  public messages$ = this.messageSubject.asObservable();

  public newNotifications$: Observable<NewNotificationEvent> = this.messages$.pipe(
    filter((msg): msg is NewNotificationEvent => msg.type === 'notification.new')
  );

  public newMessages$: Observable<NewMessageEvent> = this.messages$.pipe(
    filter((msg): msg is NewMessageEvent => msg.type === 'message.new')
  );

  public threadUpdates$: Observable<ThreadUpdateEvent> = this.messages$.pipe(
    filter((msg): msg is ThreadUpdateEvent => msg.type === 'thread.update')
  );

  public notificationUpdates$: Observable<NotificationUpdateEvent> = this.messages$.pipe(
    filter((msg): msg is NotificationUpdateEvent => msg.type === 'notification.update')
  );

  connect(wsUrl: string, token?: string): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    this.connectionStateSubject.next('connecting');

    const url = token ? `${wsUrl}?token=${token}` : wsUrl;
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log('CCMC WebSocket connected');
      this.connectionStateSubject.next('connected');
      this.reconnectAttempts = 0;
    };

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketIncomingMessage;
        this.messageSubject.next(message);

        if (message.type === 'ccmc.connection.established') {
          console.log('CCMC connection established:', message);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.socket.onerror = (error) => {
      console.error('CCMC WebSocket error:', error);
    };

    this.socket.onclose = (event) => {
      console.log('CCMC WebSocket closed:', event.code, event.reason);
      this.connectionStateSubject.next('disconnected');

      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect(wsUrl, token);
      }
    };
  }

  private scheduleReconnect(wsUrl: string, token?: string): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect(wsUrl, token);
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

  subscribeToThread(threadId: string): void {
    const message: SubscribeThreadMessage = {
      type: 'subscribe_thread',
      thread_id: threadId
    };
    this.send(message);
  }

  unsubscribeFromThread(threadId: string): void {
    const message: UnsubscribeThreadMessage = {
      type: 'unsubscribe_thread',
      thread_id: threadId
    };
    this.send(message);
  }

  markNotificationAsRead(notificationId: string): void {
    const message: MarkNotificationReadMessage = {
      type: 'mark_notification_read',
      notification_id: notificationId
    };
    this.send(message);
  }

  ping(): void {
    const message: PingMessage = { type: 'ping' };
    this.send(message);
  }

  private send(message: WebSocketOutgoingMessage): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message: WebSocket not connected');
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
