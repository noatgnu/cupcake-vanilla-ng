import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@noatgnu/cupcake-core';

import {
  MaintenanceLog,
  MaintenanceLogCreateRequest,
  MaintenanceLogUpdateRequest,
  PaginatedResponse,
  MaintenanceType,
  Status
} from '../models';

export interface MaintenanceQueryParams {
  search?: string;
  instrument?: number;
  maintenanceType?: MaintenanceType;
  status?: Status;
  createdBy?: number;
  isTemplate?: boolean;
  maintenanceDateAfter?: string;
  maintenanceDateBefore?: string;
  limit?: number;
  offset?: number;
  ordering?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MaintenanceService extends BaseApiService {

  /**
   * Get all maintenance logs with optional filtering
   */
  getMaintenanceLogs(params?: MaintenanceQueryParams): Observable<PaginatedResponse<MaintenanceLog>> {
    const httpParams = this.buildHttpParams(params);
    return this.get<PaginatedResponse<MaintenanceLog>>(`${this.apiUrl}/maintenance-logs/`, { params: httpParams });
  }

  /**
   * Get a single maintenance log by ID
   */
  getMaintenanceLog(id: number): Observable<MaintenanceLog> {
    return this.get<MaintenanceLog>(`${this.apiUrl}/maintenance-logs/${id}/`);
  }

  /**
   * Create a new maintenance log
   */
  createMaintenanceLog(maintenanceLog: MaintenanceLogCreateRequest): Observable<MaintenanceLog> {
    return this.post<MaintenanceLog>(`${this.apiUrl}/maintenance-logs/`, maintenanceLog);
  }

  /**
   * Update an existing maintenance log
   */
  updateMaintenanceLog(id: number, maintenanceLog: MaintenanceLogUpdateRequest): Observable<MaintenanceLog> {
    return this.put<MaintenanceLog>(`${this.apiUrl}/maintenance-logs/${id}/`, maintenanceLog);
  }

  /**
   * Partially update a maintenance log
   */
  patchMaintenanceLog(id: number, maintenanceLog: Partial<MaintenanceLogUpdateRequest>): Observable<MaintenanceLog> {
    return this.patch<MaintenanceLog>(`${this.apiUrl}/maintenance-logs/${id}/`, maintenanceLog);
  }

  /**
   * Delete a maintenance log
   */
  deleteMaintenanceLog(id: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/maintenance-logs/${id}/`);
  }

  /**
   * Get maintenance logs for a specific instrument
   */
  getInstrumentMaintenanceLogs(instrumentId: number): Observable<PaginatedResponse<MaintenanceLog>> {
    return this.getMaintenanceLogs({ instrument: instrumentId });
  }

  /**
   * Get maintenance log templates
   */
  getMaintenanceTemplates(): Observable<PaginatedResponse<MaintenanceLog>> {
    return this.getMaintenanceLogs({ isTemplate: true });
  }

  /**
   * Get maintenance logs by status
   */
  getMaintenanceLogsByStatus(status: Status): Observable<PaginatedResponse<MaintenanceLog>> {
    return this.getMaintenanceLogs({ status });
  }

  /**
   * Get maintenance logs by type
   */
  getMaintenanceLogsByType(type: MaintenanceType): Observable<PaginatedResponse<MaintenanceLog>> {
    return this.getMaintenanceLogs({ maintenanceType: type });
  }

  /**
   * Search maintenance logs by description or notes
   */
  searchMaintenanceLogs(query: string): Observable<PaginatedResponse<MaintenanceLog>> {
    return this.getMaintenanceLogs({ search: query });
  }

  /**
   * Get maintenance logs within date range
   */
  getMaintenanceLogsInDateRange(startDate: string, endDate?: string): Observable<PaginatedResponse<MaintenanceLog>> {
    const params: MaintenanceQueryParams = { maintenanceDateAfter: startDate };
    if (endDate) {
      params.maintenanceDateBefore = endDate;
    }
    return this.getMaintenanceLogs(params);
  }
}