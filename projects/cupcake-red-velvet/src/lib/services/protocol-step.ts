import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@noatgnu/cupcake-core';

import {
  ProtocolStep,
  PaginatedResponse
} from '../models';

export interface ProtocolStepQueryParams {
  protocol?: number;
  stepSection?: number;
  order?: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
  limit?: number;
  offset?: number;
  ordering?: string;
}

export interface ProtocolStepCreateRequest {
  protocol: number;
  stepId?: number;
  stepDescription?: string;
  stepSection?: number;
  stepDuration?: number;
  order: number;
  previousStep?: number;
  original?: boolean;
  branchFrom?: number;
  remoteId?: number;
  remoteHost?: number;
}

export interface ProtocolStepUpdateRequest {
  stepId?: number;
  stepDescription?: string;
  stepSection?: number;
  stepDuration?: number;
  order?: number;
  previousStep?: number;
  original?: boolean;
  branchFrom?: number;
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
    return this.get<PaginatedResponse<ProtocolStep>>(`${this.apiUrl}/steps/`, { params: httpParams });
  }

  getProtocolStep(id: number): Observable<ProtocolStep> {
    return this.get<ProtocolStep>(`${this.apiUrl}/steps/${id}/`);
  }

  createProtocolStep(step: ProtocolStepCreateRequest): Observable<ProtocolStep> {
    return this.post<ProtocolStep>(`${this.apiUrl}/steps/`, step);
  }

  updateProtocolStep(id: number, step: ProtocolStepUpdateRequest): Observable<ProtocolStep> {
    return this.put<ProtocolStep>(`${this.apiUrl}/steps/${id}/`, step);
  }

  patchProtocolStep(id: number, step: Partial<ProtocolStepUpdateRequest>): Observable<ProtocolStep> {
    return this.patch<ProtocolStep>(`${this.apiUrl}/steps/${id}/`, step);
  }

  deleteProtocolStep(id: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/steps/${id}/`);
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
    return this.getProtocolSteps({ stepSection: sectionId });
  }
}