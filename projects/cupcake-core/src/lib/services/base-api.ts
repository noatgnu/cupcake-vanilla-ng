import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CUPCAKE_CORE_CONFIG } from './auth';

/**
 * Base API service with systematic case transformation
 * All other API services should extend this to get automatic snake_case <-> camelCase conversion
 */
@Injectable({
  providedIn: 'root'
})
export class BaseApiService {
  protected http = inject(HttpClient);
  private config = inject(CUPCAKE_CORE_CONFIG);
  protected apiUrl = this.config.apiUrl;

  // ===== SYSTEMATIC CASE TRANSFORMATION METHODS =====

  /**
   * Transform camelCase object to snake_case for API requests
   */
  protected transformToSnakeCase(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    // Skip FormData objects - they should not be transformed
    if (obj instanceof FormData) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.transformToSnakeCase(item));
    }

    const transformed: any = {};
    Object.entries(obj).forEach(([key, value]) => {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      transformed[snakeKey] = this.transformToSnakeCase(value);
    });

    return transformed;
  }

  /**
   * Transform snake_case object to camelCase for TypeScript interfaces
   */
  protected transformToCamelCase(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.transformToCamelCase(item));
    }

    const transformed: any = {};
    Object.entries(obj).forEach(([key, value]) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      transformed[camelKey] = this.transformToCamelCase(value);
    });

    return transformed;
  }

  // ===== HTTP METHODS WITH AUTOMATIC TRANSFORMATION =====

  /**
   * Make HTTP GET request with automatic snake_case to camelCase transformation
   */
  protected get<T>(url: string, options?: any): Observable<T> {
    return this.http.get(url, options).pipe(
      map(response => this.transformToCamelCase(response) as T)
    );
  }

  /**
   * Make HTTP POST request with automatic camelCase to snake_case transformation
   */
  protected post<T>(url: string, body: any, options?: any): Observable<T> {
    const transformedBody = this.transformToSnakeCase(body);
    return this.http.post(url, transformedBody, options).pipe(
      map(response => this.transformToCamelCase(response) as T)
    );
  }

  /**
   * Make HTTP PUT request with automatic camelCase to snake_case transformation
   */
  protected put<T>(url: string, body: any, options?: any): Observable<T> {
    const transformedBody = this.transformToSnakeCase(body);
    return this.http.put(url, transformedBody, options).pipe(
      map(response => this.transformToCamelCase(response) as T)
    );
  }

  /**
   * Make HTTP PATCH request with automatic camelCase to snake_case transformation
   */
  protected patch<T>(url: string, body: any, options?: any): Observable<T> {
    const transformedBody = this.transformToSnakeCase(body);
    return this.http.patch(url, transformedBody, options).pipe(
      map(response => this.transformToCamelCase(response) as T)
    );
  }

  /**
   * Make HTTP DELETE request with automatic snake_case to camelCase transformation
   */
  protected delete<T>(url: string, options?: any): Observable<T> {
    return this.http.delete(url, options).pipe(
      map(response => this.transformToCamelCase(response) as T)
    );
  }

  /**
   * Build HttpParams from query parameters object with automatic case transformation
   */
  protected buildHttpParams(params: any): HttpParams {
    let httpParams = new HttpParams();
    
    if (params) {
      const transformedParams = this.transformToSnakeCase(params);
      Object.entries(transformedParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    
    return httpParams;
  }
}