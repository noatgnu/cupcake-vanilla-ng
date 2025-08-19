import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MetadataTable, MetadataTableQueryResponse, MetadataTableCreateRequest } from '../models/metadata-table';

@Injectable({
  providedIn: 'root'
})
export class MetadataTableService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl || 'http://localhost:8000';

  // Navigation state
  private navigationTypeSubject = new BehaviorSubject<'table' | 'template'>('table');
  public navigationType$ = this.navigationTypeSubject.asObservable();

  /**
   * Check what type of interface the user should see
   */
  checkRecommendedInterface(): Observable<{ 
    has_tables: boolean; 
    has_templates: boolean; 
    recommended: 'table' | 'template' 
  }> {
    // For now, return a mock response - this should be implemented in the backend
    return new Observable(observer => {
      // Simulate API call
      setTimeout(() => {
        observer.next({
          has_tables: false,
          has_templates: false,
          recommended: 'template'
        });
        observer.complete();
      }, 500);
    });
  }

  /**
   * Set the current navigation type
   */
  setNavigationType(type: 'table' | 'template'): void {
    this.navigationTypeSubject.next(type);
  }

  /**
   * Get the current navigation type
   */
  getCurrentNavigationType(): 'table' | 'template' {
    return this.navigationTypeSubject.value;
  }
}
