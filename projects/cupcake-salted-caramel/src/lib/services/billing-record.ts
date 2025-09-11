import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@cupcake/core';

import {
  BillingRecord,
  BillingRecordCreateRequest,
  BillingRecordUpdateRequest,
  BillingRecordSummary,
  BillingApprovalRequest,
  BillingStatus,
  PaginatedResponse
} from '../models';

export interface BillingRecordQueryParams {
  search?: string;
  status?: BillingStatus;
  currency?: string;
  costCenter?: string;
  user?: number;
  serviceTier?: number;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
  ordering?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BillingRecordService extends BaseApiService {

  /**
   * Get all billing records with optional filtering
   */
  getBillingRecords(params?: BillingRecordQueryParams): Observable<PaginatedResponse<BillingRecord>> {
    const httpParams = this.buildHttpParams(params);
    return this.get<PaginatedResponse<BillingRecord>>(`${this.apiUrl}/billing-records/`, { params: httpParams });
  }

  /**
   * Get a single billing record by ID
   */
  getBillingRecord(id: string): Observable<BillingRecord> {
    return this.get<BillingRecord>(`${this.apiUrl}/billing-records/${id}/`);
  }

  /**
   * Create a new billing record
   */
  createBillingRecord(record: BillingRecordCreateRequest): Observable<BillingRecord> {
    return this.post<BillingRecord>(`${this.apiUrl}/billing-records/`, record);
  }

  /**
   * Update an existing billing record
   */
  updateBillingRecord(id: string, record: BillingRecordUpdateRequest): Observable<BillingRecord> {
    return this.put<BillingRecord>(`${this.apiUrl}/billing-records/${id}/`, record);
  }

  /**
   * Partially update a billing record
   */
  patchBillingRecord(id: string, record: Partial<BillingRecordUpdateRequest>): Observable<BillingRecord> {
    return this.patch<BillingRecord>(`${this.apiUrl}/billing-records/${id}/`, record);
  }

  /**
   * Delete a billing record
   */
  deleteBillingRecord(id: string): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/billing-records/${id}/`);
  }

  /**
   * Approve a billing record
   */
  approveBillingRecord(id: string, request: BillingApprovalRequest): Observable<BillingRecord> {
    return this.post<BillingRecord>(`${this.apiUrl}/billing-records/${id}/approve/`, request);
  }


  /**
   * Get billing summary statistics (Django custom action)
   */
  getSummary(params?: { 
    dateFrom?: string; 
    dateTo?: string; 
    currency?: string;
    costCenter?: string;
    serviceTier?: number;
  }): Observable<BillingRecordSummary> {
    const httpParams = this.buildHttpParams(params);
    return this.get<BillingRecordSummary>(`${this.apiUrl}/billing-records/summary/`, { params: httpParams });
  }

  /**
   * Get billing records pending approval (Django custom action)
   */
  getPendingApproval(): Observable<PaginatedResponse<BillingRecord>> {
    return this.get<PaginatedResponse<BillingRecord>>(`${this.apiUrl}/billing-records/pending_approval/`);
  }

  /**
   * Get billing records grouped by cost center (Django custom action)
   */
  getByCostCenter(): Observable<{ [key: string]: BillingRecord[] }> {
    return this.get<{ [key: string]: BillingRecord[] }>(`${this.apiUrl}/billing-records/by_cost_center/`);
  }

  /**
   * Get user billing records
   */
  getUserBillingRecords(userId: number): Observable<PaginatedResponse<BillingRecord>> {
    return this.getBillingRecords({ user: userId });
  }

  /**
   * Get my billing records (current user)
   */
  getMyBillingRecords(): Observable<PaginatedResponse<BillingRecord>> {
    return this.get<PaginatedResponse<BillingRecord>>(`${this.apiUrl}/billing-records/my_records/`);
  }

  /**
   * Search billing records by description, notes, or cost center
   */
  searchBillingRecords(query: string): Observable<PaginatedResponse<BillingRecord>> {
    return this.getBillingRecords({ search: query });
  }

  /**
   * Get pending billing records
   */
  getPendingBillingRecords(): Observable<PaginatedResponse<BillingRecord>> {
    return this.getBillingRecords({ status: BillingStatus.PENDING });
  }

  /**
   * Get approved billing records
   */
  getApprovedBillingRecords(): Observable<PaginatedResponse<BillingRecord>> {
    return this.getBillingRecords({ status: BillingStatus.APPROVED });
  }

  /**
   * Get billed billing records
   */
  getBilledBillingRecords(): Observable<PaginatedResponse<BillingRecord>> {
    return this.getBillingRecords({ status: BillingStatus.BILLED });
  }

  /**
   * Get paid billing records
   */
  getPaidBillingRecords(): Observable<PaginatedResponse<BillingRecord>> {
    return this.getBillingRecords({ status: BillingStatus.PAID });
  }

  /**
   * Get disputed billing records
   */
  getDisputedBillingRecords(): Observable<PaginatedResponse<BillingRecord>> {
    return this.getBillingRecords({ status: BillingStatus.DISPUTED });
  }

  /**
   * Get cancelled billing records
   */
  getCancelledBillingRecords(): Observable<PaginatedResponse<BillingRecord>> {
    return this.getBillingRecords({ status: BillingStatus.CANCELLED });
  }

  /**
   * Get billing records by status
   */
  getBillingRecordsByStatus(status: BillingStatus): Observable<PaginatedResponse<BillingRecord>> {
    return this.getBillingRecords({ status });
  }

  /**
   * Get billing records by currency
   */
  getBillingRecordsByCurrency(currency: string): Observable<PaginatedResponse<BillingRecord>> {
    return this.getBillingRecords({ currency });
  }

  /**
   * Get billing records by cost center
   */
  getBillingRecordsByCostCenter(costCenter: string): Observable<PaginatedResponse<BillingRecord>> {
    return this.getBillingRecords({ costCenter });
  }

  /**
   * Get billing records by service tier
   */
  getBillingRecordsByServiceTier(tierId: number): Observable<PaginatedResponse<BillingRecord>> {
    return this.getBillingRecords({ serviceTier: tierId });
  }

  /**
   * Get billing records for date range
   */
  getBillingRecordsByDateRange(dateFrom: string, dateTo: string): Observable<PaginatedResponse<BillingRecord>> {
    return this.getBillingRecords({ dateFrom, dateTo });
  }

}