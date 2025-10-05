import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@noatgnu/cupcake-core';

import {
  Notification,
  NotificationCreateRequest,
  NotificationUpdateRequest,
  MarkNotificationReadRequest,
  BulkNotificationActionRequest,
  NotificationType,
  NotificationPriority,
  DeliveryStatus,
  PaginatedResponse,
  NotificationQueryParams
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class NotificationService extends BaseApiService {

  /**
   * Get all notifications with optional filtering
   */
  getNotifications(params?: NotificationQueryParams): Observable<PaginatedResponse<Notification>> {
    const httpParams = this.buildHttpParams(params);
    return this.get<PaginatedResponse<Notification>>(`${this.apiUrl}/notifications/`, { params: httpParams });
  }

  /**
   * Get a single notification by ID
   */
  getNotification(id: string): Observable<Notification> {
    return this.get<Notification>(`${this.apiUrl}/notifications/${id}/`);
  }

  /**
   * Create a new notification
   */
  createNotification(notification: NotificationCreateRequest): Observable<Notification> {
    return this.post<Notification>(`${this.apiUrl}/notifications/`, notification);
  }

  /**
   * Update an existing notification
   */
  updateNotification(id: string, notification: NotificationUpdateRequest): Observable<Notification> {
    return this.put<Notification>(`${this.apiUrl}/notifications/${id}/`, notification);
  }

  /**
   * Partially update a notification
   */
  patchNotification(id: string, notification: Partial<NotificationUpdateRequest>): Observable<Notification> {
    return this.patch<Notification>(`${this.apiUrl}/notifications/${id}/`, notification);
  }

  /**
   * Delete a notification
   */
  deleteNotification(id: string): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/notifications/${id}/`);
  }

  /**
   * Mark a notification as read/unread
   */
  markNotificationRead(id: string, request: MarkNotificationReadRequest): Observable<Notification> {
    return this.post<Notification>(`${this.apiUrl}/notifications/${id}/mark_read/`, request);
  }


  /**
   * Get unread notifications for current user
   */
  getUnreadNotifications(): Observable<PaginatedResponse<Notification>> {
    return this.get<PaginatedResponse<Notification>>(`${this.apiUrl}/notifications/unread/`);
  }

  /**
   * Get notification statistics for current user
   */
  getNotificationStats(): Observable<{
    total: number;
    unread: number;
    byType: { [key: string]: number };
    byPriority: { [key: string]: number };
  }> {
    return this.get<{
      total: number;
      unread: number;
      byType: { [key: string]: number };
      byPriority: { [key: string]: number };
    }>(`${this.apiUrl}/notifications/stats/`);
  }

  /**
   * Mark all notifications as read for current user
   */
  markAllNotificationsRead(): Observable<{ success: boolean; message: string }> {
    return this.post<{ success: boolean; message: string }>(`${this.apiUrl}/notifications/mark_all_read/`, {});
  }

  /**
   * Search notifications by title or message
   */
  searchNotifications(query: string): Observable<PaginatedResponse<Notification>> {
    return this.getNotifications({ search: query });
  }

  /**
   * Get notifications by type
   */
  getNotificationsByType(type: NotificationType): Observable<PaginatedResponse<Notification>> {
    return this.getNotifications({ notificationType: type });
  }

  /**
   * Get notifications by priority
   */
  getNotificationsByPriority(priority: NotificationPriority): Observable<PaginatedResponse<Notification>> {
    return this.getNotifications({ priority });
  }

  /**
   * Get notifications by sender
   */
  getNotificationsBySender(senderId: number): Observable<PaginatedResponse<Notification>> {
    return this.getNotifications({ sender: senderId });
  }

  /**
   * Get notifications by delivery status
   */
  getNotificationsByStatus(status: DeliveryStatus): Observable<PaginatedResponse<Notification>> {
    return this.getNotifications({ deliveryStatus: status });
  }
}