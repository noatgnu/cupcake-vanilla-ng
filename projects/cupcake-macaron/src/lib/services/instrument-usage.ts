import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@noatgnu/cupcake-core';

import {
  InstrumentUsage,
  InstrumentUsageCreateRequest,
  InstrumentUsageUpdateRequest,
  PaginatedResponse
} from '../models';

export interface InstrumentUsageQueryParams {
  search?: string;
  user?: number;
  instrument?: number;
  approved?: boolean;
  maintenance?: boolean;
  approvedBy?: number;
  timeStarted__gte?: string;
  timeStarted__lte?: string;
  timeStarted__gt?: string;
  timeStarted__lt?: string;
  timeEnded__gte?: string;
  timeEnded__lte?: string;
  timeEnded__gt?: string;
  timeEnded__lt?: string;
  limit?: number;
  offset?: number;
  ordering?: string;
}

@Injectable({
  providedIn: 'root'
})
export class InstrumentUsageService extends BaseApiService {

  /**
   * Get all instrument usage records with optional filtering
   */
  getInstrumentUsage(params?: InstrumentUsageQueryParams): Observable<PaginatedResponse<InstrumentUsage>> {
    const httpParams = this.buildHttpParams(params);
    return this.get<PaginatedResponse<InstrumentUsage>>(`${this.apiUrl}/instrument-usage/`, { params: httpParams });
  }

  /**
   * Get a single instrument usage record by ID
   */
  getInstrumentUsageRecord(id: number): Observable<InstrumentUsage> {
    return this.get<InstrumentUsage>(`${this.apiUrl}/instrument-usage/${id}/`);
  }

  /**
   * Create a new instrument usage record
   */
  createInstrumentUsage(usage: InstrumentUsageCreateRequest): Observable<InstrumentUsage> {
    return this.post<InstrumentUsage>(`${this.apiUrl}/instrument-usage/`, usage);
  }

  /**
   * Update an existing instrument usage record
   */
  updateInstrumentUsage(id: number, usage: InstrumentUsageUpdateRequest): Observable<InstrumentUsage> {
    return this.put<InstrumentUsage>(`${this.apiUrl}/instrument-usage/${id}/`, usage);
  }

  /**
   * Partially update an instrument usage record
   */
  patchInstrumentUsage(id: number, usage: Partial<InstrumentUsageUpdateRequest>): Observable<InstrumentUsage> {
    return this.patch<InstrumentUsage>(`${this.apiUrl}/instrument-usage/${id}/`, usage);
  }

  /**
   * Delete an instrument usage record
   */
  deleteInstrumentUsage(id: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/instrument-usage/${id}/`);
  }

  /**
   * Get current user's usage records
   */
  getMyUsage(): Observable<PaginatedResponse<InstrumentUsage>> {
    return this.get<PaginatedResponse<InstrumentUsage>>(`${this.apiUrl}/instrument-usage/my_usage/`);
  }

  /**
   * Get usage records for a specific user
   */
  getUserUsage(userId: number): Observable<PaginatedResponse<InstrumentUsage>> {
    return this.getInstrumentUsage({ user: userId });
  }

  /**
   * Get usage records for a specific instrument
   */
  getInstrumentUsageRecords(instrumentId: number): Observable<PaginatedResponse<InstrumentUsage>> {
    return this.getInstrumentUsage({ instrument: instrumentId });
  }

  /**
   * Get approved usage records
   */
  getApprovedUsage(): Observable<PaginatedResponse<InstrumentUsage>> {
    return this.getInstrumentUsage({ approved: true });
  }

  /**
   * Get maintenance usage records
   */
  getMaintenanceUsage(): Observable<PaginatedResponse<InstrumentUsage>> {
    return this.getInstrumentUsage({ maintenance: true });
  }

  /**
   * Search usage records by description
   */
  searchInstrumentUsage(query: string): Observable<PaginatedResponse<InstrumentUsage>> {
    return this.getInstrumentUsage({ search: query });
  }
}