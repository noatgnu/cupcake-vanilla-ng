import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@noatgnu/cupcake-core';

import {
  BillableItemType,
  BillableItemTypeCreateRequest,
  BillableItemTypeUpdateRequest,
  BillingUnit,
  PaginatedResponse
} from '../models';

export interface BillableItemTypeQueryParams {
  search?: string;
  isActive?: boolean;
  requiresApproval?: boolean;
  defaultBillingUnit?: BillingUnit;
  limit?: number;
  offset?: number;
  ordering?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BillableItemTypeService extends BaseApiService {

  /**
   * Get all billable item types with optional filtering
   */
  getBillableItemTypes(params?: BillableItemTypeQueryParams): Observable<PaginatedResponse<BillableItemType>> {
    const httpParams = this.buildHttpParams(params);
    return this.get<PaginatedResponse<BillableItemType>>(`${this.apiUrl}/billable-item-types/`, { params: httpParams });
  }

  /**
   * Get a single billable item type by ID
   */
  getBillableItemType(id: number): Observable<BillableItemType> {
    return this.get<BillableItemType>(`${this.apiUrl}/billable-item-types/${id}/`);
  }

  /**
   * Create a new billable item type
   */
  createBillableItemType(itemType: BillableItemTypeCreateRequest): Observable<BillableItemType> {
    return this.post<BillableItemType>(`${this.apiUrl}/billable-item-types/`, itemType);
  }

  /**
   * Update an existing billable item type
   */
  updateBillableItemType(id: number, itemType: BillableItemTypeUpdateRequest): Observable<BillableItemType> {
    return this.put<BillableItemType>(`${this.apiUrl}/billable-item-types/${id}/`, itemType);
  }

  /**
   * Partially update a billable item type
   */
  patchBillableItemType(id: number, itemType: Partial<BillableItemTypeUpdateRequest>): Observable<BillableItemType> {
    return this.patch<BillableItemType>(`${this.apiUrl}/billable-item-types/${id}/`, itemType);
  }

  /**
   * Delete a billable item type
   */
  deleteBillableItemType(id: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/billable-item-types/${id}/`);
  }

  /**
   * Get billable item types grouped by content type (Django custom action)
   */
  getByContentType(appLabel?: string, model?: string): Observable<PaginatedResponse<BillableItemType>> {
    const params = this.buildHttpParams({ appLabel, model });
    return this.get<PaginatedResponse<BillableItemType>>(`${this.apiUrl}/billable-item-types/by_content_type/`, { params });
  }

  /**
   * Search billable item types by name or description
   */
  searchBillableItemTypes(query: string): Observable<PaginatedResponse<BillableItemType>> {
    return this.getBillableItemTypes({ search: query });
  }

  /**
   * Get active billable item types only
   */
  getActiveBillableItemTypes(): Observable<PaginatedResponse<BillableItemType>> {
    return this.getBillableItemTypes({ isActive: true });
  }

  /**
   * Get inactive billable item types
   */
  getInactiveBillableItemTypes(): Observable<PaginatedResponse<BillableItemType>> {
    return this.getBillableItemTypes({ isActive: false });
  }

  /**
   * Get billable item types that require approval
   */
  getApprovalRequiredItemTypes(): Observable<PaginatedResponse<BillableItemType>> {
    return this.getBillableItemTypes({ requiresApproval: true });
  }

  /**
   * Get billable item types that don't require approval
   */
  getAutoApprovedItemTypes(): Observable<PaginatedResponse<BillableItemType>> {
    return this.getBillableItemTypes({ requiresApproval: false });
  }

  /**
   * Get billable item types by billing unit
   */
  getBillableItemTypesByUnit(billingUnit: BillingUnit): Observable<PaginatedResponse<BillableItemType>> {
    return this.getBillableItemTypes({ defaultBillingUnit: billingUnit });
  }

  /**
   * Get hourly billing item types
   */
  getHourlyBillingItemTypes(): Observable<PaginatedResponse<BillableItemType>> {
    return this.getBillableItemTypes({ defaultBillingUnit: BillingUnit.HOURLY });
  }

  /**
   * Get usage-based billing item types
   */
  getUsageBillingItemTypes(): Observable<PaginatedResponse<BillableItemType>> {
    return this.getBillableItemTypes({ defaultBillingUnit: BillingUnit.USAGE });
  }

  /**
   * Get flat rate billing item types
   */
  getFlatRateBillingItemTypes(): Observable<PaginatedResponse<BillableItemType>> {
    return this.getBillableItemTypes({ defaultBillingUnit: BillingUnit.FLAT });
  }

}