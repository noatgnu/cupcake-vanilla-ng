import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@noatgnu/cupcake-core';

import {
  ReagentAction,
  ReagentActionCreateRequest,
  ReagentActionUpdateRequest,
  ActionType,
  PaginatedResponse
} from '../models';

export interface ReagentActionQueryParams {
  search?: string;
  reagent?: number;
  user?: number;
  actionType?: ActionType;
  limit?: number;
  offset?: number;
  ordering?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReagentActionService extends BaseApiService {

  /**
   * Get all reagent actions with optional filtering
   */
  getReagentActions(params?: ReagentActionQueryParams): Observable<PaginatedResponse<ReagentAction>> {
    const httpParams = this.buildHttpParams(params);
    return this.get<PaginatedResponse<ReagentAction>>(`${this.apiUrl}/reagent-actions/`, { params: httpParams });
  }

  /**
   * Get a single reagent action by ID
   */
  getReagentAction(id: number): Observable<ReagentAction> {
    return this.get<ReagentAction>(`${this.apiUrl}/reagent-actions/${id}/`);
  }

  /**
   * Create a new reagent action
   */
  createReagentAction(action: ReagentActionCreateRequest): Observable<ReagentAction> {
    return this.post<ReagentAction>(`${this.apiUrl}/reagent-actions/`, action);
  }

  /**
   * Update an existing reagent action
   */
  updateReagentAction(id: number, action: ReagentActionUpdateRequest): Observable<ReagentAction> {
    return this.put<ReagentAction>(`${this.apiUrl}/reagent-actions/${id}/`, action);
  }

  /**
   * Partially update a reagent action
   */
  patchReagentAction(id: number, action: Partial<ReagentActionUpdateRequest>): Observable<ReagentAction> {
    return this.patch<ReagentAction>(`${this.apiUrl}/reagent-actions/${id}/`, action);
  }

  /**
   * Delete a reagent action
   */
  deleteReagentAction(id: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/reagent-actions/${id}/`);
  }

  /**
   * Get current user's reagent actions
   */
  getMyActions(): Observable<PaginatedResponse<ReagentAction>> {
    return this.get<PaginatedResponse<ReagentAction>>(`${this.apiUrl}/reagent-actions/my_actions/`);
  }

  /**
   * Get actions for a specific stored reagent
   */
  getActionsForReagent(reagentId: number): Observable<PaginatedResponse<ReagentAction>> {
    return this.getReagentActions({ reagent: reagentId });
  }

  /**
   * Get actions for a specific user
   */
  getUserActions(userId: number): Observable<PaginatedResponse<ReagentAction>> {
    return this.getReagentActions({ user: userId });
  }

  /**
   * Get actions by type
   */
  getActionsByType(actionType: ActionType): Observable<PaginatedResponse<ReagentAction>> {
    return this.getReagentActions({ actionType });
  }

  /**
   * Search reagent actions
   */
  searchReagentActions(query: string): Observable<PaginatedResponse<ReagentAction>> {
    return this.getReagentActions({ search: query });
  }
}