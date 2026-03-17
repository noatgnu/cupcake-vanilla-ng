import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CUPCAKE_CORE_CONFIG } from './auth';

export type QueryParamValue = string | number | boolean | null | undefined;

@Injectable({
  providedIn: 'root'
})
export class BaseApiService {
  protected http = inject(HttpClient);
  private config = inject(CUPCAKE_CORE_CONFIG);
  protected apiUrl = this.config.apiUrl;

  // ===== SYSTEMATIC CASE TRANSFORMATION METHODS =====

  protected transformToSnakeCase<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof FormData) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.transformToSnakeCase(item)) as T;
    }

    const transformed: Record<string, unknown> = {};
    Object.entries(obj as Record<string, unknown>).forEach(([key, value]) => {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      transformed[snakeKey] = this.transformToSnakeCase(value);
    });

    return transformed as T;
  }

  protected transformToCamelCase<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.transformToCamelCase(item)) as T;
    }

    const transformed: Record<string, unknown> = {};
    Object.entries(obj as Record<string, unknown>).forEach(([key, value]) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      transformed[camelKey] = this.transformToCamelCase(value);
    });

    return transformed as T;
  }

  // ===== HTTP METHODS WITH AUTOMATIC TRANSFORMATION =====

  protected get<T>(url: string, options?: object): Observable<T> {
    return this.http.get(url, options).pipe(
      map(response => this.transformToCamelCase(response) as T)
    );
  }

  protected post<T>(url: string, body: unknown, options?: object): Observable<T> {
    const transformedBody = this.transformToSnakeCase(body);
    return this.http.post(url, transformedBody, options).pipe(
      map(response => this.transformToCamelCase(response) as T)
    );
  }

  protected put<T>(url: string, body: unknown, options?: object): Observable<T> {
    const transformedBody = this.transformToSnakeCase(body);
    return this.http.put(url, transformedBody, options).pipe(
      map(response => this.transformToCamelCase(response) as T)
    );
  }

  protected patch<T>(url: string, body: unknown, options?: object): Observable<T> {
    const transformedBody = this.transformToSnakeCase(body);
    return this.http.patch(url, transformedBody, options).pipe(
      map(response => this.transformToCamelCase(response) as T)
    );
  }

  protected delete<T>(url: string, options?: object): Observable<T> {
    return this.http.delete(url, options).pipe(
      map(response => this.transformToCamelCase(response) as T)
    );
  }

  protected buildHttpParams<T extends object>(params: T | null | undefined): HttpParams {
    let httpParams = new HttpParams();

    if (params) {
      const transformedParams = this.transformToSnakeCase(params);
      Object.entries(transformedParams as Record<string, unknown>).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }

    return httpParams;
  }
}