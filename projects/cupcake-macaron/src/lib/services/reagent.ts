import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService, AnnotationFolder } from '@noatgnu/cupcake-core';
import { MetadataTable, MetadataColumn, MetadataColumnCreateRequest } from '@noatgnu/cupcake-vanilla';

import {
  Reagent,
  ReagentCreateRequest,
  ReagentUpdateRequest,
  StoredReagent,
  StoredReagentCreateRequest,
  StoredReagentUpdateRequest,
  PaginatedResponse,
  ReagentAlertType,
  AnnotationChunkedUploadCompletionResponse,
  StoredReagentAnnotation,
  StoredReagentAnnotationQueryParams
} from '../models';
import { AnnotationChunkedUploadService } from './annotation-chunked-upload';

export interface ReagentQueryParams {
  search?: string;
  name?: string;
  unit?: string;
  limit?: number;
  offset?: number;
  ordering?: string;
}

export interface StoredReagentQueryParams {
  search?: string;
  reagent?: number;
  storageObject?: number;
  includeSubStorage?: boolean;
  user?: number;
  shareable?: boolean;
  accessAll?: boolean;
  lowStock?: boolean;
  expired?: boolean;
  expirationDateAfter?: string;
  expirationDateBefore?: string;
  molecularWeight?: number;
  molecularWeight__gt?: number;
  molecularWeight__lt?: number;
  molecularWeight__gte?: number;
  molecularWeight__lte?: number;
  molecularWeight__isnull?: boolean;
  limit?: number;
  offset?: number;
  ordering?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReagentService extends BaseApiService {

  constructor(private annotationChunkedUploadService: AnnotationChunkedUploadService) {
    super();
  }

  // ===== REAGENT METHODS =====

  /**
   * Get all reagents with optional filtering
   */
  getReagents(params?: ReagentQueryParams): Observable<PaginatedResponse<Reagent>> {
    const httpParams = this.buildHttpParams(params);
    return this.get<PaginatedResponse<Reagent>>(`${this.apiUrl}/reagents/`, { params: httpParams });
  }

  /**
   * Get a single reagent by ID
   */
  getReagent(id: number): Observable<Reagent> {
    return this.get<Reagent>(`${this.apiUrl}/reagents/${id}/`);
  }

  /**
   * Create a new reagent
   */
  createReagent(reagent: ReagentCreateRequest): Observable<Reagent> {
    return this.post<Reagent>(`${this.apiUrl}/reagents/`, reagent);
  }

  /**
   * Update an existing reagent
   */
  updateReagent(id: number, reagent: ReagentUpdateRequest): Observable<Reagent> {
    return this.put<Reagent>(`${this.apiUrl}/reagents/${id}/`, reagent);
  }

  /**
   * Partially update a reagent
   */
  patchReagent(id: number, reagent: Partial<ReagentUpdateRequest>): Observable<Reagent> {
    return this.patch<Reagent>(`${this.apiUrl}/reagents/${id}/`, reagent);
  }

  /**
   * Delete a reagent
   */
  deleteReagent(id: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/reagents/${id}/`);
  }

  /**
   * Search reagents by name
   */
  searchReagents(query: string): Observable<PaginatedResponse<Reagent>> {
    return this.getReagents({ search: query });
  }

  // ===== STORED REAGENT METHODS =====

  /**
   * Get all stored reagents with optional filtering
   */
  getStoredReagents(params?: StoredReagentQueryParams): Observable<PaginatedResponse<StoredReagent>> {
    const httpParams = this.buildHttpParams(params);
    return this.get<PaginatedResponse<StoredReagent>>(`${this.apiUrl}/stored-reagents/`, { params: httpParams });
  }

  /**
   * Get a single stored reagent by ID
   */
  getStoredReagent(id: number): Observable<StoredReagent> {
    return this.get<StoredReagent>(`${this.apiUrl}/stored-reagents/${id}/`);
  }

  /**
   * Create a new stored reagent
   */
  createStoredReagent(storedReagent: StoredReagentCreateRequest): Observable<StoredReagent> {
    return this.post<StoredReagent>(`${this.apiUrl}/stored-reagents/`, storedReagent);
  }

  /**
   * Update an existing stored reagent
   */
  updateStoredReagent(id: number, storedReagent: StoredReagentUpdateRequest): Observable<StoredReagent> {
    return this.put<StoredReagent>(`${this.apiUrl}/stored-reagents/${id}/`, storedReagent);
  }

  /**
   * Partially update a stored reagent
   */
  patchStoredReagent(id: number, storedReagent: Partial<StoredReagentUpdateRequest>): Observable<StoredReagent> {
    return this.patch<StoredReagent>(`${this.apiUrl}/stored-reagents/${id}/`, storedReagent);
  }

  /**
   * Delete a stored reagent
   */
  deleteStoredReagent(id: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/stored-reagents/${id}/`);
  }

