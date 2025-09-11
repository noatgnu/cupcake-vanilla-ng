import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@cupcake/core';

import {
  MetadataTableTemplate,
  MetadataTableTemplateCreateRequest,
  MetadataTableTemplateUpdateRequest,
  MetadataTableTemplateQueryResponse,
  MetadataTable,
  MetadataColumn,
  Schema,
  PaginatedResponse
} from '../models';

export interface MetadataTableTemplateQueryParams {
  search?: string;
  ownerId?: number;
  labGroupId?: number;
  visibility?: string;
  isDefault?: boolean;
  limit?: number;
  offset?: number;
  ordering?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MetadataTableTemplateService extends BaseApiService {

  /**
   * Get all metadata table templates with optional filtering
   */
  getMetadataTableTemplates(params?: MetadataTableTemplateQueryParams): Observable<MetadataTableTemplateQueryResponse> {
    const httpParams = this.buildHttpParams(params);
    return this.get<MetadataTableTemplateQueryResponse>(`${this.apiUrl}/metadata-table-templates/`, { params: httpParams });
  }

  /**
   * Get a single metadata table template by ID
   */
  getMetadataTableTemplate(id: number): Observable<MetadataTableTemplate> {
    return this.get<MetadataTableTemplate>(`${this.apiUrl}/metadata-table-templates/${id}/`);
  }

  /**
   * Create a new metadata table template
   */
  createMetadataTableTemplate(template: MetadataTableTemplateCreateRequest): Observable<MetadataTableTemplate> {
    return this.post<MetadataTableTemplate>(`${this.apiUrl}/metadata-table-templates/`, template);
  }

  /**
   * Update an existing metadata table template
   */
  updateMetadataTableTemplate(id: number, template: MetadataTableTemplateUpdateRequest): Observable<MetadataTableTemplate> {
    return this.put<MetadataTableTemplate>(`${this.apiUrl}/metadata-table-templates/${id}/`, template);
  }

  /**
   * Partially update a metadata table template
   */
  patchMetadataTableTemplate(id: number, template: Partial<MetadataTableTemplateUpdateRequest>): Observable<MetadataTableTemplate> {
    return this.patch<MetadataTableTemplate>(`${this.apiUrl}/metadata-table-templates/${id}/`, template);
  }

  /**
   * Delete a metadata table template
   */
  deleteMetadataTableTemplate(id: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/metadata-table-templates/${id}/`);
  }

  /**
   * Add a column to the template
   */
  addColumn(id: number, request: { column_data: any; position?: number }): Observable<{ message: string; column: MetadataColumn }> {
    return this.post<{ message: string; column: MetadataColumn }>(`${this.apiUrl}/metadata-table-templates/${id}/add_column/`, request);
  }

  /**
   * Remove a column from the template
   */
  removeColumn(id: number, request: { column_id: number }): Observable<{ message: string }> {
    return this.post<{ message: string }>(`${this.apiUrl}/metadata-table-templates/${id}/remove_column/`, request);
  }

  /**
   * Reorder a column within the template
   */
  reorderColumn(id: number, request: { column_id: number; new_position: number }): Observable<{ message: string }> {
    return this.post<{ message: string }>(`${this.apiUrl}/metadata-table-templates/${id}/reorder_column/`, request);
  }

  /**
   * Add a column with automatic reordering
   */
  addColumnWithAutoReorder(id: number, request: { columnData: any }): Observable<{ message: string; column: MetadataColumn; reordered: boolean; schemaIdsUsed: number[] }> {
    return this.post<{ message: string; column: MetadataColumn; reordered: boolean; schemaIdsUsed: number[] }>(`${this.apiUrl}/metadata-table-templates/${id}/add_column_with_auto_reorder/`, request);
  }

  /**
   * Duplicate a column within the template
   */
  duplicateColumn(id: number, request: { column_id: number }): Observable<{ message: string; duplicated_column: MetadataColumn }> {
    return this.post<{ message: string; duplicated_column: MetadataColumn }>(`${this.apiUrl}/metadata-table-templates/${id}/duplicate_column/`, request);
  }

  /**
   * Normalize column positions
   */
  normalizeColumnPositions(id: number): Observable<{ message: string }> {
    return this.post<{ message: string }>(`${this.apiUrl}/metadata-table-templates/${id}/normalize_column_positions/`, {});
  }

  /**
   * Apply this template to a metadata table
   */
  applyToMetadataTable(id: number, request: { metadata_table_id: number }): Observable<{ message: string; applied_columns: MetadataColumn[] }> {
    return this.post<{ message: string; applied_columns: MetadataColumn[] }>(`${this.apiUrl}/metadata-table-templates/${id}/apply_to_metadata_table/`, request);
  }

  /**
   * Update field mask for template
   */
  updateFieldMask(id: number, request: { field_mask: any }): Observable<{ message: string; field_mask: any }> {
    return this.post<{ message: string; field_mask: any }>(`${this.apiUrl}/metadata-table-templates/${id}/update_field_mask/`, request);
  }

  /**
   * Get field mask for template
   */
  getFieldMask(id: number): Observable<{ field_mask: any }> {
    return this.get<{ field_mask: any }>(`${this.apiUrl}/metadata-table-templates/${id}/get_field_mask/`);
  }

  /**
   * Get columns with field masks
   */
  getColumnsWithFieldMasks(id: number): Observable<{ columns: any[] }> {
    return this.get<{ columns: any[] }>(`${this.apiUrl}/metadata-table-templates/${id}/get_columns_with_field_masks/`);
  }

  /**
   * Get available schemas for creating templates
   */
  getAvailableSchemas(): Observable<Schema[]> {
    return this.get<Schema[]>(`${this.apiUrl}/metadata-table-templates/available_schemas/`);
  }

  /**
   * Create a new template from schema definitions
   */
  createFromSchema(request: { schemaIds: number[]; templateName: string; templateDescription?: string }): Observable<{ message: string; template: MetadataTableTemplate }> {
    return this.post<{ message: string; template: MetadataTableTemplate }>(`${this.apiUrl}/metadata-table-templates/create_from_schema/`, request);
  }

  /**
   * Create a new metadata table from an existing template
   */
  createTableFromTemplate(request: { templateId: number; tableName: string; tableDescription?: string; sampleCount: number }): Observable<{ message: string; table: MetadataTable }> {
    return this.post<{ message: string; table: MetadataTable }>(`${this.apiUrl}/metadata-table-templates/create_table_from_template/`, request);
  }

  /**
   * Create a new metadata table directly from schema definitions
   */
  createTableFromSchemas(request: { schemaIds: number[]; tableName: string; tableDescription?: string; sampleCount: number }): Observable<{ message: string; table: MetadataTable }> {
    return this.post<{ message: string; table: MetadataTable }>(`${this.apiUrl}/metadata-table-templates/create_table_from_schemas/`, request);
  }
}