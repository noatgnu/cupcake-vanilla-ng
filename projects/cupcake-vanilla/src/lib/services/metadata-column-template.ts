import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@cupcake/core';

import {
  MetadataColumnTemplate,
  MetadataColumnTemplateCreateRequest,
  MetadataColumnTemplateUpdateRequest,
  MetadataColumn,
  OntologySuggestion,
  PaginatedResponse
} from '../models';

export interface MetadataColumnTemplateQueryParams {
  search?: string;
  type?: string;
  ontologyType?: string;
  isRequired?: boolean;
  isPublic?: boolean;
  ownerId?: number;
  labGroupId?: number;
  visibility?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
  ordering?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MetadataColumnTemplateService extends BaseApiService {

  /**
   * Get all metadata column templates with optional filtering
   */
  getMetadataColumnTemplates(params?: MetadataColumnTemplateQueryParams): Observable<PaginatedResponse<MetadataColumnTemplate>> {
    const httpParams = this.buildHttpParams(params);
    return this.get<PaginatedResponse<MetadataColumnTemplate>>(`${this.apiUrl}/metadata-column-templates/`, { params: httpParams });
  }

  /**
   * Get a single metadata column template by ID
   */
  getMetadataColumnTemplate(id: number): Observable<MetadataColumnTemplate> {
    return this.get<MetadataColumnTemplate>(`${this.apiUrl}/metadata-column-templates/${id}/`);
  }

  /**
   * Create a new metadata column template
   */
  createMetadataColumnTemplate(template: MetadataColumnTemplateCreateRequest): Observable<MetadataColumnTemplate> {
    return this.post<MetadataColumnTemplate>(`${this.apiUrl}/metadata-column-templates/`, template);
  }

  /**
   * Update an existing metadata column template
   */
  updateMetadataColumnTemplate(id: number, template: MetadataColumnTemplateUpdateRequest): Observable<MetadataColumnTemplate> {
    return this.put<MetadataColumnTemplate>(`${this.apiUrl}/metadata-column-templates/${id}/`, template);
  }

  /**
   * Partially update a metadata column template
   */
  patchMetadataColumnTemplate(id: number, template: Partial<MetadataColumnTemplateUpdateRequest>): Observable<MetadataColumnTemplate> {
    return this.patch<MetadataColumnTemplate>(`${this.apiUrl}/metadata-column-templates/${id}/`, template);
  }

  /**
   * Delete a metadata column template
   */
  deleteMetadataColumnTemplate(id: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/metadata-column-templates/${id}/`);
  }

  /**
   * Create a MetadataColumn from this template
   */
  createMetadataColumn(id: number, request: { metadataTableId: number; columnPosition?: number }): Observable<{ message: string; column: MetadataColumn }> {
    return this.post<{ message: string; column: MetadataColumn }>(`${this.apiUrl}/metadata-column-templates/${id}/create_metadata_column/`, request);
  }

  /**
   * Share this template with another user
   */
  shareTemplate(id: number, request: { userId: number; canEdit?: boolean }): Observable<{ message: string }> {
    return this.post<{ message: string }>(`${this.apiUrl}/metadata-column-templates/${id}/share_template/`, request);
  }

  /**
   * Remove template sharing for a user
   */
  unshareTemplate(id: number, request: { userId: number }): Observable<{ message: string }> {
    return this.delete<{ message: string }>(`${this.apiUrl}/metadata-column-templates/${id}/unshare_template/`, { body: request });
  }

  /**
   * Get templates created by the current user
   */
  getMyTemplates(): Observable<MetadataColumnTemplate[]> {
    return this.get<MetadataColumnTemplate[]>(`${this.apiUrl}/metadata-column-templates/my_templates/`);
  }

  /**
   * Get most popular public templates
   */
  getPopularTemplates(): Observable<MetadataColumnTemplate[]> {
    return this.get<MetadataColumnTemplate[]>(`${this.apiUrl}/metadata-column-templates/popular_templates/`);
  }

  /**
   * Get ontology suggestions for this column template
   */
  getOntologySuggestions(params?: { 
    search?: string; 
    templateId?: number;
    limit?: number;
    searchType?: 'icontains' | 'istartswith' | 'exact';
  }): Observable<{
    ontologyType: string;
    suggestions: OntologySuggestion[];
    searchTerm: string;
    searchType: string;
    limit: number;
    count: number;
    customFilters: any;
    hasMore: boolean;
  }> {
    const httpParams = this.buildHttpParams({
      template_id: params?.templateId,
      search: params?.search,
      limit: params?.limit,
      search_type: params?.searchType
    });
    return this.get<{
      ontologyType: string;
      suggestions: OntologySuggestion[];
      searchTerm: string;
      searchType: string;
      limit: number;
      count: number;
      customFilters: any;
      hasMore: boolean;
    }>(`${this.apiUrl}/metadata-column-templates/ontology_suggestions/`, { params: httpParams });
  }
}