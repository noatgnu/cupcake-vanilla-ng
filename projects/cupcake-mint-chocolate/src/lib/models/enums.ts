export enum NotificationType {
  SYSTEM = 'system',
  MAINTENANCE = 'maintenance',
  INVENTORY = 'inventory',
  BILLING = 'billing',
  PROJECT = 'project',
  PROTOCOL = 'protocol',
  DOCUMENT = 'document',
  USER = 'user'
}

export const NotificationTypeLabels: Record<NotificationType, string> = {
  [NotificationType.SYSTEM]: 'System',
  [NotificationType.MAINTENANCE]: 'Maintenance',
  [NotificationType.INVENTORY]: 'Inventory',
  [NotificationType.BILLING]: 'Billing',
  [NotificationType.PROJECT]: 'Project',
  [NotificationType.PROTOCOL]: 'Protocol',
  [NotificationType.DOCUMENT]: 'Document',
  [NotificationType.USER]: 'User'
};

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export const NotificationPriorityLabels: Record<NotificationPriority, string> = {
  [NotificationPriority.LOW]: 'Low',
  [NotificationPriority.NORMAL]: 'Normal',
  [NotificationPriority.HIGH]: 'High',
  [NotificationPriority.URGENT]: 'Urgent'
};

export enum DeliveryStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  READ = 'read'
}

export const DeliveryStatusLabels: Record<DeliveryStatus, string> = {
  [DeliveryStatus.PENDING]: 'Pending',
  [DeliveryStatus.SENT]: 'Sent',
  [DeliveryStatus.DELIVERED]: 'Delivered',
  [DeliveryStatus.FAILED]: 'Failed',
  [DeliveryStatus.READ]: 'Read'
};

export enum MessageType {
  DIRECT = 'direct',
  THREAD = 'thread',
  BROADCAST = 'broadcast',
  SYSTEM = 'system'
}

export const MessageTypeLabels: Record<MessageType, string> = {
  [MessageType.DIRECT]: 'Direct Message',
  [MessageType.THREAD]: 'Thread Reply',
  [MessageType.BROADCAST]: 'Broadcast',
  [MessageType.SYSTEM]: 'System Message'
};