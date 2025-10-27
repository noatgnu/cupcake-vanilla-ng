import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@noatgnu/cupcake-core';

import {
  StoredReagentAnnotation,
  StoredReagentAnnotationQueryParams,
  StoredReagentAnnotationCreateRequest,
  StoredReagentAnnotationUpdateRequest,
  PaginatedResponse
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class StoredReagentAnnotationService extends BaseApiService {

  getStoredReagentAnnotations(params?: StoredReagentAnnotationQueryParams): Observable<PaginatedResponse<StoredReagentAnnotation>> {
    const httpParams = this.buildHttpParams(params);
    return this.get<PaginatedResponse<StoredReagentAnnotation>>(`${this.apiUrl}/stored-reagent-annotations/`, { params: httpParams });
  }

  getStoredReagentAnnotation(id: number): Observable<StoredReagentAnnotation> {
    return this.get<StoredReagentAnnotation>(`${this.apiUrl}/stored-reagent-annotations/${id}/`);
  }

  getAnnotationsForStoredReagent(storedReagentId: number, params?: Omit<StoredReagentAnnotationQueryParams, 'storedReagent'>): Observable<PaginatedResponse<StoredReagentAnnotation>> {
    return this.getStoredReagentAnnotations({ storedReagent: storedReagentId, ...params });
  }

  getAnnotationsByFolder(storedReagentId: number, folderId: number, params?: Omit<StoredReagentAnnotationQueryParams, 'storedReagent' | 'folder'>): Observable<PaginatedResponse<StoredReagentAnnotation>> {
    return this.getStoredReagentAnnotations({ storedReagent: storedReagentId, folder: folderId, ...params });
  }

  createStoredReagentAnnotation(annotation: StoredReagentAnnotationCreateRequest): Observable<StoredReagentAnnotation> {
    return this.post<StoredReagentAnnotation>(`${this.apiUrl}/stored-reagent-annotations/`, annotation);
  }

  updateStoredReagentAnnotation(id: number, annotation: StoredReagentAnnotationUpdateRequest): Observable<StoredReagentAnnotation> {
    return this.put<StoredReagentAnnotation>(`${this.apiUrl}/stored-reagent-annotations/${id}/`, annotation);
  }

  patchStoredReagentAnnotation(id: number, annotation: Partial<StoredReagentAnnotationUpdateRequest>): Observable<StoredReagentAnnotation> {
    return this.patch<StoredReagentAnnotation>(`${this.apiUrl}/stored-reagent-annotations/${id}/`, annotation);
  }

  deleteStoredReagentAnnotation(id: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/stored-reagent-annotations/${id}/`);
  }
}
