import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  ThreadParticipant,
  PaginatedResponse
} from '../models';

export interface ThreadParticipantQueryParams {
  thread?: string;
  isModerator?: boolean;
  notificationsEnabled?: boolean;
  limit?: number;
  offset?: number;
  ordering?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ThreadParticipantService {
  private http = inject(HttpClient);
  private apiUrl = '/api'; // This should be configurable

  /**
   * Get all thread participants with optional filtering
   */
  getThreadParticipants(params?: ThreadParticipantQueryParams): Observable<PaginatedResponse<ThreadParticipant>> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http.get<PaginatedResponse<ThreadParticipant>>(`${this.apiUrl}/thread-participants/`, { params: httpParams });
  }

  /**
   * Get a single thread participant by ID
   */
  getThreadParticipant(id: number): Observable<ThreadParticipant> {
    return this.http.get<ThreadParticipant>(`${this.apiUrl}/thread-participants/${id}/`);
  }

  /**
   * Update thread participant settings
   */
  updateThreadParticipant(id: number, updates: { isModerator?: boolean; notificationsEnabled?: boolean }): Observable<ThreadParticipant> {
    return this.http.patch<ThreadParticipant>(`${this.apiUrl}/thread-participants/${id}/`, updates);
  }

  /**
   * Update participant's last read timestamp
   */
  updateLastRead(id: number): Observable<ThreadParticipant> {
    return this.http.post<ThreadParticipant>(`${this.apiUrl}/thread-participants/${id}/update_last_read/`, {});
  }

  /**
   * Get participants for a specific thread
   */
  getParticipantsForThread(threadId: string): Observable<PaginatedResponse<ThreadParticipant>> {
    return this.getThreadParticipants({ thread: threadId });
  }

  /**
   * Get moderators for a specific thread
   */
  getModeratorsForThread(threadId: string): Observable<PaginatedResponse<ThreadParticipant>> {
    return this.getThreadParticipants({ thread: threadId, isModerator: true });
  }

  /**
   * Get non-moderator participants for a specific thread
   */
  getRegularParticipantsForThread(threadId: string): Observable<PaginatedResponse<ThreadParticipant>> {
    return this.getThreadParticipants({ thread: threadId, isModerator: false });
  }

  /**
   * Get participants with notifications enabled for a specific thread
   */
  getNotificationEnabledParticipants(threadId: string): Observable<PaginatedResponse<ThreadParticipant>> {
    return this.getThreadParticipants({ thread: threadId, notificationsEnabled: true });
  }

  /**
   * Get participants with notifications disabled for a specific thread
   */
  getNotificationDisabledParticipants(threadId: string): Observable<PaginatedResponse<ThreadParticipant>> {
    return this.getThreadParticipants({ thread: threadId, notificationsEnabled: false });
  }

  /**
   * Toggle moderator status for a participant
   */
  toggleModeratorStatus(id: number): Observable<ThreadParticipant> {
    return this.http.post<ThreadParticipant>(`${this.apiUrl}/thread-participants/${id}/toggle_moderator/`, {});
  }

  /**
   * Toggle notifications for a participant
   */
  toggleNotifications(id: number): Observable<ThreadParticipant> {
    return this.http.post<ThreadParticipant>(`${this.apiUrl}/thread-participants/${id}/toggle_notifications/`, {});
  }

  /**
   * Leave a thread (for current user)
   */
  leaveThread(threadId: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/thread-participants/leave_thread/`, { thread: threadId });
  }

  /**
   * Get threads where current user is participant
   */
  getMyParticipations(): Observable<PaginatedResponse<ThreadParticipant>> {
    return this.http.get<PaginatedResponse<ThreadParticipant>>(`${this.apiUrl}/thread-participants/my_participations/`);
  }

  /**
   * Get threads where current user is moderator
   */
  getMyModerations(): Observable<PaginatedResponse<ThreadParticipant>> {
    return this.http.get<PaginatedResponse<ThreadParticipant>>(`${this.apiUrl}/thread-participants/my_moderations/`);
  }
}