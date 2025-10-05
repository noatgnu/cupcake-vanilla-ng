import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@noatgnu/cupcake-core';

import {
  ServiceTier,
  ServiceTierCreateRequest,
  ServiceTierUpdateRequest,
  PaginatedResponse
} from '../models';

export interface ServiceTierQueryParams {
  search?: string;
  isActive?: boolean;
  priorityLevel?: number;
  limit?: number;
  offset?: number;
  ordering?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ServiceTierService extends BaseApiService {

  /**
   * Get all service tiers with optional filtering
   */
  getServiceTiers(params?: ServiceTierQueryParams): Observable<PaginatedResponse<ServiceTier>> {
    const httpParams = this.buildHttpParams(params);
    return this.get<PaginatedResponse<ServiceTier>>(`${this.apiUrl}/service-tiers/`, { params: httpParams });
  }

  /**
   * Get a single service tier by ID
   */
  getServiceTier(id: number): Observable<ServiceTier> {
    return this.get<ServiceTier>(`${this.apiUrl}/service-tiers/${id}/`);
  }

  /**
   * Create a new service tier
   */
  createServiceTier(tier: ServiceTierCreateRequest): Observable<ServiceTier> {
    return this.post<ServiceTier>(`${this.apiUrl}/service-tiers/`, tier);
  }

  /**
   * Update an existing service tier
   */
  updateServiceTier(id: number, tier: ServiceTierUpdateRequest): Observable<ServiceTier> {
    return this.put<ServiceTier>(`${this.apiUrl}/service-tiers/${id}/`, tier);
  }

  /**
   * Partially update a service tier
   */
  patchServiceTier(id: number, tier: Partial<ServiceTierUpdateRequest>): Observable<ServiceTier> {
    return this.patch<ServiceTier>(`${this.apiUrl}/service-tiers/${id}/`, tier);
  }

  /**
   * Delete a service tier
   */
  deleteServiceTier(id: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/service-tiers/${id}/`);
  }

  /**
   * Calculate price for a given base amount using tier's modifiers
   */
  calculatePrice(id: number, request: { baseAmount: number }): Observable<{ 
    calculatedPrice: number; 
    baseAmount: number; 
    multiplier: number; 
    discount: number 
  }> {
    return this.post<{ 
      calculatedPrice: number; 
      baseAmount: number; 
      multiplier: number; 
      discount: number 
    }>(`${this.apiUrl}/service-tiers/${id}/calculate_price/`, request);
  }

  /**
   * Get active service tiers (Django custom action)
   */
  getActiveTiers(): Observable<ServiceTier[]> {
    return this.get<ServiceTier[]>(`${this.apiUrl}/service-tiers/active_tiers/`);
  }

  /**
   * Search service tiers by name or description
   */
  searchServiceTiers(query: string): Observable<PaginatedResponse<ServiceTier>> {
    return this.getServiceTiers({ search: query });
  }

  /**
   * Get active service tiers only
   */
  getActiveServiceTiers(): Observable<PaginatedResponse<ServiceTier>> {
    return this.getServiceTiers({ isActive: true });
  }

  /**
   * Get inactive service tiers
   */
  getInactiveServiceTiers(): Observable<PaginatedResponse<ServiceTier>> {
    return this.getServiceTiers({ isActive: false });
  }

  /**
   * Get service tiers by priority level
   */
  getServiceTiersByPriority(priorityLevel: number): Observable<PaginatedResponse<ServiceTier>> {
    return this.getServiceTiers({ priorityLevel });
  }

  /**
   * Get service tiers ordered by priority (highest first)
   */
  getServiceTiersByPriorityDesc(): Observable<PaginatedResponse<ServiceTier>> {
    return this.getServiceTiers({ ordering: '-priority_level' });
  }

}