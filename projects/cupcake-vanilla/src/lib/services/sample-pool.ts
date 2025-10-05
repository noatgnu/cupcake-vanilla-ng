import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@noatgnu/cupcake-core';

import {
  SamplePool,
  SamplePoolCreateRequest,
  SamplePoolUpdateRequest,
  MetadataColumn,
  PaginatedResponse
} from '../models';

export interface SamplePoolQueryParams {
  search?: string;
  metadataTable?: number;
  isReference?: boolean;
  limit?: number;
  offset?: number;
  ordering?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SamplePoolService extends BaseApiService {

  /**
   * Get all sample pools with optional filtering
   */
  getSamplePools(params?: SamplePoolQueryParams): Observable<PaginatedResponse<SamplePool>> {
    const httpParams = this.buildHttpParams(params);
    return this.get<PaginatedResponse<SamplePool>>(`${this.apiUrl}/sample-pools/`, { params: httpParams });
  }

  /**
   * Get a single sample pool by ID
   */
  getSamplePool(id: number): Observable<SamplePool> {
    return this.get<SamplePool>(`${this.apiUrl}/sample-pools/${id}/`);
  }

  /**
   * Create a new sample pool
   */
  createSamplePool(pool: SamplePoolCreateRequest): Observable<SamplePool> {
    return this.post<SamplePool>(`${this.apiUrl}/sample-pools/`, pool);
  }

  /**
   * Update an existing sample pool
   */
  updateSamplePool(id: number, pool: SamplePoolUpdateRequest): Observable<SamplePool> {
    return this.put<SamplePool>(`${this.apiUrl}/sample-pools/${id}/`, pool);
  }

  /**
   * Partially update a sample pool
   */
  patchSamplePool(id: number, pool: Partial<SamplePoolUpdateRequest>): Observable<SamplePool> {
    return this.patch<SamplePool>(`${this.apiUrl}/sample-pools/${id}/`, pool);
  }

  /**
   * Delete a sample pool
   */
  deleteSamplePool(id: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/sample-pools/${id}/`);
  }

  /**
   * Get metadata columns associated with this pool
   */
  getMetadataColumns(id: number): Observable<MetadataColumn[]> {
    return this.get<MetadataColumn[]>(`${this.apiUrl}/sample-pools/${id}/metadata_columns/`);
  }
}