  /**
   * Get stored reagents for a specific reagent type
   */
  getStoredReagentsByType(reagentId: number): Observable<PaginatedResponse<StoredReagent>> {
    return this.getStoredReagents({ reagent: reagentId });
  }

  /**
   * Get stored reagents in a specific storage location
   * @param storageId - The storage object ID
   * @param includeSubStorage - If true, includes reagents from all nested child storage objects
   */
  getStoredReagentsByStorage(storageId: number, includeSubStorage: boolean = false): Observable<PaginatedResponse<StoredReagent>> {
    return this.getStoredReagents({ storageObject: storageId, includeSubStorage });
  }

  /**
   * Get stored reagents in a specific storage location including all nested child storage objects
   * @param storageId - The storage object ID
   */
  getStoredReagentsByStorageWithChildren(storageId: number): Observable<PaginatedResponse<StoredReagent>> {
    return this.getStoredReagents({ storageObject: storageId, includeSubStorage: true });
  }

  /**
   * Get stored reagents owned by a specific user
   */
  getUserStoredReagents(userId: number): Observable<PaginatedResponse<StoredReagent>> {
    return this.getStoredReagents({ user: userId });
  }

  /**
   * Get shareable stored reagents
   */
  getShareableStoredReagents(): Observable<PaginatedResponse<StoredReagent>> {
    return this.getStoredReagents({ shareable: true });
  }

  /**
   * Get low stock stored reagents
   */
  getLowStockStoredReagents(): Observable<PaginatedResponse<StoredReagent>> {
    return this.getStoredReagents({ lowStock: true });
  }

  /**
   * Get expired stored reagents
   */
  getExpiredStoredReagents(): Observable<PaginatedResponse<StoredReagent>> {
    return this.getStoredReagents({ expired: true });
  }

  /**
   * Search stored reagents
   */
  searchStoredReagents(query: string): Observable<PaginatedResponse<StoredReagent>> {
    return this.getStoredReagents({ search: query });
  }

  /**
   * Get stored reagents expiring within date range
   */
  getStoredReagentsExpiringInRange(startDate: string, endDate?: string): Observable<PaginatedResponse<StoredReagent>> {
    const params: StoredReagentQueryParams = { expirationDateAfter: startDate };
    if (endDate) {
      params.expirationDateBefore = endDate;
    }
    return this.getStoredReagents(params);
  }

  // ===== STORED REAGENT CUSTOM ACTIONS =====


  /**
   * Get stored reagents with low stock based on individual threshold (from Django custom action)
   */
  getLowStockStoredReagentsAction(): Observable<StoredReagent[]> {
    return this.get<StoredReagent[]>(`${this.apiUrl}/stored-reagents/low_stock/`);
  }

  /**
   * Get metadata table details for this stored reagent
   */
  getStoredReagentMetadata(id: number): Observable<MetadataTable> {
    return this.get<MetadataTable>(`${this.apiUrl}/stored-reagents/${id}/metadata/`);
  }

  /**
   * Add a column to the stored reagent's metadata table
   */
  addStoredReagentMetadataColumn(id: number, columnData: MetadataColumnCreateRequest): Observable<{ message: string; column: MetadataColumn }> {
    return this.post<{ message: string; column: MetadataColumn }>(
      `${this.apiUrl}/stored-reagents/${id}/add_metadata_column/`, columnData
    );
  }

