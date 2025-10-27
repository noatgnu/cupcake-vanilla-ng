import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService, AnnotationFolder } from '@noatgnu/cupcake-core';
import { MetadataTable, MetadataColumn, MetadataColumnCreateRequest } from '@noatgnu/cupcake-vanilla';

import {
  Instrument,
  InstrumentDetail,
  InstrumentCreateRequest,
  InstrumentUpdateRequest,
  PaginatedResponse,
  InstrumentQueryParams,
  InstrumentAlertType,
  AnnotationChunkedUploadCompletionResponse,
  InstrumentAnnotation,
  InstrumentAnnotationQueryParams,
  InstrumentAnnotationCreateRequest,
  InstrumentAnnotationUpdateRequest
} from '../models';
import { AnnotationChunkedUploadService } from './annotation-chunked-upload';

@Injectable({
  providedIn: 'root'
})
export class InstrumentService extends BaseApiService {

  constructor(private annotationChunkedUploadService: AnnotationChunkedUploadService) {
    super();
  }

  /**
   * Get all instruments with optional filtering
   */
  getInstruments(params?: InstrumentQueryParams): Observable<PaginatedResponse<Instrument>> {
    const httpParams = this.buildHttpParams(params);
    return this.get<PaginatedResponse<Instrument>>(`${this.apiUrl}/instruments/`, { params: httpParams });
  }

  /**
   * Get a single instrument by ID
   */
  getInstrument(id: number): Observable<InstrumentDetail> {
    return this.get<InstrumentDetail>(`${this.apiUrl}/instruments/${id}/`);
  }

  /**
   * Create a new instrument
   */
  createInstrument(instrument: InstrumentCreateRequest): Observable<Instrument> {
    const formData = this.prepareInstrumentData(instrument);
    return this.post<Instrument>(`${this.apiUrl}/instruments/`, formData);
  }

  /**
   * Update an existing instrument
   */
  updateInstrument(id: number, instrument: InstrumentUpdateRequest): Observable<Instrument> {
    const formData = this.prepareInstrumentData(instrument);
    return this.put<Instrument>(`${this.apiUrl}/instruments/${id}/`, formData);
  }

  /**
   * Partially update an instrument
   */
  patchInstrument(id: number, instrument: Partial<InstrumentUpdateRequest>): Observable<Instrument> {
    const formData = this.prepareInstrumentData(instrument);
    return this.patch<Instrument>(`${this.apiUrl}/instruments/${id}/`, formData);
  }

