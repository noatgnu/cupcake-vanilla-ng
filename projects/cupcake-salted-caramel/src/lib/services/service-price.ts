import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@cupcake/core';

import {
  ServicePrice,
  ServicePriceCreateRequest,
  ServicePriceUpdateRequest,
  ServicePriceCalculationRequest,
  CostBreakdown,
  BillingUnit,
  PaginatedResponse
} from '../models';

export interface ServicePriceQueryParams {
  search?: string;
  isActive?: boolean;
  billingUnit?: BillingUnit;
  currency?: string;
  billableItemType?: number;
  serviceTier?: number;
  limit?: number;
  offset?: number;
  ordering?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ServicePriceService extends BaseApiService {

  /**
   * Get all service prices with optional filtering
   */
  getServicePrices(params?: ServicePriceQueryParams): Observable<PaginatedResponse<ServicePrice>> {
    const httpParams = this.buildHttpParams(params);
    return this.get<PaginatedResponse<ServicePrice>>(`${this.apiUrl}/service-prices/`, { params: httpParams });
  }

  /**
   * Get a single service price by ID
   */
  getServicePrice(id: number): Observable<ServicePrice> {
    return this.get<ServicePrice>(`${this.apiUrl}/service-prices/${id}/`);
  }

  /**
   * Create a new service price
   */
  createServicePrice(price: ServicePriceCreateRequest): Observable<ServicePrice> {
    return this.post<ServicePrice>(`${this.apiUrl}/service-prices/`, price);
  }

  /**
   * Update an existing service price
   */
  updateServicePrice(id: number, price: ServicePriceUpdateRequest): Observable<ServicePrice> {
    return this.put<ServicePrice>(`${this.apiUrl}/service-prices/${id}/`, price);
  }

  /**
   * Partially update a service price
   */
  patchServicePrice(id: number, price: Partial<ServicePriceUpdateRequest>): Observable<ServicePrice> {
    return this.patch<ServicePrice>(`${this.apiUrl}/service-prices/${id}/`, price);
  }

  /**
   * Delete a service price
   */
  deleteServicePrice(id: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/service-prices/${id}/`);
  }

  /**
   * Calculate total cost for a given quantity
   */
  calculateCost(id: number, request: ServicePriceCalculationRequest): Observable<CostBreakdown> {
    return this.post<CostBreakdown>(`${this.apiUrl}/service-prices/${id}/calculate_cost/`, request);
  }

  /**
   * Get current effective prices (Django custom action)
   */
  getCurrentPrices(): Observable<ServicePrice[]> {
    return this.get<ServicePrice[]>(`${this.apiUrl}/service-prices/current_prices/`);
  }

  /**
   * Search service prices by item or tier name
   */
  searchServicePrices(query: string): Observable<PaginatedResponse<ServicePrice>> {
    return this.getServicePrices({ search: query });
  }

  /**
   * Get active service prices only
   */
  getActiveServicePrices(): Observable<PaginatedResponse<ServicePrice>> {
    return this.getServicePrices({ isActive: true });
  }

  /**
   * Get inactive service prices
   */
  getInactiveServicePrices(): Observable<PaginatedResponse<ServicePrice>> {
    return this.getServicePrices({ isActive: false });
  }

  /**
   * Get service prices by billing unit
   */
  getServicePricesByUnit(billingUnit: BillingUnit): Observable<PaginatedResponse<ServicePrice>> {
    return this.getServicePrices({ billingUnit });
  }

  /**
   * Get service prices by currency
   */
  getServicePricesByCurrency(currency: string): Observable<PaginatedResponse<ServicePrice>> {
    return this.getServicePrices({ currency });
  }

  /**
   * Get service prices for a specific billable item type
   */
  getServicePricesForItemType(itemTypeId: number): Observable<PaginatedResponse<ServicePrice>> {
    return this.getServicePrices({ billableItemType: itemTypeId });
  }

  /**
   * Get service prices for a specific service tier
   */
  getServicePricesForTier(tierId: number): Observable<PaginatedResponse<ServicePrice>> {
    return this.getServicePrices({ serviceTier: tierId });
  }

  /**
   * Get hourly service prices
   */
  getHourlyServicePrices(): Observable<PaginatedResponse<ServicePrice>> {
    return this.getServicePrices({ billingUnit: BillingUnit.HOURLY });
  }

  /**
   * Get usage-based service prices
   */
  getUsageServicePrices(): Observable<PaginatedResponse<ServicePrice>> {
    return this.getServicePrices({ billingUnit: BillingUnit.USAGE });
  }

  /**
   * Get flat rate service prices
   */
  getFlatRateServicePrices(): Observable<PaginatedResponse<ServicePrice>> {
    return this.getServicePrices({ billingUnit: BillingUnit.FLAT });
  }

}