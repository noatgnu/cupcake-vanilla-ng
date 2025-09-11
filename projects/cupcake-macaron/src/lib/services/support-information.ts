import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@cupcake/core';

import {
  SupportInformation,
  SupportInformationCreateRequest,
  SupportInformationUpdateRequest,
  PaginatedResponse
} from '../models';

export interface SupportInformationQueryParams {
  search?: string;
  vendorName?: string;
  manufacturerName?: string;
  location?: number;
  warrantyStartDate?: string;
  warrantyEndDate?: string;
  limit?: number;
  offset?: number;
  ordering?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SupportInformationService extends BaseApiService {

  /**
   * Get all support information records with optional filtering
   */
  getSupportInformation(params?: SupportInformationQueryParams): Observable<PaginatedResponse<SupportInformation>> {
    const httpParams = this.buildHttpParams(params);
    return this.get<PaginatedResponse<SupportInformation>>(`${this.apiUrl}/support-information/`, { params: httpParams });
  }

  /**
   * Get a single support information record by ID
   */
  getSupportInformationRecord(id: number): Observable<SupportInformation> {
    return this.get<SupportInformation>(`${this.apiUrl}/support-information/${id}/`);
  }

  /**
   * Create a new support information record
   */
  createSupportInformation(supportInfo: SupportInformationCreateRequest): Observable<SupportInformation> {
    return this.post<SupportInformation>(`${this.apiUrl}/support-information/`, supportInfo);
  }

  /**
   * Update an existing support information record
   */
  updateSupportInformation(id: number, supportInfo: SupportInformationUpdateRequest): Observable<SupportInformation> {
    return this.put<SupportInformation>(`${this.apiUrl}/support-information/${id}/`, supportInfo);
  }

  /**
   * Partially update a support information record
   */
  patchSupportInformation(id: number, supportInfo: Partial<SupportInformationUpdateRequest>): Observable<SupportInformation> {
    return this.patch<SupportInformation>(`${this.apiUrl}/support-information/${id}/`, supportInfo);
  }

  /**
   * Delete a support information record
   */
  deleteSupportInformation(id: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/support-information/${id}/`);
  }

  /**
   * Get support information by vendor name
   */
  getSupportByVendor(vendorName: string): Observable<PaginatedResponse<SupportInformation>> {
    return this.getSupportInformation({ vendorName });
  }

  /**
   * Get support information by manufacturer name
   */
  getSupportByManufacturer(manufacturerName: string): Observable<PaginatedResponse<SupportInformation>> {
    return this.getSupportInformation({ manufacturerName });
  }

  /**
   * Get support information by location
   */
  getSupportByLocation(locationId: number): Observable<PaginatedResponse<SupportInformation>> {
    return this.getSupportInformation({ location: locationId });
  }

  /**
   * Get support information with active warranties
   */
  getActiveWarranties(): Observable<PaginatedResponse<SupportInformation>> {
    const today = new Date().toISOString().split('T')[0];
    return this.getSupportInformation({ warrantyEndDate: today });
  }

  /**
   * Search support information
   */
  searchSupportInformation(query: string): Observable<PaginatedResponse<SupportInformation>> {
    return this.getSupportInformation({ search: query });
  }
}