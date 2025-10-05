import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@noatgnu/cupcake-core';

import {
  StepReagent,
  PaginatedResponse
} from '../models';

export interface StepReagentQueryParams {
  step?: number;
  reagent?: number;
  scalable?: boolean;
  limit?: number;
  offset?: number;
  ordering?: string;
}

export interface StepReagentCreateRequest {
  step: number;
  reagent: number;
  quantity: number;
  scalable?: boolean;
  scalableFactor?: number;
}

export interface StepReagentUpdateRequest {
  step?: number;
  reagent?: number;
  quantity?: number;
  scalable?: boolean;
  scalableFactor?: number;
}

export interface UpdateScalingRequest {
  scalableFactor: number;
}

@Injectable({
  providedIn: 'root'
})
export class StepReagentService extends BaseApiService {

  /**
   * Get all step reagents with optional filtering
   */
  getStepReagents(params?: StepReagentQueryParams): Observable<PaginatedResponse<StepReagent>> {
    const httpParams = this.buildHttpParams(params);
    return this.get<PaginatedResponse<StepReagent>>(`${this.apiUrl}/step-reagents/`, { params: httpParams });
  }

  /**
   * Get a single step reagent by ID
   */
  getStepReagent(id: number): Observable<StepReagent> {
    return this.get<StepReagent>(`${this.apiUrl}/step-reagents/${id}/`);
  }

  /**
   * Create a new step reagent
   */
  createStepReagent(reagent: StepReagentCreateRequest): Observable<StepReagent> {
    return this.post<StepReagent>(`${this.apiUrl}/step-reagents/`, reagent);
  }

  /**
   * Update an existing step reagent
   */
  updateStepReagent(id: number, reagent: StepReagentUpdateRequest): Observable<StepReagent> {
    return this.put<StepReagent>(`${this.apiUrl}/step-reagents/${id}/`, reagent);
  }

  /**
   * Partially update a step reagent
   */
  patchStepReagent(id: number, reagent: Partial<StepReagentUpdateRequest>): Observable<StepReagent> {
    return this.patch<StepReagent>(`${this.apiUrl}/step-reagents/${id}/`, reagent);
  }

  /**
   * Delete a step reagent
   */
  deleteStepReagent(id: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/step-reagents/${id}/`);
  }

  /**
   * Update scaling factor for a step reagent
   */
  updateScaling(id: number, request: UpdateScalingRequest): Observable<{ message: string; reagent: StepReagent }> {
    return this.post<{ message: string; reagent: StepReagent }>(`${this.apiUrl}/step-reagents/${id}/update_scaling/`, request);
  }

  /**
   * Get reagents for a specific step
   */
  getReagentsByStep(stepId: number): Observable<PaginatedResponse<StepReagent>> {
    return this.getStepReagents({ step: stepId });
  }

  /**
   * Get steps using a specific reagent
   */
  getStepsByReagent(reagentId: number): Observable<PaginatedResponse<StepReagent>> {
    return this.getStepReagents({ reagent: reagentId });
  }

  /**
   * Get scalable reagents only
   */
  getScalableReagents(): Observable<PaginatedResponse<StepReagent>> {
    return this.getStepReagents({ scalable: true });
  }
}