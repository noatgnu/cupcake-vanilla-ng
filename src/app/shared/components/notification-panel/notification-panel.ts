import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { Notification, NotificationItem, NotificationType } from '../../services/notification';

@Component({
  selector: 'app-notification-panel',
  imports: [CommonModule, NgbModule],
  templateUrl: './notification-panel.html',
  styleUrl: './notification-panel.scss'
})
export class NotificationPanel {
  isOpen = signal(false);
  selectedFilter = signal<NotificationType | 'all'>('all');
  
  // Expose enum to template
  NotificationType = NotificationType;

  constructor(public notificationService: Notification) {}

  // Computed properties
  filteredNotifications = computed(() => {
    const filter = this.selectedFilter();
    const notifications = this.notificationService.allNotifications();
    
    if (filter === 'all') {
      return notifications;
    }
    
    return notifications.filter(n => n.type === filter);
  });

  hasUnreadNotifications = computed(() => 
    this.notificationService.unreadCount() > 0
  );

  connectionStatus = computed(() => 
    this.notificationService.isWebSocketConnected()
  );

  togglePanel(): void {
    this.isOpen.update(open => !open);
  }

  closePanel(): void {
    this.isOpen.set(false);
  }

  setFilter(filter: NotificationType | 'all'): void {
    this.selectedFilter.set(filter);
  }

  markAsRead(notification: NotificationItem): void {
    this.notificationService.markAsRead(notification.id);
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  removeNotification(notification: NotificationItem): void {
    this.notificationService.removeNotification(notification.id);
  }

  clearAllNotifications(): void {
    this.notificationService.clearAll();
  }

  clearReadNotifications(): void {
    this.notificationService.clearRead();
  }

  getNotificationIcon(notification: NotificationItem): string {
    switch (notification.type) {
      case NotificationType.SYSTEM:
        return 'bi-gear';
      case NotificationType.METADATA_TABLE:
        return 'bi-table';
      case NotificationType.LAB_GROUP:
        return 'bi-people';
      case NotificationType.FILE_UPLOAD:
        return 'bi-cloud-upload';
      case NotificationType.DATA_PROCESSING:
        return 'bi-cpu';
      case NotificationType.USER:
        return 'bi-person';
      default:
        return 'bi-bell';
    }
  }

  getNotificationBadgeClass(notification: NotificationItem): string {
    switch (notification.level) {
      case 'success':
        return 'bg-success';
      case 'warning':
        return 'bg-warning';
      case 'error':
        return 'bg-danger';
      default:
        return 'bg-info';
    }
  }

  formatTimestamp(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  }

  reconnectWebSocket(): void {
    this.notificationService.disconnect();
    setTimeout(() => {
      this.notificationService.connect();
    }, 1000);
  }
}
