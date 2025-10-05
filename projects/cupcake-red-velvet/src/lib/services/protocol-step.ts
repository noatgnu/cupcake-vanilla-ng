import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@noatgnu/cupcake-core';

import {
  ProtocolStep,
  PaginatedResponse
} from '../models';

export interface ProtocolStepQueryParams {
  protocol?: number;
  section?: number;
  order?: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
  limit?: number;
  offset?: number;
  ordering?: string;
}

export interface ProtocolStepCreateRequest {
  protocol: number;
  stepId?: string;
  stepDescription?: string;
  stepSection?: string;
  sectionDescription?: string;
  stepDuration?: number;
  order: number;
  previousStep?: number;
  nextSteps?: number[];
}

export interface ProtocolStepUpdateRequest {
  stepId?: string;
  stepDescription?: string;
  stepSection?: string;
  sectionDescription?: string;
  stepDuration?: number;
  order?: number;
  previousStep?: number;
  nextSteps?: number[];
}

@Injectable({
  providedIn: 'root'
})
export class ProtocolStepService extends BaseApiService {

  /**
   * Get all protocol steps with optional filtering
   */
  getProtocolSteps(params?: ProtocolStepQueryParams): Observable<PaginatedResponse<ProtocolStep>> {
    const httpParams = this.buildHttpParams(params);
    return this.get<PaginatedResponse<ProtocolStep>>(`${this.apiUrl}/protocol-steps/`, { params: httpParams });
  }

  /**
   * Get a single protocol step by ID
   */
  getProtocolStep(id: number): Observable<ProtocolStep> {
    return this.get<ProtocolStep>(`${this.apiUrl}/protocol-steps/${id}/`);
  }

  /**
   * Create a new protocol step
   */
  createProtocolStep(step: ProtocolStepCreateRequest): Observable<ProtocolStep> {
    return this.post<ProtocolStep>(`${this.apiUrl}/protocol-steps/`, step);
  }

  /**
   * Update an existing protocol step
   */
  updateProtocolStep(id: number, step: ProtocolStepUpdateRequest): Observable<ProtocolStep> {
    return this.put<ProtocolStep>(`${this.apiUrl}/protocol-steps/${id}/`, step);
  }

  /**
   * Partially update a protocol step
   */
  patchProtocolStep(id: number, step: Partial<ProtocolStepUpdateRequest>): Observable<ProtocolStep> {
    return this.patch<ProtocolStep>(`${this.apiUrl}/protocol-steps/${id}/`, step);
  }

  /**
   * Delete a protocol step
   */
  deleteProtocolStep(id: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/protocol-steps/${id}/`);
  }

  /**
   * Get steps for a specific protocol
   */
  getStepsByProtocol(protocolId: number): Observable<PaginatedResponse<ProtocolStep>> {
    return this.getProtocolSteps({ protocol: protocolId });
  }

  /**
   * Get steps for a specific section
   */
  getStepsBySection(sectionId: number): Observable<PaginatedResponse<ProtocolStep>> {
    return this.getProtocolSteps({ section: sectionId });
  }
}