import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService, PaginatedResponse } from '@noatgnu/cupcake-core';
import {
  WebRTCSession,
  WebRTCSessionCreate,
  WebRTCSessionUpdate,
  WebRTCSessionQueryParams
} from '../models/webrtc';

@Injectable({
  providedIn: 'root'
})
export class WebRTCSessionService extends BaseApiService {
  private modelName = 'webrtc-sessions';
  private baseUrl = `${this.apiUrl}/${this.modelName}`;

  getSessions(params?: WebRTCSessionQueryParams): Observable<PaginatedResponse<WebRTCSession>> {
    const httpParams = params ? this.buildHttpParams(params) : undefined;
    return this.get<PaginatedResponse<WebRTCSession>>(`${this.baseUrl}/`, { params: httpParams });
  }

  getSession(id: string): Observable<WebRTCSession> {
    return this.get<WebRTCSession>(`${this.baseUrl}/${id}/`);
  }

  createSession(data: WebRTCSessionCreate): Observable<WebRTCSession> {
    return this.post<WebRTCSession>(`${this.baseUrl}/`, data);
  }

  updateSession(id: string, data: WebRTCSessionUpdate): Observable<WebRTCSession> {
    return this.patch<WebRTCSession>(`${this.baseUrl}/${id}/`, data);
  }

  endSession(id: string): Observable<{ message: string; session_id: string }> {
    return this.post<{ message: string; session_id: string }>(
      `${this.baseUrl}/${id}/end_session/`,
      {}
    );
  }

  deleteSession(id: string): Observable<void> {
    return this.delete<void>(`${this.baseUrl}/${id}/`);
  }
}
