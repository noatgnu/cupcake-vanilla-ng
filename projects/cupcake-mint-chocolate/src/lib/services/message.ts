import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@noatgnu/cupcake-core';

import {
  Message,
  MessageCreateRequest,
  MessageUpdateRequest,
  MessageSearchRequest,
  MessageType,
  PaginatedResponse
} from '../models';

export interface MessageQueryParams {
  search?: string;
  thread?: string;
  messageType?: MessageType;
  sender?: number;
  isDeleted?: boolean;
  limit?: number;
  offset?: number;
  ordering?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MessageService extends BaseApiService {

  /**
   * Get all messages with optional filtering
   */
  getMessages(params?: MessageQueryParams): Observable<PaginatedResponse<Message>> {
    const httpParams = this.buildHttpParams(params);
    return this.get<PaginatedResponse<Message>>(`${this.apiUrl}/messages/`, { params: httpParams });
  }

  /**
   * Get a single message by ID
   */
  getMessage(id: string): Observable<Message> {
    return this.get<Message>(`${this.apiUrl}/messages/${id}/`);
  }

  /**
   * Create a new message
   */
  createMessage(message: MessageCreateRequest): Observable<Message> {
    return this.post<Message>(`${this.apiUrl}/messages/`, message);
  }

  /**
   * Update an existing message
   */
  updateMessage(id: string, message: MessageUpdateRequest): Observable<Message> {
    return this.put<Message>(`${this.apiUrl}/messages/${id}/`, message);
  }

  /**
   * Partially update a message
   */
  patchMessage(id: string, message: Partial<MessageUpdateRequest>): Observable<Message> {
    return this.patch<Message>(`${this.apiUrl}/messages/${id}/`, message);
  }

  /**
   * Delete a message (soft delete)
   */
  deleteMessage(id: string): Observable<Message> {
    return this.delete<Message>(`${this.apiUrl}/messages/${id}/`);
  }


  /**
   * Get messages in a specific thread
   */
  getThreadMessages(threadId: string, params?: Omit<MessageQueryParams, 'thread'>): Observable<PaginatedResponse<Message>> {
    const queryParams = { ...params, thread: threadId };
    return this.getMessages(queryParams);
  }

  /**
   * Search messages by content
   */
  searchMessages(query: string, threadId?: string): Observable<PaginatedResponse<Message>> {
    const params: MessageQueryParams = { search: query };
    if (threadId) {
      params.thread = threadId;
    }
    return this.getMessages(params);
  }

  /**
   * Get messages by sender
   */
  getMessagesBySender(senderId: number, threadId?: string): Observable<PaginatedResponse<Message>> {
    const params: MessageQueryParams = { sender: senderId };
    if (threadId) {
      params.thread = threadId;
    }
    return this.getMessages(params);
  }

  /**
   * Get messages by type
   */
  getMessagesByType(messageType: MessageType, threadId?: string): Observable<PaginatedResponse<Message>> {
    const params: MessageQueryParams = { messageType };
    if (threadId) {
      params.thread = threadId;
    }
    return this.getMessages(params);
  }

  /**
   * Get deleted messages (for moderation)
   */
  getDeletedMessages(threadId?: string): Observable<PaginatedResponse<Message>> {
    const params: MessageQueryParams = { isDeleted: true };
    if (threadId) {
      params.thread = threadId;
    }
    return this.getMessages(params);
  }

  /**
   * Get active messages (non-deleted)
   */
  getActiveMessages(threadId?: string): Observable<PaginatedResponse<Message>> {
    const params: MessageQueryParams = { isDeleted: false };
    if (threadId) {
      params.thread = threadId;
    }
    return this.getMessages(params);
  }

  /**
   * Reply to a message
   */
  replyToMessage(parentMessageId: string, content: string, threadId: string): Observable<Message> {
    const message: MessageCreateRequest = {
      thread: threadId,
      content,
      replyTo: parentMessageId
    };
    return this.createMessage(message);
  }
}