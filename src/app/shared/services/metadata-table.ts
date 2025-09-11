import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, forkJoin, map } from 'rxjs';
import { 
  MetadataTable, 
  MetadataTableTemplate,
  MetadataTableService as LibMetadataTableService,
  MetadataTableTemplateService 
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class MetadataTableService {
  private metadataTableService = inject(LibMetadataTableService);
  private metadataTableTemplateService = inject(MetadataTableTemplateService);

  // Navigation state
  private navigationTypeSubject = new BehaviorSubject<'table' | 'template'>('table');
  public navigationType$ = this.navigationTypeSubject.asObservable();

  /**
   * Check what type of interface the user should see
   */
  checkRecommendedInterface(): Observable<{ 
    has_tables: boolean; 
    has_templates: boolean; 
    recommended: 'table' | 'template';
    tables_count?: number;
    templates_count?: number;
  }> {
    // Make parallel API calls to get counts
    return forkJoin({
      tables: this.metadataTableService.getMetadataTables({ limit: 1 }),
      templates: this.metadataTableTemplateService.getMetadataTableTemplates({ limit: 1 })
    }).pipe(
      map(({ tables, templates }) => {
        const tablesCount = tables.count || 0;
        const templatesCount = templates.count || 0;
        const hasTables = tablesCount > 0;
        const hasTemplates = templatesCount > 0;

        // Recommend templates if no tables exist, otherwise recommend tables
        const recommended: 'table' | 'template' = hasTables ? 'table' : 'template';

        return {
          has_tables: hasTables,
          has_templates: hasTemplates,
          recommended,
          tables_count: tablesCount,
          templates_count: templatesCount
        };
      })
    );
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

  /**
   * Get metadata tables with optional filtering
   */
  getMetadataTables(params?: any): Observable<any> {
    return this.metadataTableService.getMetadataTables(params);
  }
}
