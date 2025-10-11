import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@noatgnu/cupcake-core';

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
    return this.get<PaginatedResponse<ProtocolSection>>(`${this.apiUrl}/sections/`, { params: httpParams });
  }

  getProtocolSection(id: number): Observable<ProtocolSection> {
    return this.get<ProtocolSection>(`${this.apiUrl}/sections/${id}/`);
  }

  createProtocolSection(section: ProtocolSectionCreateRequest): Observable<ProtocolSection> {
    return this.post<ProtocolSection>(`${this.apiUrl}/sections/`, section);
  }

  updateProtocolSection(id: number, section: ProtocolSectionUpdateRequest): Observable<ProtocolSection> {
    return this.put<ProtocolSection>(`${this.apiUrl}/sections/${id}/`, section);
  }

  patchProtocolSection(id: number, section: Partial<ProtocolSectionUpdateRequest>): Observable<ProtocolSection> {
    return this.patch<ProtocolSection>(`${this.apiUrl}/sections/${id}/`, section);
  }

  deleteProtocolSection(id: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/sections/${id}/`);
  }

  /**
   * Get sections for a specific protocol
   */
  getSectionsByProtocol(protocolId: number): Observable<PaginatedResponse<ProtocolSection>> {
    return this.getProtocolSections({ protocol: protocolId });
  }
}