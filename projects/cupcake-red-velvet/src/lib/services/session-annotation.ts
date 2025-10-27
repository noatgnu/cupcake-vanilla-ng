import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@noatgnu/cupcake-core';

import {
  SessionAnnotation,
  SessionAnnotationCreateRequest,
  SessionAnnotationUpdateRequest,
  PaginatedResponse
} from '../models';

export interface SessionAnnotationQueryParams {
  session?: number;
  annotation?: number;
  folder?: number;
  scratched?: boolean;
  limit?: number;
  offset?: number;
  ordering?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SessionAnnotationService extends BaseApiService {

  getSessionAnnotations(params?: SessionAnnotationQueryParams): Observable<PaginatedResponse<SessionAnnotation>> {
    const httpParams = this.buildHttpParams(params);
    return this.get<PaginatedResponse<SessionAnnotation>>(`${this.apiUrl}/session-annotations/`, { params: httpParams });
  }

  getSessionAnnotation(id: number): Observable<SessionAnnotation> {
    return this.get<SessionAnnotation>(`${this.apiUrl}/session-annotations/${id}/`);
  }

  getSessionAnnotationsBySession(sessionId: number): Observable<PaginatedResponse<SessionAnnotation>> {
    return this.getSessionAnnotations({ session: sessionId });
  }

  createSessionAnnotation(sessionAnnotation: SessionAnnotationCreateRequest): Observable<SessionAnnotation> {
    return this.post<SessionAnnotation>(`${this.apiUrl}/session-annotations/`, sessionAnnotation);
  }

  updateSessionAnnotation(id: number, sessionAnnotation: SessionAnnotationUpdateRequest): Observable<SessionAnnotation> {
    return this.put<SessionAnnotation>(`${this.apiUrl}/session-annotations/${id}/`, sessionAnnotation);
  }

  patchSessionAnnotation(id: number, sessionAnnotation: Partial<SessionAnnotationUpdateRequest>): Observable<SessionAnnotation> {
    return this.patch<SessionAnnotation>(`${this.apiUrl}/session-annotations/${id}/`, sessionAnnotation);
  }

  deleteSessionAnnotation(id: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/session-annotations/${id}/`);
  }

  createMetadataTable(sessionAnnotationId: number): Observable<any> {
    return this.post<any>(`${this.apiUrl}/session-annotations/${sessionAnnotationId}/create_metadata_table/`, {});
  }

  getMetadataTable(sessionAnnotationId: number): Observable<any> {
    return this.get<any>(`${this.apiUrl}/session-annotations/${sessionAnnotationId}/metadata_table/`);
  }

  addMetadataColumn(sessionAnnotationId: number, columnData: any): Observable<any> {
    return this.post<any>(`${this.apiUrl}/session-annotations/${sessionAnnotationId}/add_metadata_column/`, columnData);
  }

  removeMetadataColumn(sessionAnnotationId: number, columnId: number): Observable<any> {
    return this.delete<any>(`${this.apiUrl}/session-annotations/${sessionAnnotationId}/remove_metadata_column/${columnId}/`);
  }
}
