import { Injectable, signal, computed } from '@angular/core';
import { Observable, of, tap, map, catchError, expand, reduce, EMPTY } from 'rxjs';
import { MetadataColumnTemplateService } from './metadata-column-template';
import { MetadataColumnTemplate, ColumnInputType, ColumnValidator } from '../models/metadata-column-template';

export interface ColumnConfig {
  columnName: string;
  inputType: ColumnInputType;
  validators: ColumnValidator[];
  units: string[];
  possibleValues: (string | number)[];
  description: string;
  schemaName?: string;
}

@Injectable({
  providedIn: 'root',
})
export class OfficialColumnCacheService {
  private columnsByName = signal<Map<string, MetadataColumnTemplate[]>>(new Map());
  private columnsBySchema = signal<Map<string, MetadataColumnTemplate[]>>(new Map());
  private columnsByKey = signal<Map<string, MetadataColumnTemplate>>(new Map());
  private isLoaded = signal<boolean>(false);
  private isLoading = signal<boolean>(false);

  readonly loaded = computed(() => this.isLoaded());
  readonly loading = computed(() => this.isLoading());
  readonly columnCount = computed(() => {
    let count = 0;
    this.columnsByName().forEach(arr => count += arr.length);
    return count;
  });
  readonly uniqueColumnNames = computed(() => this.columnsByName().size);

  constructor(private columnTemplateService: MetadataColumnTemplateService) {}

  /**
   * Initialize the cache by loading all official (system) column templates.
   * Call this on app initialization or when first needed.
   */
  initialize(): Observable<boolean> {
    if (this.isLoaded() || this.isLoading()) {
      return of(this.isLoaded());
    }

    this.isLoading.set(true);

    return this.fetchAllSystemTemplates().pipe(
      tap(templates => {
        const byName = new Map<string, MetadataColumnTemplate[]>();
        const bySchema = new Map<string, MetadataColumnTemplate[]>();
        const byKey = new Map<string, MetadataColumnTemplate>();

        for (const column of templates) {
          const lowerName = column.columnName.toLowerCase();
          const schemaName = column.schemaName || 'unknown';
          const compositeKey = `${lowerName}::${schemaName}`;

          const existingByName = byName.get(lowerName) || [];
          existingByName.push(column);
          byName.set(lowerName, existingByName);

          const existingBySchema = bySchema.get(schemaName) || [];
          existingBySchema.push(column);
          bySchema.set(schemaName, existingBySchema);

          byKey.set(compositeKey, column);
        }

        this.columnsByName.set(byName);
        this.columnsBySchema.set(bySchema);
        this.columnsByKey.set(byKey);
        this.isLoaded.set(true);
        this.isLoading.set(false);
      }),
      map(() => true),
      catchError(error => {
        this.isLoading.set(false);
        console.error('Failed to load official columns:', error);
        return of(false);
      })
    );
  }

  private fetchAllSystemTemplates(): Observable<MetadataColumnTemplate[]> {
    const pageSize = 100;
    let offset = 0;

    return this.columnTemplateService.getMetadataColumnTemplates({
      isSystemTemplate: true,
      isActive: true,
      limit: pageSize,
      offset: 0
    }).pipe(
      expand(response => {
        offset += pageSize;
        if (offset < response.count) {
          return this.columnTemplateService.getMetadataColumnTemplates({
            isSystemTemplate: true,
            isActive: true,
            limit: pageSize,
            offset
          });
        }
        return EMPTY;
      }),
      reduce((acc, response) => [...acc, ...response.results], [] as MetadataColumnTemplate[])
    );
  }

  /**
   * Get all column templates with a given name (may exist in multiple schemas).
   */
  getColumns(columnName: string): MetadataColumnTemplate[] {
    return this.columnsByName().get(columnName.toLowerCase()) || [];
  }

  /**
   * Get column template by name and schema.
   * Use this when you need the exact configuration for a specific schema.
   */
  getColumn(columnName: string, schemaName?: string): MetadataColumnTemplate | undefined {
    if (schemaName) {
      const key = `${columnName.toLowerCase()}::${schemaName}`;
      return this.columnsByKey().get(key);
    }

    const columns = this.getColumns(columnName);
    return columns.length > 0 ? columns[0] : undefined;
  }

