import { Injectable, signal, computed } from '@angular/core';
import { Subject, Observable, BehaviorSubject } from 'rxjs';
import { Websocket, WebSocketMessage } from './websocket';
import { ToastService } from './toast';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  level?: 'info' | 'success' | 'warning' | 'error';
  actions?: NotificationAction[];
  autoClose?: boolean;
  data?: any;
}

export interface NotificationAction {
  label: string;
  action: string;
  style?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}

export enum NotificationType {
  SYSTEM = 'system',
  METADATA_TABLE = 'metadata_table',
  LAB_GROUP = 'lab_group',
  FILE_UPLOAD = 'file_upload',
  DATA_PROCESSING = 'data_processing',
  ASYNC_TASK = 'async_task',
  USER = 'user'
}

@Injectable({
  providedIn: 'root'
})
export class Notification {
  private notifications = signal<NotificationItem[]>([]);
  private notificationSubject = new Subject<NotificationItem>();
  private isConnected = signal(false);

  // Public computed signals
  readonly allNotifications = computed(() => this.notifications());
  readonly unreadNotifications = computed(() => 
    this.notifications().filter(n => !n.read)
  );
  readonly unreadCount = computed(() => this.unreadNotifications().length);
  readonly isWebSocketConnected = computed(() => this.isConnected());

  // Public observables
  readonly notification$ = this.notificationSubject.asObservable();

  constructor(
    private websocketService: Websocket,
    private toastService: ToastService
  ) {
    this.initializeWebSocket();
  }

  private initializeWebSocket(): void {
    // Listen for WebSocket connection status
    this.websocketService.isConnected$.subscribe(connected => {
      this.isConnected.set(connected);
      if (connected) {
        console.log('WebSocket connected - notifications active');
      }
    });

    // Listen for all WebSocket messages and convert to notifications
    this.websocketService.messages$.subscribe(message => {
      this.handleWebSocketMessage(message);
    });

    // Listen for specific notification types
    this.setupNotificationHandlers();
  }

  private setupNotificationHandlers(): void {
    // System notifications
    this.websocketService.getSystemNotifications().subscribe(message => {
      const notification = this.createNotificationFromWebSocket(message, NotificationType.SYSTEM);
      this.addNotification(notification);
      
      // Show toast for system notifications
      if (message['level'] === 'error') {
        this.toastService.error(message.message || message['title']);
      } else if (message['level'] === 'warning') {
        this.toastService.warning(message.message || message['title']);
      } else if (message['level'] === 'success') {
        this.toastService.success(message.message || message['title']);
      } else {
        this.toastService.info(message.message || message['title']);
      }
    });

    // Metadata table updates
    this.websocketService.getMetadataTableUpdates().subscribe(message => {
      const notification = this.createNotificationFromWebSocket(message, NotificationType.METADATA_TABLE);
      this.addNotification(notification);
    });

    // Lab group updates
    this.websocketService.getLabGroupUpdates().subscribe(message => {
      const notification = this.createNotificationFromWebSocket(message, NotificationType.LAB_GROUP);
      this.addNotification(notification);
    });

    // Async task updates
    this.websocketService.filterMessages('async_task.update').subscribe(message => {
      const notification = this.createNotificationFromWebSocket(message, NotificationType.ASYNC_TASK);
      this.addNotification(notification);
    });
  }

  private handleWebSocketMessage(message: WebSocketMessage): void {
    // Handle connection established message
    if (message.type === 'connection.established') {
      console.log('WebSocket connection established:', message);
      return;
    }

    // Handle specific message types that don't have dedicated handlers
    if (message.type.includes('file.upload')) {
      const notification = this.createNotificationFromWebSocket(message, NotificationType.FILE_UPLOAD);
      this.addNotification(notification);
      
      if (message.type === 'file.upload.completed') {
        this.toastService.success(`File upload completed: ${message['filename']}`);
      } else if (message.type === 'file.upload.failed') {
        this.toastService.error(`File upload failed: ${message['filename']}`);
      }
    } else if (message.type.includes('data.processing')) {
      const notification = this.createNotificationFromWebSocket(message, NotificationType.DATA_PROCESSING);
      this.addNotification(notification);
      
      if (message.type === 'data.processing.completed') {
        this.toastService.success('Data processing completed');
      } else if (message.type === 'data.processing.failed') {
        this.toastService.error('Data processing failed');
      }
    }
  }

