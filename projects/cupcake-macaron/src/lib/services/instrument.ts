import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@noatgnu/cupcake-core';
import { MetadataTable, MetadataColumn, MetadataColumnCreateRequest } from '@noatgnu/cupcake-vanilla';

import {
  Instrument,
  InstrumentCreateRequest,
  InstrumentUpdateRequest,
  PaginatedResponse,
  InstrumentQueryParams
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class InstrumentService extends BaseApiService {

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
  getInstrument(id: number): Observable<Instrument> {
    return this.get<Instrument>(`${this.apiUrl}/instruments/${id}/`);
  }

  /**
   * Create a new instrument
   */
  createInstrument(instrument: InstrumentCreateRequest): Observable<Instrument> {
    const formData = this.prepareInstrumentData(instrument);
    return this.http.post<Instrument>(`${this.apiUrl}/instruments/`, formData);
  }

  /**
   * Update an existing instrument
   */
  updateInstrument(id: number, instrument: InstrumentUpdateRequest): Observable<Instrument> {
    const formData = this.prepareInstrumentData(instrument);
    return this.http.put<Instrument>(`${this.apiUrl}/instruments/${id}/`, formData);
  }

  /**
   * Partially update an instrument
   */
  patchInstrument(id: number, instrument: Partial<InstrumentUpdateRequest>): Observable<Instrument> {
    const formData = this.prepareInstrumentData(instrument);
    return this.http.patch<Instrument>(`${this.apiUrl}/instruments/${id}/`, formData);
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
          if (key === 'image' && value instanceof File) {
            formData.append(key, value);
          } else {
            formData.append(key, value.toString());
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
    return this.http.post<{ warrantyValid: boolean; warrantyExpiration?: string; message: string }>(
      `${this.apiUrl}/instruments/${id}/check_warranty/`, {}
    );
  }

  /**
   * Check maintenance status for an instrument
   */
  checkMaintenance(id: number): Observable<{ maintenanceRequired: boolean; lastMaintenance?: string; message: string }> {
    return this.http.post<{ maintenanceRequired: boolean; lastMaintenance?: string; message: string }>(
      `${this.apiUrl}/instruments/${id}/check_maintenance/`, {}
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
    return this.http.post<{ message: string; column: MetadataColumn }>(
      `${this.apiUrl}/instruments/${id}/add_metadata_column/`, columnData
    );
  }

  /**
   * Remove a column from the instrument's metadata table
   */
  removeMetadataColumn(id: number, columnId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
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
   * Transform camelCase properties to snake_case for API
   */
  private transformToApiFormat(data: any): any {
    const transformed: any = {};
    
    Object.entries(data).forEach(([key, value]) => {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      transformed[snakeKey] = value;
    });
    
    return transformed;
  }
}