  /**
   * Get column configuration with a simplified interface.
   * If schema is specified, returns that specific config.
   * Otherwise returns the first found (typically base schema).
   */
  getColumnConfig(columnName: string, schemaName?: string): ColumnConfig | undefined {
    const template = this.getColumn(columnName, schemaName);
    if (!template) {
      return undefined;
    }

    return {
      columnName: template.columnName,
      inputType: template.inputType || 'text',
      validators: template.validators || [],
      units: template.units || [],
      possibleValues: template.possibleDefaultValues || [],
      description: template.description || '',
      schemaName: template.schemaName
    };
  }

  /**
   * Get merged configuration from all schemas for a column.
   * Combines possible values and units from all schema variants.
   */
  getMergedColumnConfig(columnName: string): ColumnConfig | undefined {
    const columns = this.getColumns(columnName);
    if (columns.length === 0) {
      return undefined;
    }

    const first = columns[0];
    const mergedValues = new Set<string | number>();
    const mergedUnits = new Set<string>();

    for (const col of columns) {
      if (col.possibleDefaultValues) {
        col.possibleDefaultValues.forEach(v => mergedValues.add(v));
      }
      if (col.units) {
        col.units.forEach(u => mergedUnits.add(u));
      }
      if (col.validators) {
        for (const validator of col.validators) {
          if (validator.params?.values) {
            validator.params.values.forEach(v => mergedValues.add(v));
          }
          if (validator.params?.units) {
            validator.params.units.forEach(u => mergedUnits.add(u));
          }
        }
      }
    }

    return {
      columnName: first.columnName,
      inputType: first.inputType || 'text',
      validators: first.validators || [],
      units: Array.from(mergedUnits),
      possibleValues: Array.from(mergedValues),
      description: first.description || '',
      schemaName: columns.length === 1 ? first.schemaName : undefined
    };
  }

  /**
   * Get all columns for a specific schema.
   */
  getColumnsBySchema(schemaName: string): MetadataColumnTemplate[] {
    return this.columnsBySchema().get(schemaName) || [];
  }

  /**
   * Get all available schema names.
   */
  getSchemaNames(): string[] {
    return Array.from(this.columnsBySchema().keys());
  }

  /**
   * Search for columns by partial name match.
   * Returns all variants across all schemas.
   */
  searchColumns(query: string): MetadataColumnTemplate[] {
    const lowerQuery = query.toLowerCase();
    const results: MetadataColumnTemplate[] = [];

    this.columnsByName().forEach((templates, key) => {
      if (key.includes(lowerQuery)) {
        results.push(...templates);
      }
    });

    return results;
  }

  /**
   * Get columns filtered by input type.
   */
  getColumnsByInputType(inputType: ColumnInputType): MetadataColumnTemplate[] {
    const results: MetadataColumnTemplate[] = [];

    this.columnsByName().forEach(templates => {
      for (const template of templates) {
        if (template.inputType === inputType) {
          results.push(template);
        }
      }
    });

    return results;
  }

  /**
   * Check if a column exists in official schemas.
   */
  hasColumn(columnName: string): boolean {
    return this.columnsByName().has(columnName.toLowerCase());
  }

  /**
   * Get all schemas that define a specific column.
   */
  getSchemasForColumn(columnName: string): string[] {
    const columns = this.getColumns(columnName);
    return columns.map(c => c.schemaName).filter((s): s is string => !!s);
  }

  /**
   * Get possible values for a column, merged from all schemas.
   */
  getPossibleValues(columnName: string): (string | number)[] {
    const config = this.getMergedColumnConfig(columnName);
    return config?.possibleValues || [];
  }

  /**
   * Get units for a number_with_unit column, merged from all schemas.
   */
  getUnits(columnName: string): string[] {
    const config = this.getMergedColumnConfig(columnName);
    return config?.units || [];
  }

  /**
   * Clear the cache (useful for testing or forced refresh).
   */
  clear(): void {
    this.columnsByName.set(new Map());
    this.columnsBySchema.set(new Map());
    this.columnsByKey.set(new Map());
    this.isLoaded.set(false);
    this.isLoading.set(false);
  }

  /**
   * Force refresh the cache.
   */
  refresh(): Observable<boolean> {
    this.clear();
    return this.initialize();
  }
}