  private createNotificationFromWebSocket(message: WebSocketMessage, type: NotificationType): NotificationItem {
    const id = this.generateNotificationId();
    const timestamp = message.timestamp ? new Date(message.timestamp) : new Date();
    
    let title = '';
    let level: 'info' | 'success' | 'warning' | 'error' = 'info';
    
    // Determine title and level based on message type
    switch (type) {
      case NotificationType.SYSTEM:
        title = message['title'] || 'System Notification';
        level = (message['level'] as any) || 'info';
        break;
      case NotificationType.METADATA_TABLE:
        title = 'Metadata Table Update';
        level = message['action'] === 'deleted' ? 'warning' : 'info';
        break;
      case NotificationType.LAB_GROUP:
        title = 'Lab Group Update';
        level = 'info';
        break;
      case NotificationType.FILE_UPLOAD:
        title = 'File Upload';
        level = message.type.includes('failed') ? 'error' : 'success';
        break;
      case NotificationType.DATA_PROCESSING:
        title = 'Data Processing';
        level = message.type.includes('failed') ? 'error' : 'success';
        break;
      case NotificationType.ASYNC_TASK:
        title = this.getAsyncTaskTitle(message);
        level = this.getAsyncTaskLevel(message);
        break;
      default:
        title = 'Notification';
    }

    return {
      id,
      type,
      title,
      message: message.message || '',
      timestamp,
      read: false,
      level,
      autoClose: level === 'success' || level === 'info',
      data: message
    };
  }

  private generateNotificationId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getAsyncTaskTitle(message: WebSocketMessage): string {
    const taskType = message['task_type'];
    const status = message['status'];
    
    let operation = 'Task';
    if (taskType === 'EXPORT_EXCEL') {
      operation = 'Excel Export';
    } else if (taskType === 'EXPORT_SDRF') {
      operation = 'SDRF Export';
    } else if (taskType === 'IMPORT_SDRF') {
      operation = 'SDRF Import';
    } else if (taskType === 'IMPORT_EXCEL') {
      operation = 'Excel Import';
    } else if (taskType === 'EXPORT_MULTIPLE_SDRF') {
      operation = 'Bulk SDRF Export';
    } else if (taskType === 'EXPORT_MULTIPLE_EXCEL') {
      operation = 'Bulk Excel Export';
    } else if (taskType === 'VALIDATE_TABLE') {
      operation = 'Table Validation';
    }
    
    switch (status) {
      case 'QUEUED':
        return `${operation} Queued`;
      case 'STARTED':
        return `${operation} In Progress`;
      case 'SUCCESS':
        return `${operation} Completed`;
      case 'FAILURE':
        return `${operation} Failed`;
      case 'CANCELLED':
        return `${operation} Cancelled`;
      default:
        return `${operation} Update`;
    }
  }

  private getAsyncTaskLevel(message: WebSocketMessage): 'info' | 'success' | 'warning' | 'error' {
    const status = message['status'];
    
    switch (status) {
      case 'SUCCESS':
        return 'success';
      case 'FAILURE':
        return 'error';
      case 'CANCELLED':
        return 'warning';
      case 'STARTED':
      case 'QUEUED':
      default:
        return 'info';
    }
  }

  private addNotification(notification: NotificationItem): void {
    this.notifications.update(notifications => {
      // Add new notification at the beginning
      const updated = [notification, ...notifications];
      
      // Keep only last 100 notifications to prevent memory issues
      return updated.slice(0, 100);
    });

    // Emit to subscribers
    this.notificationSubject.next(notification);
    
    console.log('Notification added:', notification);
  }

  // Public methods for managing notifications
  
  markAsRead(notificationId: string): void {
    this.notifications.update(notifications => 
      notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  }

  markAllAsRead(): void {
    this.notifications.update(notifications => 
      notifications.map(n => ({ ...n, read: true }))
    );
  }

  removeNotification(notificationId: string): void {
    this.notifications.update(notifications => 
      notifications.filter(n => n.id !== notificationId)
    );
  }

  clearAll(): void {
    this.notifications.set([]);
  }

  clearRead(): void {
    this.notifications.update(notifications => 
      notifications.filter(n => !n.read)
    );
  }

  // WebSocket connection management
  connect(): void {
    this.websocketService.connect();
  }

  disconnect(): void {
    this.websocketService.disconnect();
  }

  // Subscribe to specific notification channels
  subscribeToMetadataTable(tableId: number): void {
    this.websocketService.subscribe('metadata_table_updates', { table_id: tableId });
  }

  // Manual notification creation (for testing or local notifications)
  createLocalNotification(
    type: NotificationType,
    title: string,
    message: string,
    level: 'info' | 'success' | 'warning' | 'error' = 'info',
    autoClose = true
  ): void {
    const notification: NotificationItem = {
      id: this.generateNotificationId(),
      type,
      title,
      message,
      timestamp: new Date(),
      read: false,
      level,
      autoClose
    };

    this.addNotification(notification);
  }
}