  /**
   * Remove a column from the stored reagent's metadata table
   */
  removeStoredReagentMetadataColumn(id: number, columnId: string): Observable<{ message: string }> {
    return this.delete<{ message: string }>(
      `${this.apiUrl}/stored-reagents/${id}/remove_metadata_column/${columnId}/`
    );
  }

  /**
   * Update values in the stored reagent's metadata table
   */
  updateStoredReagentMetadataValue(id: number, updateData: { columnId: number; value: string }): Observable<{
    message: string;
    columnName: string;
    newValue: string;
  }> {
    return this.patch(`${this.apiUrl}/stored-reagents/${id}/update_metadata_value/`, updateData);
  }

  /**
   * Send a test notification for this stored reagent
   * Only accessible by staff or admin users
   * @param id - Stored reagent ID
   * @param notificationType - Type of notification
   * @param recipientId - Optional user ID to send to (defaults to current user)
   */
  sendTestNotification(
    id: number,
    notificationType: ReagentAlertType,
    recipientId?: number
  ): Observable<{ success: boolean; message: string; notificationType: string }> {
    const body: any = { notification_type: notificationType };
    if (recipientId !== undefined) {
      body.recipient_id = recipientId;
    }
    return this.http.post<{ success: boolean; message: string; notificationType: string }>(
      `${this.apiUrl}/stored-reagents/${id}/send_test_notification/`, body
    );
  }

  /**
   * Upload annotation file for stored reagent with automatic binding
   * Uses chunked upload for large files with progress tracking
   *
   * @param storedReagentId - ID of the stored reagent
   * @param folderId - ID of the folder (MSDS, Certificates, or Manuals)
   * @param file - File to upload
   * @param options - Optional annotation text, type, and progress callback
   */
  uploadAnnotation(
    storedReagentId: number,
    folderId: number,
    file: File,
    options?: {
      annotation?: string;
      annotationType?: string;
      onProgress?: (progress: number) => void;
    }
  ): Observable<AnnotationChunkedUploadCompletionResponse> {
    return this.annotationChunkedUploadService.uploadStoredReagentAnnotationFileInChunks(
      file,
      storedReagentId,
      folderId,
      1024 * 1024,
      options
    );
  }

  /**
   * Get all stored reagent annotations with optional filtering
   */
  getStoredReagentAnnotations(params?: StoredReagentAnnotationQueryParams): Observable<PaginatedResponse<StoredReagentAnnotation>> {
    const httpParams = this.buildHttpParams(params);
    return this.get<PaginatedResponse<StoredReagentAnnotation>>(`${this.apiUrl}/stored-reagent-annotations/`, { params: httpParams });
  }

  /**
   * Get a single stored reagent annotation by ID
   */
  getStoredReagentAnnotation(id: number): Observable<StoredReagentAnnotation> {
    return this.get<StoredReagentAnnotation>(`${this.apiUrl}/stored-reagent-annotations/${id}/`);
  }

  /**
   * Get all annotations for a specific stored reagent
   */
  getAnnotationsForStoredReagent(storedReagentId: number): Observable<PaginatedResponse<StoredReagentAnnotation>> {
    return this.getStoredReagentAnnotations({ storedReagent: storedReagentId });
  }

  /**
   * Get annotations in a specific folder for a stored reagent
   */
  getStoredReagentAnnotationsByFolder(storedReagentId: number, folderId: number): Observable<PaginatedResponse<StoredReagentAnnotation>> {
    return this.getStoredReagentAnnotations({ storedReagent: storedReagentId, folder: folderId });
  }

  /**
   * Delete a stored reagent annotation
   */
  deleteStoredReagentAnnotation(id: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/stored-reagent-annotations/${id}/`);
  }

  /**
   * Get annotation folders for this stored reagent
   * Returns MSDS, Certificates, and Manuals folders
   */
  getStoredReagentFolders(id: number): Observable<AnnotationFolder[]> {
    return this.get<AnnotationFolder[]>(`${this.apiUrl}/stored-reagents/${id}/folders/`);
  }
}