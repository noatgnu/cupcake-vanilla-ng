import { Injectable, signal, computed } from '@angular/core';
import { Subject } from 'rxjs';
import { ToastService } from './toast';

export interface NotificationItem {
  id: string;
  type: string;
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

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications = signal<NotificationItem[]>([]);
  private notificationSubject = new Subject<NotificationItem>();

  readonly allNotifications = computed(() => this.notifications());
  readonly unreadNotifications = computed(() =>
    this.notifications().filter(n => !n.read)
  );
  readonly unreadCount = computed(() => this.unreadNotifications().length);

  readonly notification$ = this.notificationSubject.asObservable();

  constructor(protected toastService: ToastService) {}

  protected addNotification(notification: NotificationItem): void {
    this.notifications.update(notifications => {
      const updated = [notification, ...notifications];
      return updated.slice(0, 100);
    });

    this.notificationSubject.next(notification);
    console.log('Notification added:', notification);
  }

  protected generateNotificationId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

  createLocalNotification(
    type: string,
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

    switch (level) {
      case 'error':
        this.toastService.error(`${title}: ${message}`);
        break;
      case 'warning':
        this.toastService.warning(`${title}: ${message}`);
        break;
      case 'success':
        this.toastService.success(`${title}: ${message}`);
        break;
      default:
        this.toastService.info(`${title}: ${message}`);
    }
  }
}