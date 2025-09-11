import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@cupcake/core';

import {
  MetadataColumnTemplateShare,
  MetadataColumnTemplateShareCreateRequest,
  PaginatedResponse
} from '../models';

export interface MetadataColumnTemplateShareQueryParams {
  template?: number;
  sharedWith?: number;
  sharedBy?: number;
  canEdit?: boolean;
  limit?: number;
  offset?: number;
  ordering?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MetadataColumnTemplateShareService extends BaseApiService {

  /**
   * Get all template shares with optional filtering
   */
  getMetadataColumnTemplateShares(params?: MetadataColumnTemplateShareQueryParams): Observable<PaginatedResponse<MetadataColumnTemplateShare>> {
    const httpParams = this.buildHttpParams(params);
    return this.get<PaginatedResponse<MetadataColumnTemplateShare>>(`${this.apiUrl}/metadata-column-template-shares/`, { params: httpParams });
  }

  /**
   * Get a single template share by ID
   */
  getMetadataColumnTemplateShare(id: number): Observable<MetadataColumnTemplateShare> {
    return this.get<MetadataColumnTemplateShare>(`${this.apiUrl}/metadata-column-template-shares/${id}/`);
  }

  /**
   * Create a new template share
   */
  createMetadataColumnTemplateShare(share: MetadataColumnTemplateShareCreateRequest): Observable<MetadataColumnTemplateShare> {
    return this.post<MetadataColumnTemplateShare>(`${this.apiUrl}/metadata-column-template-shares/`, share);
  }

  /**
   * Update an existing template share
   */
  updateMetadataColumnTemplateShare(id: number, share: { canEdit?: boolean }): Observable<MetadataColumnTemplateShare> {
    return this.put<MetadataColumnTemplateShare>(`${this.apiUrl}/metadata-column-template-shares/${id}/`, share);
  }

  /**
   * Delete a template share
   */
  deleteMetadataColumnTemplateShare(id: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/metadata-column-template-shares/${id}/`);
  }
}