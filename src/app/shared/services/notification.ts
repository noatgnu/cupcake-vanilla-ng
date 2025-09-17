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

  readonly allNotifications = computed(() => this.notifications());
  readonly unreadNotifications = computed(() => 
    this.notifications().filter(n => !n.read)
  );
  readonly unreadCount = computed(() => this.unreadNotifications().length);
  readonly isWebSocketConnected = computed(() => this.isConnected());

  readonly notification$ = this.notificationSubject.asObservable();

  constructor(
    private websocketService: Websocket,
    private toastService: ToastService
  ) {
    this.initializeWebSocket();
  }

  private initializeWebSocket(): void {
    this.websocketService.isConnected$.subscribe(connected => {
      this.isConnected.set(connected);
      if (connected) {
        console.log('WebSocket connected - notifications active');
      }
    });

    this.websocketService.messages$.subscribe(message => {
      this.handleWebSocketMessage(message);
    });

    this.setupNotificationHandlers();
  }

  private setupNotificationHandlers(): void {
    this.websocketService.getSystemNotifications().subscribe(message => {
      const notification = this.createNotificationFromWebSocket(message, NotificationType.SYSTEM);
      this.addNotification(notification);
      
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

    this.websocketService.getMetadataTableUpdates().subscribe(message => {
      const notification = this.createNotificationFromWebSocket(message, NotificationType.METADATA_TABLE);
      this.addNotification(notification);
    });

    this.websocketService.getLabGroupUpdates().subscribe(message => {
      const notification = this.createNotificationFromWebSocket(message, NotificationType.LAB_GROUP);
      this.addNotification(notification);
    });

    this.websocketService.filterMessages('async_task.update').subscribe(message => {
      const notification = this.createNotificationFromWebSocket(message, NotificationType.ASYNC_TASK);
      this.addNotification(notification);
    });

    this.websocketService.filterMessages('notification_message').subscribe(message => {
      const notificationData = message['message'] || message;

      let notificationType = 'info';
      let title = 'Notification';
      let messageText = '';

      if (typeof notificationData === 'object' && notificationData !== null) {
        notificationType = (notificationData as any)['type'] || 'info';
        title = (notificationData as any)['title'] || 'Notification';
        messageText = (notificationData as any)['message'] || '';
      } else if (typeof notificationData === 'string') {
        messageText = notificationData;
      }

      const notification = this.createNotificationFromWebSocket(message, NotificationType.SYSTEM);
      this.addNotification(notification);

      if (notificationType === 'error') {
        this.toastService.error(`${title}: ${messageText}`, 8000);
      } else if (notificationType === 'warning') {
        this.toastService.warning(`${title}: ${messageText}`, 6000);
      } else if (notificationType === 'success') {
        this.toastService.success(`${title}: ${messageText}`, 5000);
      } else {
        this.toastService.info(`${title}: ${messageText}`, 4000);
      }
    });
  }

  private handleWebSocketMessage(message: WebSocketMessage): void {
    if (message.type === 'connection.established') {
      console.log('WebSocket connection established:', message);
      return;
    }

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
    switch (taskType) {
      case 'EXPORT_EXCEL':
        operation = 'Excel Export';
        break;
      case 'EXPORT_SDRF':
        operation = 'SDRF Export';
        break;
      case 'IMPORT_SDRF':
        operation = 'SDRF Import';
        break;
      case 'IMPORT_EXCEL':
        operation = 'Excel Import';
        break;
      case 'EXPORT_MULTIPLE_SDRF':
        operation = 'Bulk SDRF Export';
        break;
      case 'EXPORT_MULTIPLE_EXCEL':
        operation = 'Bulk Excel Export';
        break;
      case 'VALIDATE_TABLE':
        operation = 'Table Validation';
        break;
      case 'REORDER_TABLE_COLUMNS':
        operation = 'Column Reordering';
        break;
      case 'REORDER_TEMPLATE_COLUMNS':
        operation = 'Template Column Reordering';
        break;
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
      const updated = [notification, ...notifications];
      
      return updated.slice(0, 100);
    });

    this.notificationSubject.next(notification);
    
    console.log('Notification added:', notification);
  }

  
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

  connect(): void {
    this.websocketService.connect();
  }

  disconnect(): void {
    this.websocketService.disconnect();
  }

  subscribeToMetadataTable(tableId: number): void {
    this.websocketService.subscribe('metadata_table_updates', { table_id: tableId });
  }

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
