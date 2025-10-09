import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@noatgnu/cupcake-core';

import {
  StorageObject,
  StorageObjectCreateRequest,
  StorageObjectUpdateRequest,
  PaginatedResponse
} from '../models';

export interface StorageObjectQueryParams {
  search?: string;
  objectType?: string;
  storedAt?: number;
  canDelete?: boolean;
  isVaulted?: boolean;
  user?: number;
  limit?: number;
  offset?: number;
  ordering?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StorageService extends BaseApiService {

  /**
   * Get all storage objects with optional filtering
   */
  getStorageObjects(params?: StorageObjectQueryParams): Observable<PaginatedResponse<StorageObject>> {
    const httpParams = this.buildHttpParams(params);
    return this.get<PaginatedResponse<StorageObject>>(`${this.apiUrl}/storage-objects/`, { params: httpParams });
  }

  /**
   * Get a single storage object by ID
   */
  getStorageObject(id: number): Observable<StorageObject> {
    return this.get<StorageObject>(`${this.apiUrl}/storage-objects/${id}/`);
  }

  /**
   * Create a new storage object
   */
  createStorageObject(storageObject: StorageObjectCreateRequest): Observable<StorageObject> {
    return this.post<StorageObject>(`${this.apiUrl}/storage-objects/`, storageObject);
  }

  /**
   * Update an existing storage object
   */
  updateStorageObject(id: number, storageObject: StorageObjectUpdateRequest): Observable<StorageObject> {
    return this.put<StorageObject>(`${this.apiUrl}/storage-objects/${id}/`, storageObject);
  }

  /**
   * Partially update a storage object
   */
  patchStorageObject(id: number, storageObject: Partial<StorageObjectUpdateRequest>): Observable<StorageObject> {
    return this.patch<StorageObject>(`${this.apiUrl}/storage-objects/${id}/`, storageObject);
  }

  /**
   * Delete a storage object
   */
  deleteStorageObject(id: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/storage-objects/${id}/`);
  }

  /**
   * Get storage objects by type
   */
  getStorageObjectsByType(objectType: string): Observable<PaginatedResponse<StorageObject>> {
    return this.getStorageObjects({ objectType });
  }

  /**
   * Get child storage objects of a parent
   */
  getChildStorageObjects(parentId: number): Observable<PaginatedResponse<StorageObject>> {
    return this.getStorageObjects({ storedAt: parentId });
  }

  /**
   * Search storage objects by name
   */
  searchStorageObjects(query: string): Observable<PaginatedResponse<StorageObject>> {
    return this.getStorageObjects({ search: query });
  }

  /**
   * Get root level storage objects (no parent)
   */
  getRootStorageObjects(params?: Omit<StorageObjectQueryParams, 'storedAt'>): Observable<PaginatedResponse<StorageObject>> {
    const httpParams = this.buildHttpParams({ ...params, stored_at__isnull: 'true' });
    return this.get<PaginatedResponse<StorageObject>>(`${this.apiUrl}/storage-objects/`, { params: httpParams });
  }

  /**
   * Get storage objects owned by a specific user
   */
  getUserStorageObjects(userId: number): Observable<PaginatedResponse<StorageObject>> {
    return this.getStorageObjects({ user: userId });
  }

  /**
   * Get vaulted storage objects
   */
  getVaultedStorageObjects(): Observable<PaginatedResponse<StorageObject>> {
    return this.getStorageObjects({ isVaulted: true });
  }

  /**
   * Get deletable storage objects
   */
  getDeletableStorageObjects(): Observable<PaginatedResponse<StorageObject>> {
    return this.getStorageObjects({ canDelete: true });
  }
}