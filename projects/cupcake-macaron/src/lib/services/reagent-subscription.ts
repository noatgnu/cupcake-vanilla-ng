import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@noatgnu/cupcake-core';

import {
  ReagentSubscription,
  ReagentSubscriptionCreateRequest,
  ReagentSubscriptionUpdateRequest,
  PaginatedResponse
} from '../models';

export interface ReagentSubscriptionQueryParams {
  search?: string;
  storedReagent?: number;
  user?: number;
  notifyOnLowStock?: boolean;
  notifyOnExpiry?: boolean;
  limit?: number;
  offset?: number;
  ordering?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReagentSubscriptionService extends BaseApiService {

  /**
   * Get all reagent subscriptions with optional filtering
   */
  getReagentSubscriptions(params?: ReagentSubscriptionQueryParams): Observable<PaginatedResponse<ReagentSubscription>> {
    const httpParams = this.buildHttpParams(params);
    return this.get<PaginatedResponse<ReagentSubscription>>(`${this.apiUrl}/reagent-subscriptions/`, { params: httpParams });
  }

  /**
   * Get a single reagent subscription by ID
   */
  getReagentSubscription(id: number): Observable<ReagentSubscription> {
    return this.get<ReagentSubscription>(`${this.apiUrl}/reagent-subscriptions/${id}/`);
  }

  /**
   * Create a new reagent subscription
   */
  createReagentSubscription(subscription: ReagentSubscriptionCreateRequest): Observable<ReagentSubscription> {
    return this.post<ReagentSubscription>(`${this.apiUrl}/reagent-subscriptions/`, subscription);
  }

  /**
   * Update an existing reagent subscription
   */
  updateReagentSubscription(id: number, subscription: ReagentSubscriptionUpdateRequest): Observable<ReagentSubscription> {
    return this.put<ReagentSubscription>(`${this.apiUrl}/reagent-subscriptions/${id}/`, subscription);
  }

  /**
   * Partially update a reagent subscription
   */
  patchReagentSubscription(id: number, subscription: Partial<ReagentSubscriptionUpdateRequest>): Observable<ReagentSubscription> {
    return this.patch<ReagentSubscription>(`${this.apiUrl}/reagent-subscriptions/${id}/`, subscription);
  }

  /**
   * Delete a reagent subscription
   */
  deleteReagentSubscription(id: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/reagent-subscriptions/${id}/`);
  }

  /**
   * Get current user's reagent subscriptions
   */
  getMySubscriptions(): Observable<ReagentSubscription[]> {
    return this.get<ReagentSubscription[]>(`${this.apiUrl}/reagent-subscriptions/my_subscriptions/`);
  }

  /**
   * Get subscriptions for a specific stored reagent
   */
  getSubscriptionsForReagent(storedReagentId: number): Observable<PaginatedResponse<ReagentSubscription>> {
    return this.getReagentSubscriptions({ storedReagent: storedReagentId });
  }

  /**
   * Get subscriptions for a specific user
   */
  getUserSubscriptions(userId: number): Observable<PaginatedResponse<ReagentSubscription>> {
    return this.getReagentSubscriptions({ user: userId });
  }

  /**
   * Get low stock notification subscriptions
   */
  getLowStockSubscriptions(): Observable<PaginatedResponse<ReagentSubscription>> {
    return this.getReagentSubscriptions({ notifyOnLowStock: true });
  }

  /**
   * Get expiry notification subscriptions
   */
  getExpirySubscriptions(): Observable<PaginatedResponse<ReagentSubscription>> {
    return this.getReagentSubscriptions({ notifyOnExpiry: true });
  }

  /**
   * Search reagent subscriptions
   */
  searchReagentSubscriptions(query: string): Observable<PaginatedResponse<ReagentSubscription>> {
    return this.getReagentSubscriptions({ search: query });
  }
}