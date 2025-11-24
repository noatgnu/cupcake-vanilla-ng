import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseApiService, AnnotationFolder } from '@noatgnu/cupcake-core';

import {
  Session,
  SessionCreateRequest,
  SessionUpdateRequest,
  PaginatedResponse
} from '../models';

export interface SessionQueryParams {
  search?: string;
  projects?: number;
  status?: string;
  user?: number;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
  ordering?: string;
  uniqueId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SessionService extends BaseApiService {

  /**
   * Get all sessions with optional filtering
   */
  getSessions(params?: SessionQueryParams): Observable<PaginatedResponse<Session>> {
    const httpParams = this.buildHttpParams(params);
    return this.get<PaginatedResponse<Session>>(`${this.apiUrl}/sessions/`, { params: httpParams });
  }

  /**
   * Get a single session by ID
   */
  getSession(id: number): Observable<Session> {
    return this.get<Session>(`${this.apiUrl}/sessions/${id}/`);
  }

  /**
   * Create a new session
   */
  createSession(session: SessionCreateRequest): Observable<Session> {
    return this.post<Session>(`${this.apiUrl}/sessions/`, session);
  }

  /**
   * Update an existing session
   */
  updateSession(id: number, session: SessionUpdateRequest): Observable<Session> {
    return this.put<Session>(`${this.apiUrl}/sessions/${id}/`, session);
  }

  /**
   * Partially update a session
   */
  patchSession(id: number, session: Partial<SessionUpdateRequest>): Observable<Session> {
    return this.patch<Session>(`${this.apiUrl}/sessions/${id}/`, session);
  }

  /**
   * Delete a session
   */
  deleteSession(id: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/sessions/${id}/`);
  }

  /**
   * Search sessions by name or description
   */
  searchSessions(query: string): Observable<PaginatedResponse<Session>> {
    return this.getSessions({ search: query });
  }

  /**
   * Get sessions by project
   */
  getSessionsByProject(projectId: number): Observable<PaginatedResponse<Session>> {
    return this.getSessions({ projects: projectId });
  }

  /**
   * Get sessions by user
   */
  getSessionsByUser(userId: number): Observable<PaginatedResponse<Session>> {
    return this.getSessions({ user: userId });
  }

  /**
   * Get sessions by status
   */
  getSessionsByStatus(status: string): Observable<PaginatedResponse<Session>> {
    return this.getSessions({ status });
  }

  /**
   * Get sessions within date range
   */
  getSessionsByDateRange(dateFrom: string, dateTo: string): Observable<PaginatedResponse<Session>> {
    return this.getSessions({ dateFrom, dateTo });
  }

  /**
   * Start a session
   */
  startSession(id: number): Observable<Session> {
    return this.post<{message: string, session: Session}>(`${this.apiUrl}/sessions/${id}/start/`, {})
      .pipe(
        map(response => response.session)
      );
  }

  /**
   * End a session
   */
  endSession(id: number): Observable<Session> {
    return this.post<{message: string, session: Session}>(`${this.apiUrl}/sessions/${id}/end/`, {})
      .pipe(
        map(response => response.session)
      );
  }

  /**
   * Get annotation folders for this session
   * Returns dynamically linked folders
   */
  getSessionFolders(id: number): Observable<AnnotationFolder[]> {
    return this.get<AnnotationFolder[]>(`${this.apiUrl}/sessions/${id}/folders/`);
  }

  /**
   * Get WebRTC sessions associated with this experimental session
   */
  getWebRTCSessions(id: number): Observable<any[]> {
    return this.get<any[]>(`${this.apiUrl}/sessions/${id}/webrtc_sessions/`);
  }

  /**
   * Join or create the default WebRTC session for this experimental session
   * By default, all users join the same call unless they create a named session
   */
  joinDefaultWebRTC(id: number): Observable<any> {
    return this.post<any>(`${this.apiUrl}/sessions/${id}/join_default_webrtc/`, {});
  }

  /**
   * Get signed download URL for session HTML export with all protocols and annotations
   * @param id Session ID
   * @returns Observable with download URL containing signed token
   */
  getExportUrl(id: number): Observable<{downloadUrl: string}> {
    return this.get<{downloadUrl: string}>(`${this.apiUrl}/sessions/${id}/get_export_url/`);
  }
}