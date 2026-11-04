import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@noatgnu/cupcake-core';

import {
  MetadataTableTemplate,
  MetadataTableTemplateCreateRequest,
  MetadataTableTemplateUpdateRequest,
  MetadataTableTemplateQueryResponse,
  MetadataTableTemplateSyncRequest,
  MetadataTableTemplateSyncResponse,
  MetadataTable,
  TableFromSchemasRequest,
  TableFromTemplateRequest,
  TemplateAddColumnRequest,
  TemplateApplyResponse,
  TemplateColumnResponse,
  TemplateColumnsWithFieldMasks,
  TemplateDuplicateColumnRequest,
  TemplateFieldMask,
  TemplateFieldMaskUpdateResponse,
  TemplateFromSchemaRequest,
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
  addColumn(id: number, request: TemplateAddColumnRequest): Observable<TemplateColumnResponse> {
    return this.post<TemplateColumnResponse>(`${this.apiUrl}/metadata-table-templates/${id}/add_column/`, request);
  }

  /**
   * Remove a column from the template
   */
  removeColumn(id: number, request: { columnId: number }): Observable<{ message: string }> {
    return this.post<{ message: string }>(`${this.apiUrl}/metadata-table-templates/${id}/remove_column/`, request);
  }

  /**
   * Reorder a column within the template
   */
  reorderColumn(id: number, request: { columnId: number; newPosition: number }): Observable<{ message: string }> {
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
  duplicateColumn(id: number, request: TemplateDuplicateColumnRequest): Observable<TemplateColumnResponse> {
    return this.post<TemplateColumnResponse>(`${this.apiUrl}/metadata-table-templates/${id}/duplicate_column/`, request);
  }

  /**
   * Normalize column positions
   */
  normalizeColumnPositions(id: number): Observable<{ message: string }> {
    return this.post<{ message: string }>(`${this.apiUrl}/metadata-table-templates/${id}/normalize_column_positions/`, {});
  }

  /**
   * Start async reordering of template columns by schema
   */
  reorderColumnsBySchemaAsync(id: number, schemaIds?: number[]): Observable<{
    taskId: string;
    message: string;
    templateId: number;
    schemaIds: number[];
  }> {
    return this.post<{
      taskId: string;
      message: string;
      templateId: number;
      schemaIds: number[];
    }>(`${this.apiUrl}/metadata-table-templates/${id}/reorder_columns_by_schema_async/`, {
      schemaIds: schemaIds || []
    });
  }

  /**
   * Apply this template to a metadata table
   */
  applyToMetadataTable(id: number, request: { metadataTableId: number }): Observable<TemplateApplyResponse> {
    return this.post<TemplateApplyResponse>(`${this.apiUrl}/metadata-table-templates/${id}/apply_to_metadata_table/`, request);
  }

  /**
   * Update field mask for template
   */
  updateFieldMask(id: number, fieldMaskMapping: Record<string, string>): Observable<TemplateFieldMaskUpdateResponse> {
    return this.post<TemplateFieldMaskUpdateResponse>(`${this.apiUrl}/metadata-table-templates/${id}/update_field_mask/`, {
      fieldMaskMapping
    });
  }

  /**
   * Get field mask for template
   */
  getFieldMask(id: number): Observable<TemplateFieldMask> {
    return this.get<TemplateFieldMask>(`${this.apiUrl}/metadata-table-templates/${id}/get_field_mask/`);
  }

  /**
   * Get columns with field masks
   */
  getColumnsWithFieldMasks(id: number): Observable<TemplateColumnsWithFieldMasks> {
    return this.get<TemplateColumnsWithFieldMasks>(`${this.apiUrl}/metadata-table-templates/${id}/get_columns_with_field_masks/`);
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
  createFromSchema(request: TemplateFromSchemaRequest): Observable<MetadataTableTemplate> {
    return this.post<MetadataTableTemplate>(`${this.apiUrl}/metadata-table-templates/create_from_schema/`, request);
  }

  /**
   * Create a new metadata table from an existing template
   */
  createTableFromTemplate(request: TableFromTemplateRequest): Observable<MetadataTable> {
    return this.post<MetadataTable>(`${this.apiUrl}/metadata-table-templates/create_table_from_template/`, request);
  }

  /**
   * Create a new metadata table directly from schema definitions
   */
  createTableFromSchemas(request: TableFromSchemasRequest): Observable<MetadataTable> {
    return this.post<MetadataTable>(`${this.apiUrl}/metadata-table-templates/create_table_from_schemas/`, request);
  }

  /**
   * Bulk delete columns from a metadata table template
   */
  bulkDeleteColumns(id: number, request: {
    columnIds: number[];
  }): Observable<{
    message: string;
    deletedCount: number;
    deletedColumns: Array<{id: number; name: string}>;
  }> {
    return this.post(`${this.apiUrl}/metadata-table-templates/${id}/bulk_delete_columns/`, request);
  }

  /**
   * Bulk update staff-only status for columns in a template
   */
  bulkUpdateStaffOnly(id: number, request: {
    columnIds: number[];
    staffOnly: boolean;
  }): Observable<{
    message: string;
    updatedCount: number;
    updatedColumns: Array<{id: number; name: string; staffOnly: boolean}>;
    staffOnly: boolean;
  }> {
    return this.post(`${this.apiUrl}/metadata-table-templates/${id}/bulk_update_staff_only/`, request);
  }

  /**
   * Sync template columns from linked schemas.
   * Updates existing columns with latest ontology settings and optionally adds new columns.
   */
  syncFromSchemas(id: number, request?: MetadataTableTemplateSyncRequest): Observable<MetadataTableTemplateSyncResponse> {
    return this.post<MetadataTableTemplateSyncResponse>(
      `${this.apiUrl}/metadata-table-templates/${id}/sync_from_schemas/`,
      request || {}
    );
  }
}
