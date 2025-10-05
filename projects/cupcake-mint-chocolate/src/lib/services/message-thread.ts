import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@noatgnu/cupcake-core';

import {
  MessageThread,
  MessageThreadCreateRequest,
  MessageThreadUpdateRequest,
  ThreadParticipantRequest,
  ThreadSearchRequest,
  ThreadParticipant,
  PaginatedResponse
} from '../models';

export interface MessageThreadQueryParams {
  search?: string;
  isPrivate?: boolean;
  isArchived?: boolean;
  creator?: number;
  limit?: number;
  offset?: number;
  ordering?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MessageThreadService extends BaseApiService {

  /**
   * Get all message threads with optional filtering
   */
  getMessageThreads(params?: MessageThreadQueryParams): Observable<PaginatedResponse<MessageThread>> {
    const httpParams = this.buildHttpParams(params);
    return this.get<PaginatedResponse<MessageThread>>(`${this.apiUrl}/threads/`, { params: httpParams });
  }

  /**
   * Get a single message thread by ID
   */
  getMessageThread(id: string): Observable<MessageThread> {
    return this.get<MessageThread>(`${this.apiUrl}/threads/${id}/`);
  }

  /**
   * Create a new message thread
   */
  createMessageThread(thread: MessageThreadCreateRequest): Observable<MessageThread> {
    return this.post<MessageThread>(`${this.apiUrl}/threads/`, thread);
  }

  /**
   * Update an existing message thread
   */
  updateMessageThread(id: string, thread: MessageThreadUpdateRequest): Observable<MessageThread> {
    return this.put<MessageThread>(`${this.apiUrl}/threads/${id}/`, thread);
  }

  /**
   * Partially update a message thread
   */
  patchMessageThread(id: string, thread: Partial<MessageThreadUpdateRequest>): Observable<MessageThread> {
    return this.patch<MessageThread>(`${this.apiUrl}/threads/${id}/`, thread);
  }

  /**
   * Delete a message thread
   */
  deleteMessageThread(id: string): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/threads/${id}/`);
  }

  /**
   * Add participant to a thread
   */
  addParticipant(id: string, request: { username: string }): Observable<{ message: string; participant: ThreadParticipant }> {
    return this.post<{ message: string; participant: ThreadParticipant }>(`${this.apiUrl}/threads/${id}/add_participant/`, request);
  }

  /**
   * Remove participant from a thread
   */
  removeParticipant(id: string, request: { username: string }): Observable<{ message: string }> {
    return this.post<{ message: string }>(`${this.apiUrl}/threads/${id}/remove_participant/`, request);
  }

  /**
   * Get thread participants
   */
  getParticipants(id: string): Observable<PaginatedResponse<ThreadParticipant>> {
    return this.get<PaginatedResponse<ThreadParticipant>>(`${this.apiUrl}/threads/${id}/participants/`);
  }

  /**
   * Archive/unarchive a thread (toggles state)
   */
  toggleArchiveThread(id: string): Observable<{ message: string; isArchived: boolean }> {
    return this.post<{ message: string; isArchived: boolean }>(`${this.apiUrl}/threads/${id}/archive/`, {});
  }

  /**
   * Mark thread as read for current user
   */
  markThreadAsRead(id: string): Observable<{ success: boolean; message: string }> {
    return this.post<{ success: boolean; message: string }>(`${this.apiUrl}/threads/${id}/mark_read/`, {});
  }


  /**
   * Search message threads by title or description
   */
  searchMessageThreads(query: string): Observable<PaginatedResponse<MessageThread>> {
    return this.getMessageThreads({ search: query });
  }

  /**
   * Get private threads only
   */
  getPrivateThreads(): Observable<PaginatedResponse<MessageThread>> {
    return this.getMessageThreads({ isPrivate: true });
  }

  /**
   * Get public threads only
   */
  getPublicThreads(): Observable<PaginatedResponse<MessageThread>> {
    return this.getMessageThreads({ isPrivate: false });
  }

  /**
   * Get archived threads
   */
  getArchivedThreads(): Observable<PaginatedResponse<MessageThread>> {
    return this.getMessageThreads({ isArchived: true });
  }

  /**
   * Get active threads (non-archived)
   */
  getActiveThreads(): Observable<PaginatedResponse<MessageThread>> {
    return this.getMessageThreads({ isArchived: false });
  }

  /**
   * Get threads created by a specific user
   */
  getThreadsByCreator(creatorId: number): Observable<PaginatedResponse<MessageThread>> {
    return this.getMessageThreads({ creator: creatorId });
  }
}