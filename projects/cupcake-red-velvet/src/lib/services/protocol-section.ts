import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@cupcake/core';

import {
  ProtocolSection,
  PaginatedResponse
} from '../models';

export interface ProtocolSectionQueryParams {
  protocol?: number;
  order?: number;
  limit?: number;
  offset?: number;
  ordering?: string;
}

export interface ProtocolSectionCreateRequest {
  protocol: number;
  sectionDescription?: string;
  sectionDuration?: number;
  order: number;
}

export interface ProtocolSectionUpdateRequest {
  sectionDescription?: string;
  sectionDuration?: number;
  order?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProtocolSectionService extends BaseApiService {

  /**
   * Get all protocol sections with optional filtering
   */
  getProtocolSections(params?: ProtocolSectionQueryParams): Observable<PaginatedResponse<ProtocolSection>> {
    const httpParams = this.buildHttpParams(params);
    return this.get<PaginatedResponse<ProtocolSection>>(`${this.apiUrl}/protocol-sections/`, { params: httpParams });
  }

  /**
   * Get a single protocol section by ID
   */
  getProtocolSection(id: number): Observable<ProtocolSection> {
    return this.get<ProtocolSection>(`${this.apiUrl}/protocol-sections/${id}/`);
  }

  /**
   * Create a new protocol section
   */
  createProtocolSection(section: ProtocolSectionCreateRequest): Observable<ProtocolSection> {
    return this.post<ProtocolSection>(`${this.apiUrl}/protocol-sections/`, section);
  }

  /**
   * Update an existing protocol section
   */
  updateProtocolSection(id: number, section: ProtocolSectionUpdateRequest): Observable<ProtocolSection> {
    return this.put<ProtocolSection>(`${this.apiUrl}/protocol-sections/${id}/`, section);
  }

  /**
   * Partially update a protocol section
   */
  patchProtocolSection(id: number, section: Partial<ProtocolSectionUpdateRequest>): Observable<ProtocolSection> {
    return this.patch<ProtocolSection>(`${this.apiUrl}/protocol-sections/${id}/`, section);
  }

  /**
   * Delete a protocol section
   */
  deleteProtocolSection(id: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/protocol-sections/${id}/`);
  }

  /**
   * Get sections for a specific protocol
   */
  getSectionsByProtocol(protocolId: number): Observable<PaginatedResponse<ProtocolSection>> {
    return this.getProtocolSections({ protocol: protocolId });
  }
}