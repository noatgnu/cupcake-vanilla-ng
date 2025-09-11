import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@cupcake/core';

import {
  ProtocolRating,
  ProtocolRatingRequest,
  PaginatedResponse
} from '../models';

export interface ProtocolRatingQueryParams {
  protocol?: number;
  user?: number;
  complexityRating?: number;
  durationRating?: number;
  limit?: number;
  offset?: number;
  ordering?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProtocolRatingService extends BaseApiService {

  /**
   * Get all protocol ratings with optional filtering
   */
  getProtocolRatings(params?: ProtocolRatingQueryParams): Observable<PaginatedResponse<ProtocolRating>> {
    const httpParams = this.buildHttpParams(params);
    return this.get<PaginatedResponse<ProtocolRating>>(`${this.apiUrl}/protocol-ratings/`, { params: httpParams });
  }

  /**
   * Get a single protocol rating by ID
   */
  getProtocolRating(id: number): Observable<ProtocolRating> {
    return this.get<ProtocolRating>(`${this.apiUrl}/protocol-ratings/${id}/`);
  }

  /**
   * Create a new protocol rating
   */
  createProtocolRating(rating: ProtocolRatingRequest): Observable<ProtocolRating> {
    return this.post<ProtocolRating>(`${this.apiUrl}/protocol-ratings/`, rating);
  }

  /**
   * Update an existing protocol rating
   */
  updateProtocolRating(id: number, rating: ProtocolRatingRequest): Observable<ProtocolRating> {
    return this.put<ProtocolRating>(`${this.apiUrl}/protocol-ratings/${id}/`, rating);
  }

  /**
   * Partially update a protocol rating
   */
  patchProtocolRating(id: number, rating: Partial<ProtocolRatingRequest>): Observable<ProtocolRating> {
    return this.patch<ProtocolRating>(`${this.apiUrl}/protocol-ratings/${id}/`, rating);
  }

  /**
   * Delete a protocol rating
   */
  deleteProtocolRating(id: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/protocol-ratings/${id}/`);
  }

  /**
   * Get ratings for a specific protocol
   */
  getRatingsByProtocol(protocolId: number): Observable<PaginatedResponse<ProtocolRating>> {
    return this.getProtocolRatings({ protocol: protocolId });
  }

  /**
   * Get ratings by a specific user
   */
  getRatingsByUser(userId: number): Observable<PaginatedResponse<ProtocolRating>> {
    return this.getProtocolRatings({ user: userId });
  }

  /**
   * Get ratings by complexity level
   */
  getRatingsByComplexity(complexity: number): Observable<PaginatedResponse<ProtocolRating>> {
    return this.getProtocolRatings({ complexityRating: complexity });
  }

  /**
   * Get ratings by duration level
   */
  getRatingsByDuration(duration: number): Observable<PaginatedResponse<ProtocolRating>> {
    return this.getProtocolRatings({ durationRating: duration });
  }
}