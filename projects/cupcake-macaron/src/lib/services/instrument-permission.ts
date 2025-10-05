import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@noatgnu/cupcake-core';

import {
  InstrumentPermission,
  InstrumentPermissionCreateRequest,
  InstrumentPermissionUpdateRequest,
  PaginatedResponse
} from '../models';

export interface InstrumentPermissionQueryParams {
  search?: string;
  instrument?: number;
  user?: number;
  canView?: boolean;
  canBook?: boolean;
  canManage?: boolean;
  limit?: number;
  offset?: number;
  ordering?: string;
}

@Injectable({
  providedIn: 'root'
})
export class InstrumentPermissionService extends BaseApiService {

  /**
   * Get all instrument permissions with optional filtering
   */
  getInstrumentPermissions(params?: InstrumentPermissionQueryParams): Observable<PaginatedResponse<InstrumentPermission>> {
    const httpParams = this.buildHttpParams(params);
    return this.get<PaginatedResponse<InstrumentPermission>>(`${this.apiUrl}/instrument-permissions/`, { params: httpParams });
  }

  /**
   * Get a single instrument permission by ID
   */
  getInstrumentPermission(id: number): Observable<InstrumentPermission> {
    return this.get<InstrumentPermission>(`${this.apiUrl}/instrument-permissions/${id}/`);
  }

  /**
   * Create a new instrument permission
   */
  createInstrumentPermission(permission: InstrumentPermissionCreateRequest): Observable<InstrumentPermission> {
    return this.post<InstrumentPermission>(`${this.apiUrl}/instrument-permissions/`, permission);
  }

  /**
   * Update an existing instrument permission
   */
  updateInstrumentPermission(id: number, permission: InstrumentPermissionUpdateRequest): Observable<InstrumentPermission> {
    return this.put<InstrumentPermission>(`${this.apiUrl}/instrument-permissions/${id}/`, permission);
  }

  /**
   * Partially update an instrument permission
   */
  patchInstrumentPermission(id: number, permission: Partial<InstrumentPermissionUpdateRequest>): Observable<InstrumentPermission> {
    return this.patch<InstrumentPermission>(`${this.apiUrl}/instrument-permissions/${id}/`, permission);
  }

  /**
   * Delete an instrument permission
   */
  deleteInstrumentPermission(id: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/instrument-permissions/${id}/`);
  }

  /**
   * Get permissions for a specific instrument
   */
  getPermissionsForInstrument(instrumentId: number): Observable<PaginatedResponse<InstrumentPermission>> {
    return this.getInstrumentPermissions({ instrument: instrumentId });
  }

  /**
   * Get permissions for a specific user
   */
  getUserPermissions(userId: number): Observable<PaginatedResponse<InstrumentPermission>> {
    return this.getInstrumentPermissions({ user: userId });
  }

  /**
   * Get users with view permissions
   */
  getViewPermissions(): Observable<PaginatedResponse<InstrumentPermission>> {
    return this.getInstrumentPermissions({ canView: true });
  }

  /**
   * Get users with booking permissions
   */
  getBookingPermissions(): Observable<PaginatedResponse<InstrumentPermission>> {
    return this.getInstrumentPermissions({ canBook: true });
  }

  /**
   * Get users with management permissions
   */
  getManagementPermissions(): Observable<PaginatedResponse<InstrumentPermission>> {
    return this.getInstrumentPermissions({ canManage: true });
  }

  /**
   * Search instrument permissions
   */
  searchInstrumentPermissions(query: string): Observable<PaginatedResponse<InstrumentPermission>> {
    return this.getInstrumentPermissions({ search: query });
  }
}