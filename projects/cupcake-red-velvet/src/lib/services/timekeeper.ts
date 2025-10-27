import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@noatgnu/cupcake-core';

import {
  TimeKeeper,
  TimeKeeperCreateRequest,
  TimeKeeperUpdateRequest,
  PaginatedResponse
} from '../models';

export interface TimeKeeperQueryParams {
  search?: string;
  session?: number;
  user?: number;
  status?: string;
  startTimeFrom?: string;
  startTimeTo?: string;
  limit?: number;
  offset?: number;
  ordering?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TimeKeeperService extends BaseApiService {

  /**
   * Get all timekeeper records with optional filtering
   */
  getTimeKeepers(params?: TimeKeeperQueryParams): Observable<PaginatedResponse<TimeKeeper>> {
    const httpParams = this.buildHttpParams(params);
    return this.get<PaginatedResponse<TimeKeeper>>(`${this.apiUrl}/time-keepers/`, { params: httpParams });
  }

  /**
   * Get a single timekeeper record by ID
   */
  getTimeKeeper(id: number): Observable<TimeKeeper> {
    return this.get<TimeKeeper>(`${this.apiUrl}/time-keepers/${id}/`);
  }

  /**
   * Create a new timekeeper record
   */
  createTimeKeeper(timekeeper: TimeKeeperCreateRequest): Observable<TimeKeeper> {
    return this.post<TimeKeeper>(`${this.apiUrl}/time-keepers/`, timekeeper);
  }

  /**
   * Update an existing timekeeper record
   */
  updateTimeKeeper(id: number, timekeeper: TimeKeeperUpdateRequest): Observable<TimeKeeper> {
    return this.put<TimeKeeper>(`${this.apiUrl}/time-keepers/${id}/`, timekeeper);
  }

  /**
   * Partially update a timekeeper record
   */
  patchTimeKeeper(id: number, timekeeper: Partial<TimeKeeperUpdateRequest>): Observable<TimeKeeper> {
    return this.patch<TimeKeeper>(`${this.apiUrl}/time-keepers/${id}/`, timekeeper);
  }

  /**
   * Delete a timekeeper record
   */
  deleteTimeKeeper(id: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/time-keepers/${id}/`);
  }

  /**
   * Start a timer
   */
  startTimer(id: number): Observable<{ message: string; timeKeeper: TimeKeeper }> {
    return this.post<{ message: string; timeKeeper: TimeKeeper }>(`${this.apiUrl}/time-keepers/${id}/start_timer/`, {});
  }

  /**
   * Stop a timer
   */
  stopTimer(id: number): Observable<{ message: string; currentDuration: number; timeKeeper: TimeKeeper }> {
    return this.post<{ message: string; currentDuration: number; timeKeeper: TimeKeeper }>(`${this.apiUrl}/time-keepers/${id}/stop_timer/`, {});
  }

  /**
   * Reset a timer to its original duration
   */
  resetTimer(id: number): Observable<{ message: string; currentDuration: number; timeKeeper: TimeKeeper }> {
    return this.post<{ message: string; currentDuration: number; timeKeeper: TimeKeeper }>(`${this.apiUrl}/time-keepers/${id}/reset/`, {});
  }

  /**
   * Get all active timers for current user
   */
  getActiveTimers(): Observable<TimeKeeper[]> {
    return this.get<TimeKeeper[]>(`${this.apiUrl}/time-keepers/active_timers/`);
  }

  /**
   * Search timekeeper records
   */
  searchTimeKeepers(query: string): Observable<PaginatedResponse<TimeKeeper>> {
    return this.getTimeKeepers({ search: query });
  }

  /**
   * Get timekeeper records by session
   */
  getTimeKeepersBySession(sessionId: number): Observable<PaginatedResponse<TimeKeeper>> {
    return this.getTimeKeepers({ session: sessionId });
  }

  /**
   * Get timekeeper records by user
   */
  getTimeKeepersByUser(userId: number): Observable<PaginatedResponse<TimeKeeper>> {
    return this.getTimeKeepers({ user: userId });
  }

  /**
   * Get timekeeper records by status
   */
  getTimeKeepersByStatus(status: string): Observable<PaginatedResponse<TimeKeeper>> {
    return this.getTimeKeepers({ status });
  }

  /**
   * Get timekeeper records within time range
   */
  getTimeKeepersByTimeRange(startTimeFrom: string, startTimeTo: string): Observable<PaginatedResponse<TimeKeeper>> {
    return this.getTimeKeepers({ startTimeFrom, startTimeTo });
  }
}
