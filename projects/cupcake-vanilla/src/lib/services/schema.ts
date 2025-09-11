import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@cupcake/core';

import {
  Schema,
  PaginatedResponse
} from '../models';

export interface SchemaQueryParams {
  search?: string;
  category?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
  ordering?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SchemaService extends BaseApiService {

  /**
   * Get all schemas with optional filtering
   */
  getSchemas(params?: SchemaQueryParams): Observable<PaginatedResponse<Schema>> {
    const httpParams = this.buildHttpParams(params);
    return this.get<PaginatedResponse<Schema>>(`${this.apiUrl}/schemas/`, { params: httpParams });
  }

  /**
   * Get a single schema by ID
   */
  getSchema(id: number): Observable<Schema> {
    return this.get<Schema>(`${this.apiUrl}/schemas/${id}/`);
  }

  /**
   * Get list of available schemas for creating templates
   */
  getAvailableSchemas(): Observable<Schema[]> {
    return this.get<Schema[]>(`${this.apiUrl}/schemas/available/`);
  }

  /**
   * Sync builtin schemas from sdrf-pipelines package (admin only)
   */
  syncBuiltin(): Observable<{ message: string; synced_count: number }> {
    return this.post<{ message: string; synced_count: number }>(`${this.apiUrl}/schemas/sync_builtin/`, {});
  }
}