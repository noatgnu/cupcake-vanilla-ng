import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@cupcake/core';

import {
  ProtocolModel,
  ProtocolCreateRequest,
  ProtocolUpdateRequest,
  ProtocolRating,
  ProtocolSection,
  ProtocolStep,
  PaginatedResponse
} from '../models';

export interface ProtocolQueryParams {
  search?: string;
  category?: string;
  creator?: number;
  isPublic?: boolean;
  isTemplate?: boolean;
  labGroup?: number;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
  ordering?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProtocolService extends BaseApiService {

  /**
   * Get all protocols with optional filtering
   */
  getProtocols(params?: ProtocolQueryParams): Observable<PaginatedResponse<ProtocolModel>> {
    const httpParams = this.buildHttpParams(params);
    return this.get<PaginatedResponse<ProtocolModel>>(`${this.apiUrl}/protocols/`, { params: httpParams });
  }

  /**
   * Get a single protocol by ID
   */
  getProtocol(id: number): Observable<ProtocolModel> {
    return this.get<ProtocolModel>(`${this.apiUrl}/protocols/${id}/`);
  }

  /**
   * Create a new protocol
   */
  createProtocol(protocol: ProtocolCreateRequest): Observable<ProtocolModel> {
    return this.post<ProtocolModel>(`${this.apiUrl}/protocols/`, protocol);
  }

  /**
   * Update an existing protocol
   */
  updateProtocol(id: number, protocol: ProtocolUpdateRequest): Observable<ProtocolModel> {
    return this.put<ProtocolModel>(`${this.apiUrl}/protocols/${id}/`, protocol);
  }

  /**
   * Partially update a protocol
   */
  patchProtocol(id: number, protocol: Partial<ProtocolUpdateRequest>): Observable<ProtocolModel> {
    return this.patch<ProtocolModel>(`${this.apiUrl}/protocols/${id}/`, protocol);
  }

  /**
   * Delete a protocol
   */
  deleteProtocol(id: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/protocols/${id}/`);
  }

  /**
   * Get protocol sections
   */
  getProtocolSections(protocolId: number): Observable<ProtocolSection[]> {
    return this.get<ProtocolSection[]>(`${this.apiUrl}/protocols/${protocolId}/sections/`);
  }

  /**
   * Get protocol steps
   */
  getProtocolSteps(protocolId: number): Observable<ProtocolStep[]> {
    return this.get<ProtocolStep[]>(`${this.apiUrl}/protocols/${protocolId}/steps/`);
  }

  /**
   * Get protocol ratings
   */
  getProtocolRatings(protocolId: number): Observable<ProtocolRating[]> {
    return this.get<ProtocolRating[]>(`${this.apiUrl}/protocols/${protocolId}/ratings/`);
  }

  /**
   * Search protocols by name or description
   */
  searchProtocols(query: string): Observable<PaginatedResponse<Protocol>> {
    return this.getProtocols({ search: query });
  }

  /**
   * Get protocols by category
   */
  getProtocolsByCategory(category: string): Observable<PaginatedResponse<Protocol>> {
    return this.getProtocols({ category });
  }

  /**
   * Get protocols by creator
   */
  getProtocolsByCreator(creatorId: number): Observable<PaginatedResponse<Protocol>> {
    return this.getProtocols({ creator: creatorId });
  }

  /**
   * Get public protocols
   */
  getPublicProtocols(): Observable<PaginatedResponse<Protocol>> {
    return this.getProtocols({ isPublic: true });
  }

  /**
   * Get protocol templates
   */
  getProtocolTemplates(): Observable<PaginatedResponse<Protocol>> {
    return this.getProtocols({ isTemplate: true });
  }

  /**
   * Get protocols by lab group
   */
  getProtocolsByLabGroup(labGroupId: number): Observable<PaginatedResponse<Protocol>> {
    return this.getProtocols({ labGroup: labGroupId });
  }
}