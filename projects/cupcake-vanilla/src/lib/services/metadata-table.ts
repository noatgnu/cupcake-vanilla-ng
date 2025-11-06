import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@noatgnu/cupcake-core';

import {
  MetadataTable,
  MetadataTableCreateRequest,
  MetadataTableUpdateRequest,
  MetadataTableQueryResponse,
  MetadataColumn,
  PaginatedResponse,
  SampleCountValidationRequest,
  SampleCountValidationResponse,
  SampleCountConfirmationError,
  AdvancedAutofillRequest,
  AdvancedAutofillResponse
} from '../models';

export interface MetadataTableQueryParams {
  search?: string;
  ownerId?: number;
  labGroupId?: number;
  isPublished?: boolean;
  isLocked?: boolean;
  showShared?: boolean;
  limit?: number;
  offset?: number;
  ordering?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MetadataTableService extends BaseApiService {

  /**
   * Get all metadata tables with optional filtering
   */
  getMetadataTables(params?: MetadataTableQueryParams): Observable<MetadataTableQueryResponse> {
    const httpParams = this.buildHttpParams(params);
    return this.get<MetadataTableQueryResponse>(`${this.apiUrl}/metadata-tables/`, { params: httpParams });
  }

  /**
   * Get a single metadata table by ID
   */
  getMetadataTable(id: number): Observable<MetadataTable> {
    return this.get<MetadataTable>(`${this.apiUrl}/metadata-tables/${id}/`);
  }

  /**
   * Create a new metadata table
   */
  createMetadataTable(table: MetadataTableCreateRequest): Observable<MetadataTable> {
    return this.post<MetadataTable>(`${this.apiUrl}/metadata-tables/`, table);
  }

  /**
   * Update an existing metadata table
   */
  updateMetadataTable(id: number, table: MetadataTableUpdateRequest): Observable<MetadataTable> {
    return this.put<MetadataTable>(`${this.apiUrl}/metadata-tables/${id}/`, table);
  }

  /**
   * Partially update a metadata table
   */
  patchMetadataTable(id: number, table: Partial<MetadataTableUpdateRequest>): Observable<MetadataTable> {
    return this.patch<MetadataTable>(`${this.apiUrl}/metadata-tables/${id}/`, table);
  }

  /**
   * Delete a metadata table
   */
  deleteMetadataTable(id: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/metadata-tables/${id}/`);
  }

  /**
   * Add a column to the metadata table
   */
  addColumn(id: number, columnData: any, position?: number): Observable<{ message: string; column: MetadataColumn }> {
    return this.post<{ message: string; column: MetadataColumn }>(`${this.apiUrl}/metadata-tables/${id}/add_column/`, {
      column_data: columnData,
      position
    });
  }

  /**
   * Add a column with automatic reordering
   */
  addColumnWithAutoReorder(id: number, request: { columnData: any }): Observable<{ message: string; column: MetadataColumn; reordered: boolean; schemaIdsUsed: number[] }> {
    return this.post<{ message: string; column: MetadataColumn; reordered: boolean; schemaIdsUsed: number[] }>(`${this.apiUrl}/metadata-tables/${id}/add_column_with_auto_reorder/`, request);
  }

  /**
   * Remove a column from the metadata table
   */
  removeColumn(id: number, columnId: number): Observable<{ message: string }> {
    return this.post<{ message: string }>(`${this.apiUrl}/metadata-tables/${id}/remove_column/`, {
      column_id: columnId
    });
  }

  /**
   * Reorder a column in the metadata table
   */
  reorderColumn(id: number, columnId: number, newPosition: number): Observable<{ message: string }> {
    return this.post<{ message: string }>(`${this.apiUrl}/metadata-tables/${id}/reorder_column/`, {
      column_id: columnId,
      new_position: newPosition
    });
  }

  /**
   * Normalize column positions
   */
  normalizeColumnPositions(id: number): Observable<{ message: string }> {
    return this.post<{ message: string }>(`${this.apiUrl}/metadata-tables/${id}/normalize_column_positions/`, {});
  }

  /**
   * Start async reordering of table columns by schema
   */
  reorderColumnsBySchemaAsync(id: number, schemaIds?: number[]): Observable<{
    taskId: string;
    message: string;
    metadataTableId: number;
    schemaIds: number[];
  }> {
    return this.post<{
      taskId: string;
      message: string;
      metadataTableId: number;
      schemaIds: number[];
    }>(`${this.apiUrl}/metadata-tables/${id}/reorder_columns_by_schema_async/`, {
      schemaIds: schemaIds || []
    });
  }

  /**
   * Get all tables (admin only)
   */
  getAdminAllTables(): Observable<MetadataTable[]> {
    return this.get<MetadataTable[]>(`${this.apiUrl}/metadata-tables/admin_all_tables/`);
  }

  /**
   * Search metadata tables
   */
  searchMetadataTables(query: string): Observable<MetadataTableQueryResponse> {
    return this.getMetadataTables({ search: query });
  }

  /**
   * Get metadata tables by owner
   */
  getMetadataTablesByOwner(ownerId: number): Observable<MetadataTableQueryResponse> {
    return this.getMetadataTables({ ownerId: ownerId });
  }

  /**
   * Get shared metadata tables
   */
  getSharedMetadataTables(): Observable<MetadataTableQueryResponse> {
    return this.getMetadataTables({ showShared: true });
  }

  /**
   * Combine columns column-wise
   */
  combineColumnwise(request: { columnIds: number[] }): Observable<{ message: string; combinedColumn: any }> {
    return this.post<{ message: string; combinedColumn: any }>(`${this.apiUrl}/metadata-tables/combine_columnwise/`, request);
  }

  /**
   * Combine columns row-wise
   */
  combineRowwise(request: { columnIds: number[] }): Observable<{ message: string; combinedColumn: any }> {
    return this.post<{ message: string; combinedColumn: any }>(`${this.apiUrl}/metadata-tables/combine_rowwise/`, request);
  }

  validateSampleCountChange(id: number, request: SampleCountValidationRequest): Observable<SampleCountValidationResponse> {
    return this.post<SampleCountValidationResponse>(`${this.apiUrl}/metadata-tables/${id}/validate_sample_count_change/`, request);
  }

  updateSampleCount(id: number, newSampleCount: number, confirmed: boolean = false): Observable<{ message: string; oldSampleCount: number; newSampleCount: number; cleanupPerformed: boolean }> {
    return this.post<{ message: string; oldSampleCount: number; newSampleCount: number; cleanupPerformed: boolean }>(`${this.apiUrl}/metadata-tables/${id}/update_sample_count/`, {
      newSampleCount,
      confirmed
    });
  }

  /**
   * Replace all occurrences of a specific value across columns in this table
   */
  replaceColumnValue(id: number, request: {
    oldValue: string;
    newValue: string;
    columnId?: number;
    columnName?: string;
    updatePools?: boolean;
  }): Observable<{
    message: string;
    oldValue: string;
    newValue: string;
    columnsChecked: number;
    columnsUpdated: number;
    modifiersMerged: number;
    modifiersDeleted: number;
    samplesRevertedToDefault: number;
    poolColumnsUpdated: number;
  }> {
    return this.post(`${this.apiUrl}/metadata-tables/${id}/replace_column_value/`, request);
  }

  /**
   * Bulk delete columns from a metadata table
   */
  bulkDeleteColumns(id: number, request: {
    columnIds: number[];
  }): Observable<{
    message: string;
    deletedCount: number;
    deletedColumns: Array<{id: number; name: string}>;
    permissionDeniedColumns: Array<{id: number; name: string}>;
  }> {
    return this.post(`${this.apiUrl}/metadata-tables/${id}/bulk_delete_columns/`, request);
  }

  /**
   * Bulk update staff-only status for columns
   */
  bulkUpdateStaffOnly(id: number, request: {
    columnIds: number[];
    staffOnly: boolean;
  }): Observable<{
    message: string;
    updatedCount: number;
    updatedColumns: Array<{id: number; name: string; staffOnly: boolean}>;
    permissionDeniedColumns: Array<{id: number; name: string}>;
    staffOnly: boolean;
  }> {
    return this.post(`${this.apiUrl}/metadata-tables/${id}/bulk_update_staff_only/`, request);
  }

  advancedAutofill(id: number, request: AdvancedAutofillRequest): Observable<AdvancedAutofillResponse> {
    return this.post<AdvancedAutofillResponse>(`${this.apiUrl}/metadata-tables/${id}/advanced_autofill/`, request);
  }
}