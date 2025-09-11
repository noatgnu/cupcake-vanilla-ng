import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@cupcake/core';

import {
  StepVariation,
  PaginatedResponse
} from '../models';

export interface StepVariationQueryParams {
  step?: number;
  minDuration?: number;
  maxDuration?: number;
  limit?: number;
  offset?: number;
  ordering?: string;
}

export interface StepVariationCreateRequest {
  step: number;
  stepDescription?: string;
  variationDescription?: string;
  variationDuration?: number;
}

export interface StepVariationUpdateRequest {
  stepDescription?: string;
  variationDescription?: string;
  variationDuration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class StepVariationService extends BaseApiService {

  /**
   * Get all step variations with optional filtering
   */
  getStepVariations(params?: StepVariationQueryParams): Observable<PaginatedResponse<StepVariation>> {
    const httpParams = this.buildHttpParams(params);
    return this.get<PaginatedResponse<StepVariation>>(`${this.apiUrl}/step-variations/`, { params: httpParams });
  }

  /**
   * Get a single step variation by ID
   */
  getStepVariation(id: number): Observable<StepVariation> {
    return this.get<StepVariation>(`${this.apiUrl}/step-variations/${id}/`);
  }

  /**
   * Create a new step variation
   */
  createStepVariation(variation: StepVariationCreateRequest): Observable<StepVariation> {
    return this.post<StepVariation>(`${this.apiUrl}/step-variations/`, variation);
  }

  /**
   * Update an existing step variation
   */
  updateStepVariation(id: number, variation: StepVariationUpdateRequest): Observable<StepVariation> {
    return this.put<StepVariation>(`${this.apiUrl}/step-variations/${id}/`, variation);
  }

  /**
   * Partially update a step variation
   */
  patchStepVariation(id: number, variation: Partial<StepVariationUpdateRequest>): Observable<StepVariation> {
    return this.patch<StepVariation>(`${this.apiUrl}/step-variations/${id}/`, variation);
  }

  /**
   * Delete a step variation
   */
  deleteStepVariation(id: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/step-variations/${id}/`);
  }

  /**
   * Get variations sorted by duration with optional filtering
   */
  getVariationsByDuration(params?: { minDuration?: number; maxDuration?: number }): Observable<PaginatedResponse<StepVariation>> {
    const httpParams = this.buildHttpParams(params);
    return this.get<PaginatedResponse<StepVariation>>(`${this.apiUrl}/step-variations/by_duration/`, { params: httpParams });
  }

  /**
   * Get variations for a specific step
   */
  getVariationsByStep(stepId: number): Observable<PaginatedResponse<StepVariation>> {
    return this.getStepVariations({ step: stepId });
  }
}