  /**
   * Delete an instrument
   */
  deleteInstrument(id: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/instruments/${id}/`);
  }

  /**
   * Get instruments for a specific user
   */
  getUserInstruments(userId: number): Observable<PaginatedResponse<Instrument>> {
    return this.getInstruments({ user: userId });
  }

  /**
   * Get enabled instruments only
   */
  getEnabledInstruments(): Observable<PaginatedResponse<Instrument>> {
    return this.getInstruments({ enabled: true });
  }

  /**
   * Search instruments by name or description
   */
  searchInstruments(query: string): Observable<PaginatedResponse<Instrument>> {
    return this.getInstruments({ search: query });
  }

  /**
   * Prepare instrument data for API submission, handling file uploads
   */
  private prepareInstrumentData(instrument: any): FormData | any {
    if (instrument.image && instrument.image instanceof File) {
      const formData = new FormData();

      Object.entries(instrument).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
          if (key === 'image' && value instanceof File) {
            formData.append(snakeKey, value);
          } else {
            formData.append(snakeKey, value.toString());
          }
        }
      });

      return formData;
    }

    return instrument;
  }

  /**
   * Check warranty status for an instrument
   */
  checkWarranty(id: number): Observable<{ warrantyValid: boolean; warrantyExpiration?: string; message: string }> {
    return this.post<{ warrantyValid: boolean; warrantyExpiration?: string; message: string }>(
      `${this.apiUrl}/instruments/${id}/check_warranty/`, {}
    );
  }

  /**
   * Check maintenance status for an instrument
   */
  checkMaintenance(id: number): Observable<{ maintenanceRequired: boolean; lastMaintenance?: string; message: string }> {
    return this.post<{ maintenanceRequired: boolean; lastMaintenance?: string; message: string }>(
      `${this.apiUrl}/instruments/${id}/check_maintenance/`, {}
    );
  }

  /**
   * Send a test notification for this instrument
   * Only accessible by staff or admin users
   * @param id - Instrument ID
   * @param notificationType - Type of notification
   * @param recipientId - Optional user ID to send to (defaults to current user)
   */
  sendTestNotification(
    id: number,
    notificationType: InstrumentAlertType,
    recipientId?: number
  ): Observable<{ success: boolean; message: string; notificationType: string }> {
    const body: any = { notificationType };
    if (recipientId !== undefined) {
      body.recipientId = recipientId;
    }
    return this.post<{ success: boolean; message: string; notificationType: string }>(
      `${this.apiUrl}/instruments/${id}/send_test_notification/`, body
    );
  }


  /**
   * Get metadata table details for this instrument
   */
  getInstrumentMetadata(id: number): Observable<MetadataTable> {
    return this.get<MetadataTable>(`${this.apiUrl}/instruments/${id}/metadata/`);
  }

  /**
   * Add a column to the instrument's metadata table
   */
  addMetadataColumn(id: number, columnData: MetadataColumnCreateRequest): Observable<{ message: string; column: MetadataColumn }> {
    return this.post<{ message: string; column: MetadataColumn }>(
      `${this.apiUrl}/instruments/${id}/add_metadata_column/`, columnData
    );
  }

  /**
   * Remove a column from the instrument's metadata table
   */
  removeMetadataColumn(id: number, columnId: string): Observable<{ message: string }> {
    return this.delete<{ message: string }>(
      `${this.apiUrl}/instruments/${id}/remove_metadata_column/${columnId}/`
    );
  }

  /**
   * Update values in the instrument's metadata table
   */
  updateMetadataValue(id: number, updateData: { columnId: number; value: string }): Observable<{ 
    message: string; 
    columnName: string;
    newValue: string;
  }> {
    return this.patch(`${this.apiUrl}/instruments/${id}/update_metadata_value/`, updateData);
  }

  /**
   * Upload annotation file for instrument with automatic binding
   * Uses chunked upload for large files with progress tracking
   *
   * @param instrumentId - ID of the instrument
   * @param folderId - ID of the folder (Manuals, Certificates, or Maintenance)
   * @param file - File to upload
   * @param options - Optional annotation text, type, and progress callback
   */
  uploadAnnotation(
    instrumentId: number,
    folderId: number,
    file: File,
    options?: {
      annotation?: string;
      annotationType?: string;
      onProgress?: (progress: number) => void;
    }
  ): Observable<AnnotationChunkedUploadCompletionResponse> {
    return this.annotationChunkedUploadService.uploadInstrumentAnnotationFileInChunks(
      file,
      instrumentId,
      folderId,
      1024 * 1024,
      options
    );
  }

  /**
   * Get all instrument annotations with optional filtering
   */
  getInstrumentAnnotations(params?: InstrumentAnnotationQueryParams): Observable<PaginatedResponse<InstrumentAnnotation>> {
    const httpParams = this.buildHttpParams(params);
    return this.get<PaginatedResponse<InstrumentAnnotation>>(`${this.apiUrl}/instrument-annotations/`, { params: httpParams });
  }

  /**
   * Get a single instrument annotation by ID
   */
  getInstrumentAnnotation(id: number): Observable<InstrumentAnnotation> {
    return this.get<InstrumentAnnotation>(`${this.apiUrl}/instrument-annotations/${id}/`);
  }

  /**
   * Get all annotations for a specific instrument
   */
  getAnnotationsForInstrument(instrumentId: number): Observable<PaginatedResponse<InstrumentAnnotation>> {
    return this.getInstrumentAnnotations({ instrument: instrumentId });
  }

  /**
   * Get annotations in a specific folder for an instrument
   */
  getInstrumentAnnotationsByFolder(instrumentId: number, folderId: number): Observable<PaginatedResponse<InstrumentAnnotation>> {
    return this.getInstrumentAnnotations({ instrument: instrumentId, folder: folderId });
  }

  /**
   * Create a new instrument annotation (non-file)
   */
  createInstrumentAnnotation(annotation: InstrumentAnnotationCreateRequest): Observable<InstrumentAnnotation> {
    return this.post<InstrumentAnnotation>(`${this.apiUrl}/instrument-annotations/`, annotation);
  }

  /**
   * Update an instrument annotation
   */
  updateInstrumentAnnotation(id: number, annotation: InstrumentAnnotationUpdateRequest): Observable<InstrumentAnnotation> {
    return this.put<InstrumentAnnotation>(`${this.apiUrl}/instrument-annotations/${id}/`, annotation);
  }

  /**
   * Partially update an instrument annotation
   */
  patchInstrumentAnnotation(id: number, annotation: Partial<InstrumentAnnotationUpdateRequest>): Observable<InstrumentAnnotation> {
    return this.patch<InstrumentAnnotation>(`${this.apiUrl}/instrument-annotations/${id}/`, annotation);
  }

  /**
   * Delete an instrument annotation
   */
  deleteInstrumentAnnotation(id: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/instrument-annotations/${id}/`);
  }

  /**
   * Get annotation folders for this instrument
   * Returns Manuals, Certificates, and Maintenance folders
   */
  getInstrumentFolders(id: number): Observable<AnnotationFolder[]> {
    return this.get<AnnotationFolder[]>(`${this.apiUrl}/instruments/${id}/folders/`);
  }
}