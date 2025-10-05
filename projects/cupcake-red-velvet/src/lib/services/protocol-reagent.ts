import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@noatgnu/cupcake-core';

import {
  ProtocolReagent,
  PaginatedResponse
} from '../models';

export interface ProtocolReagentQueryParams {
  protocol?: number;
  reagent?: number;
  limit?: number;
  offset?: number;
  ordering?: string;
}

export interface ProtocolReagentCreateRequest {
  protocol: number;
  reagent: number;
  quantity: number;
}

export interface ProtocolReagentUpdateRequest {
  protocol?: number;
  reagent?: number;
  quantity?: number;
}

export interface BulkAddReagentsRequest {
  protocolId: number;
  reagents: Array<{
    reagentId: number;
    quantity: number;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class ProtocolReagentService extends BaseApiService {

  /**
   * Get all protocol reagents with optional filtering
   */
  getProtocolReagents(params?: ProtocolReagentQueryParams): Observable<PaginatedResponse<ProtocolReagent>> {
    const httpParams = this.buildHttpParams(params);
    return this.get<PaginatedResponse<ProtocolReagent>>(`${this.apiUrl}/protocol-reagents/`, { params: httpParams });
  }

  /**
   * Get a single protocol reagent by ID
   */
  getProtocolReagent(id: number): Observable<ProtocolReagent> {
    return this.get<ProtocolReagent>(`${this.apiUrl}/protocol-reagents/${id}/`);
  }

  /**
   * Create a new protocol reagent
   */
  createProtocolReagent(reagent: ProtocolReagentCreateRequest): Observable<ProtocolReagent> {
    return this.post<ProtocolReagent>(`${this.apiUrl}/protocol-reagents/`, reagent);
  }

  /**
   * Update an existing protocol reagent
   */
  updateProtocolReagent(id: number, reagent: ProtocolReagentUpdateRequest): Observable<ProtocolReagent> {
    return this.put<ProtocolReagent>(`${this.apiUrl}/protocol-reagents/${id}/`, reagent);
  }

  /**
   * Partially update a protocol reagent
   */
  patchProtocolReagent(id: number, reagent: Partial<ProtocolReagentUpdateRequest>): Observable<ProtocolReagent> {
    return this.patch<ProtocolReagent>(`${this.apiUrl}/protocol-reagents/${id}/`, reagent);
  }

  /**
   * Delete a protocol reagent
   */
  deleteProtocolReagent(id: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/protocol-reagents/${id}/`);
  }

  /**
   * Add multiple reagents to a protocol at once
   */
  bulkAddReagents(request: BulkAddReagentsRequest): Observable<ProtocolReagent[]> {
    return this.post<ProtocolReagent[]>(`${this.apiUrl}/protocol-reagents/bulk_add_reagents/`, request);
  }

  /**
   * Get reagents for a specific protocol
   */
  getReagentsByProtocol(protocolId: number): Observable<PaginatedResponse<ProtocolReagent>> {
    return this.getProtocolReagents({ protocol: protocolId });
  }

  /**
   * Get protocols using a specific reagent
   */
  getProtocolsByReagent(reagentId: number): Observable<PaginatedResponse<ProtocolReagent>> {
    return this.getProtocolReagents({ reagent: reagentId });
  }
}