import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@noatgnu/cupcake-core';

import {
  MetadataColumn,
  MetadataColumnCreateRequest,
  MetadataColumnUpdateRequest,
  PaginatedResponse,
  OntologySuggestion
} from '../models';

export interface MetadataColumnQueryParams {
  search?: string;
  metadataTableId?: number;
  type?: string;
  name?: string;
  hidden?: boolean;
  mandatory?: boolean;
  limit?: number;
  offset?: number;
  ordering?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MetadataColumnService extends BaseApiService {

  /**
   * Get all metadata columns with optional filtering
   */
  getMetadataColumns(params?: MetadataColumnQueryParams): Observable<PaginatedResponse<MetadataColumn>> {
    const httpParams = this.buildHttpParams(params);
    return this.get<PaginatedResponse<MetadataColumn>>(`${this.apiUrl}/metadata-columns/`, { params: httpParams });
  }

  /**
   * Get a single metadata column by ID
   */
  getMetadataColumn(id: number): Observable<MetadataColumn> {
    return this.get<MetadataColumn>(`${this.apiUrl}/metadata-columns/${id}/`);
  }

  /**
   * Create a new metadata column
   */
  createMetadataColumn(column: MetadataColumnCreateRequest): Observable<MetadataColumn> {
    return this.post<MetadataColumn>(`${this.apiUrl}/metadata-columns/`, column);
  }

  /**
   * Update an existing metadata column
   */
  updateMetadataColumn(id: number, column: MetadataColumnUpdateRequest): Observable<MetadataColumn> {
    return this.put<MetadataColumn>(`${this.apiUrl}/metadata-columns/${id}/`, column);
  }

  /**
   * Partially update a metadata column
   */
  patchMetadataColumn(id: number, column: Partial<MetadataColumnUpdateRequest>): Observable<MetadataColumn> {
    return this.patch<MetadataColumn>(`${this.apiUrl}/metadata-columns/${id}/`, column);
  }

  /**
   * Delete a metadata column
   */
  deleteMetadataColumn(id: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/metadata-columns/${id}/`);
  }

  /**
   * Bulk create metadata columns
   */
  bulkCreate(request: { columns: MetadataColumnCreateRequest[] }): Observable<MetadataColumn[]> {
    return this.post<MetadataColumn[]>(`${this.apiUrl}/metadata-columns/bulk_create/`, request);
  }

  /**
   * Validate SDRF data
   */
  validateSdrfData(request: { metadataIds: number[]; sampleNumber?: number }): Observable<{ valid: boolean; errors: any[]; sampleCount: number }> {
    return this.post<{ valid: boolean; errors: any[]; sampleCount: number }>(`${this.apiUrl}/metadata-columns/validate_sdrf_data/`, request);
  }

  /**
   * Get ontology suggestions for a column
   */
  getOntologySuggestions(params: { 
    columnId: number; 
    search?: string; 
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
    const httpParams = this.buildHttpParams(params);
    return this.get(`${this.apiUrl}/metadata-columns/ontology_suggestions/`, { params: httpParams });
  }

  /**
   * Validate value against column's ontology
   */
  validateValue(id: number, request: { value: string }): Observable<{ valid: boolean; value: string; ontologyType: string; suggestions?: any[] }> {
    return this.post(`${this.apiUrl}/metadata-columns/${id}/validate_value/`, request);
  }

  /**
   * Update column value with automatic modifier calculation
   */
  updateColumnValue(id: number, request: { 
    value: string; 
    sampleIndices?: number[]; 
    valueType?: 'default' | 'sample_specific' | 'replace_all';
  }): Observable<{
    message: string;
    column: MetadataColumn;
    changes: any;
    valueType: string;
  }> {
    return this.post(`${this.apiUrl}/metadata-columns/${id}/update_column_value/`, request);
  }

  /**
   * Bulk update sample values with different values for each sample
   */
  bulkUpdateSampleValues(id: number, updates: { sampleIndex: number; value: string }[]): Observable<{
    message: string;
    updatedCount: number;
    failedCount: number;
    column: MetadataColumn;
    failedUpdates?: { sampleIndex: number; error: string }[];
  }> {
    return this.post(`${this.apiUrl}/metadata-columns/${id}/bulk_update_sample_values/`, { updates });
  }

  /**
   * Apply automatic ontology mapping to a column
   */
  applyOntologyMapping(id: number): Observable<{ applied: boolean; ontologyType: string; message: string }> {
    return this.post(`${this.apiUrl}/metadata-columns/${id}/apply_ontology_mapping/`, {});
  }

  /**
   * Detect ontology type for given column name and type
   */
  detectOntologyType(params: { name: string; type: string }): Observable<{ columnName: string; columnType: string; detectedOntologyType: string }> {
    const httpParams = this.buildHttpParams(params);
    return this.get(`${this.apiUrl}/metadata-columns/detect_ontology_type/`, { params: httpParams });
  }

  /**
   * Replace all occurrences of a specific value with a new value in this column
   */
  replaceValue(id: number, request: {
    oldValue: string;
    newValue: string;
    updatePools?: boolean;
  }): Observable<{
    message: string;
    oldValue: string;
    newValue: string;
    defaultValueUpdated: boolean;
    modifiersMerged: number;
    modifiersDeleted: number;
    samplesRevertedToDefault: number;
    poolColumnsUpdated: number;
  }> {
    return this.post(`${this.apiUrl}/metadata-columns/${id}/replace_value/`, request);
  }
}