import { BaseTimestampedModel } from './base';
import { NotificationType, NotificationPriority, DeliveryStatus } from './enums';

export interface Notification extends BaseTimestampedModel {
  id: string;
  title: string;
  message: string;
  notificationType: NotificationType;
  priority: NotificationPriority;
  recipient: number;
  recipientUsername?: string;
  recipientName?: string;
  sender?: number;
  senderUsername?: string;
  senderName?: string;
  deliveryStatus: DeliveryStatus;
  sentAt?: string;
  readAt?: string;
  data?: any;
  expiresAt?: string;
  relatedObjectType?: string;
  relatedObjectApp?: string;
  objectId?: number;
  isRead: boolean;
  isExpired: boolean;
}

export interface NotificationCreateRequest {
  title: string;
  message: string;
  notificationType: NotificationType;
  priority?: NotificationPriority;
  recipient: number;
  data?: any;
  expiresAt?: string;
  contentType?: number;
  objectId?: number;
}

export interface NotificationUpdateRequest {
  title?: string;
  message?: string;
  priority?: NotificationPriority;
  deliveryStatus?: DeliveryStatus;
  data?: any;
  expiresAt?: string;
}

export interface MarkNotificationReadRequest {
  isRead: boolean;
}

export interface BulkNotificationActionRequest {
  notificationIds: string[];
  action: 'mark_read' | 'mark_unread' | 'delete';
}