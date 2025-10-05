import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@noatgnu/cupcake-core';

@Injectable({
  providedIn: 'root'
})
export class SDRFDefaultsService extends BaseApiService {

  /**
   * Get all available SDRF columns with their default values
   */
  getColumns(): Observable<any[]> {
    return this.get<any[]>(`${this.apiUrl}/sdrf-defaults/columns/`);
  }

  /**
   * Get default values for a specific column
   */
  getColumnValues(params: { column: string }): Observable<any[]> {
    const httpParams = this.buildHttpParams(params);
    return this.get<any[]>(`${this.apiUrl}/sdrf-defaults/column_values/`, { params: httpParams });
  }

  /**
   * Search for columns containing the query string
   */
  searchColumns(params: { query: string }): Observable<any[]> {
    const httpParams = this.buildHttpParams(params);
    return this.get<any[]>(`${this.apiUrl}/sdrf-defaults/search/`, { params: httpParams });
  }

  /**
   * Get options for structured fields (key-value pairs)
   */
  getStructuredOptions(params: { field: string }): Observable<any[]> {
    const httpParams = this.buildHttpParams(params);
    return this.get<any[]>(`${this.apiUrl}/sdrf-defaults/structured_options/`, { params: httpParams });
  }

  /**
   * Get all label options (TMT, SILAC, label-free)
   */
  getLabels(): Observable<any[]> {
    return this.get<any[]>(`${this.apiUrl}/sdrf-defaults/labels/`);
  }

  /**
   * Get protein modification options (fixed and variable)
   */
  getModifications(): Observable<any[]> {
    return this.get<any[]>(`${this.apiUrl}/sdrf-defaults/modifications/`);
  }

  /**
   * Get list of common instrument models
   */
  getInstruments(): Observable<any[]> {
    return this.get<any[]>(`${this.apiUrl}/sdrf-defaults/instruments/`);
  }

  /**
   * Get cleavage agent options
   */
  getCleavageAgents(): Observable<any[]> {
    return this.get<any[]>(`${this.apiUrl}/sdrf-defaults/cleavage_agents/`);
  }

  /**
   * Get all compound fields that require special handling
   */
  getCompoundFields(): Observable<any[]> {
    return this.get<any[]>(`${this.apiUrl}/sdrf-defaults/compound_fields/`);
  }

  /**
   * Get schema for a specific compound field
   */
  getCompoundSchema(params: { field: string }): Observable<any> {
    const httpParams = this.buildHttpParams(params);
    return this.get<any>(`${this.apiUrl}/sdrf-defaults/compound_schema/`, { params: httpParams });
  }

  /**
   * Validate a compound field value against its schema
   */
  validateCompound(request: { field: string; value: any }): Observable<{ valid: boolean; errors?: string[] }> {
    return this.post<{ valid: boolean; errors?: string[] }>(`${this.apiUrl}/sdrf-defaults/validate_compound/`, request);
  }

  /**
   * Get column name suggestions based on partial input
   */
  getSuggestions(params: { query: string }): Observable<string[]> {
    const httpParams = this.buildHttpParams(params);
    return this.get<string[]>(`${this.apiUrl}/sdrf-defaults/suggestions/`, { params: httpParams });
  }

  /**
   * Get quick access to commonly used value categories
   */
  getQuickValues(): Observable<any> {
    return this.get<any>(`${this.apiUrl}/sdrf-defaults/quick_values/`);
  }
}