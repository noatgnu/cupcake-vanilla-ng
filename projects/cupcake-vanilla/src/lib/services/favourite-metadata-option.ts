import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@cupcake/core';

import {
  FavouriteMetadataOption,
  FavouriteMetadataOptionCreateRequest,
  FavouriteMetadataOptionUpdateRequest,
  PaginatedResponse
} from '../models';

export interface FavouriteMetadataOptionQueryParams {
  search?: string;
  name?: string;
  type?: string;
  userId?: number;
  labGroupId?: number;
  isGlobal?: boolean;
  limit?: number;
  offset?: number;
  ordering?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FavouriteMetadataOptionService extends BaseApiService {

  /**
   * Get all favourite metadata options with optional filtering
   */
  getFavouriteMetadataOptions(params?: FavouriteMetadataOptionQueryParams): Observable<PaginatedResponse<FavouriteMetadataOption>> {
    const httpParams = this.buildHttpParams(params);
    return this.get<PaginatedResponse<FavouriteMetadataOption>>(`${this.apiUrl}/favourite-options/`, { params: httpParams });
  }

  /**
   * Get a single favourite metadata option by ID
   */
  getFavouriteMetadataOption(id: number): Observable<FavouriteMetadataOption> {
    return this.get<FavouriteMetadataOption>(`${this.apiUrl}/favourite-options/${id}/`);
  }

  /**
   * Create a new favourite metadata option
   */
  createFavouriteMetadataOption(option: FavouriteMetadataOptionCreateRequest): Observable<FavouriteMetadataOption> {
    return this.post<FavouriteMetadataOption>(`${this.apiUrl}/favourite-options/`, option);
  }

  /**
   * Update an existing favourite metadata option
   */
  updateFavouriteMetadataOption(id: number, option: FavouriteMetadataOptionUpdateRequest): Observable<FavouriteMetadataOption> {
    return this.put<FavouriteMetadataOption>(`${this.apiUrl}/favourite-options/${id}/`, option);
  }

  /**
   * Partially update a favourite metadata option
   */
  patchFavouriteMetadataOption(id: number, option: Partial<FavouriteMetadataOptionUpdateRequest>): Observable<FavouriteMetadataOption> {
    return this.patch<FavouriteMetadataOption>(`${this.apiUrl}/favourite-options/${id}/`, option);
  }

  /**
   * Delete a favourite metadata option
   */
  deleteFavouriteMetadataOption(id: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/favourite-options/${id}/`);
  }
}