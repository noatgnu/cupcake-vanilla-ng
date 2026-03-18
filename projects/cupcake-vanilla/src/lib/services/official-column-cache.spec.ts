import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { OfficialColumnCacheService } from './official-column-cache';
import { MetadataColumnTemplateService } from './metadata-column-template';
import { MetadataColumnTemplate } from '../models/metadata-column-template';
import { PaginatedResponse } from '../models';

describe('OfficialColumnCacheService', () => {
  let service: OfficialColumnCacheService;
  let columnTemplateServiceSpy: jasmine.SpyObj<MetadataColumnTemplateService>;

  const createMockTemplate = (overrides: Partial<MetadataColumnTemplate>): MetadataColumnTemplate => ({
    id: 1,
    name: 'Test Template',
    columnName: 'test[column]',
    columnType: 'characteristic',
    visibility: 'public',
    isSystemTemplate: true,
    isActive: true,
    enableTypeahead: false,
    notApplicable: false,
    notAvailable: false,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    ...overrides
  });

  const mockColumns: MetadataColumnTemplate[] = [
    createMockTemplate({
      id: 1,
      name: 'Age Template',
      columnName: 'characteristics[age]',
      inputType: 'number_with_unit',
      validators: [{ type: 'number_with_unit', params: { units: ['year', 'month', 'day'] } }],
      units: ['year', 'month', 'day'],
      possibleDefaultValues: ['25 year', '30 year'],
      schemaName: 'sample-and-data-relationship-format',
      description: 'Age of the sample donor'
    }),
    createMockTemplate({
      id: 2,
      name: 'Organism Template',
      columnName: 'characteristics[organism]',
      inputType: 'select',
      validators: [{ type: 'values', params: { values: ['homo sapiens', 'mus musculus'] } }],
      units: [],
      possibleDefaultValues: ['homo sapiens', 'mus musculus'],
      schemaName: 'sample-and-data-relationship-format',
      description: 'Species of the sample'
    }),
    createMockTemplate({
      id: 3,
      name: 'Instrument Template',
      columnName: 'comment[instrument]',
      inputType: 'text',
      validators: [],
      units: [],
      possibleDefaultValues: [],
      schemaName: 'ms-proteomics',
      description: 'Mass spectrometer model'
    }),
    createMockTemplate({
      id: 4,
      name: 'Age Template MS',
      columnName: 'characteristics[age]',
      inputType: 'number_with_unit',
      validators: [{ type: 'number_with_unit', params: { units: ['year', 'week'] } }],
      units: ['year', 'week'],
      possibleDefaultValues: ['18 year', '65 year'],
      schemaName: 'ms-proteomics',
      description: 'Age for MS proteomics'
    })
  ];

  const createMockResponse = (results: MetadataColumnTemplate[]): PaginatedResponse<MetadataColumnTemplate> => ({
    count: results.length,
    next: undefined,
    previous: undefined,
    results
  });

  beforeEach(() => {
    const spy = jasmine.createSpyObj('MetadataColumnTemplateService', ['getMetadataColumnTemplates']);

    TestBed.configureTestingModule({
      providers: [
        OfficialColumnCacheService,
        { provide: MetadataColumnTemplateService, useValue: spy }
      ]
    });

    service = TestBed.inject(OfficialColumnCacheService);
    columnTemplateServiceSpy = TestBed.inject(MetadataColumnTemplateService) as jasmine.SpyObj<MetadataColumnTemplateService>;
  });

  afterEach(() => {
    service.clear();
  });

  describe('initialize', () => {
    it('should load official columns on initialize', (done) => {
      columnTemplateServiceSpy.getMetadataColumnTemplates.and.returnValue(
        of(createMockResponse(mockColumns))
      );

      service.initialize().subscribe(result => {
        expect(result).toBe(true);
        expect(service.loaded()).toBe(true);
        expect(service.columnCount()).toBe(4);
        expect(service.uniqueColumnNames()).toBe(3);
        done();
      });
    });

    it('should not reload if already loaded', (done) => {
      columnTemplateServiceSpy.getMetadataColumnTemplates.and.returnValue(
        of(createMockResponse(mockColumns))
      );

      service.initialize().subscribe(() => {
        service.initialize().subscribe(result => {
          expect(result).toBe(true);
          expect(columnTemplateServiceSpy.getMetadataColumnTemplates).toHaveBeenCalledTimes(1);
          done();
        });
      });
    });

    it('should handle errors gracefully', (done) => {
      columnTemplateServiceSpy.getMetadataColumnTemplates.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      service.initialize().subscribe(result => {
        expect(result).toBe(false);
        expect(service.loaded()).toBe(false);
        done();
      });
    });

    it('should filter by isSystemTemplate and isActive', (done) => {
      columnTemplateServiceSpy.getMetadataColumnTemplates.and.returnValue(
        of(createMockResponse(mockColumns))
      );

      service.initialize().subscribe(() => {
        expect(columnTemplateServiceSpy.getMetadataColumnTemplates).toHaveBeenCalledWith(
          jasmine.objectContaining({
            isSystemTemplate: true,
            isActive: true
          })
        );
        done();
      });
    });
  });

  describe('getColumns', () => {
    beforeEach((done) => {
      columnTemplateServiceSpy.getMetadataColumnTemplates.and.returnValue(
        of(createMockResponse(mockColumns))
      );
      service.initialize().subscribe(() => done());
    });

    it('should return all variants of a column name', () => {
      const columns = service.getColumns('characteristics[age]');
      expect(columns.length).toBe(2);
    });

    it('should be case-insensitive', () => {
      const columns = service.getColumns('CHARACTERISTICS[AGE]');
      expect(columns.length).toBe(2);
    });

    it('should return empty array for unknown column', () => {
      const columns = service.getColumns('unknown[column]');
      expect(columns.length).toBe(0);
    });
  });

  describe('getColumn', () => {
    beforeEach((done) => {
      columnTemplateServiceSpy.getMetadataColumnTemplates.and.returnValue(
        of(createMockResponse(mockColumns))
      );
      service.initialize().subscribe(() => done());
    });

    it('should return first column when no schema specified', () => {
      const column = service.getColumn('characteristics[age]');
      expect(column).toBeDefined();
      expect(column?.schemaName).toBe('sample-and-data-relationship-format');
    });

    it('should return specific schema column when specified', () => {
      const column = service.getColumn('characteristics[age]', 'ms-proteomics');
      expect(column).toBeDefined();
      expect(column?.schemaName).toBe('ms-proteomics');
    });

    it('should return undefined for unknown column', () => {
      const column = service.getColumn('unknown[column]');
      expect(column).toBeUndefined();
    });
  });

  describe('getMergedColumnConfig', () => {
    beforeEach((done) => {
      columnTemplateServiceSpy.getMetadataColumnTemplates.and.returnValue(
        of(createMockResponse(mockColumns))
      );
      service.initialize().subscribe(() => done());
    });

    it('should merge values from all schemas', () => {
      const config = service.getMergedColumnConfig('characteristics[age]');
      expect(config).toBeDefined();
      expect(config?.possibleValues).toContain('25 year');
      expect(config?.possibleValues).toContain('18 year');
      expect(config?.possibleValues).toContain('65 year');
    });

    it('should merge units from all schemas', () => {
      const config = service.getMergedColumnConfig('characteristics[age]');
      expect(config).toBeDefined();
      expect(config?.units).toContain('year');
      expect(config?.units).toContain('month');
      expect(config?.units).toContain('day');
      expect(config?.units).toContain('week');
    });

    it('should not set schemaName when multiple schemas exist', () => {
      const config = service.getMergedColumnConfig('characteristics[age]');
      expect(config?.schemaName).toBeUndefined();
    });
  });

  describe('getColumnsBySchema', () => {
    beforeEach((done) => {
      columnTemplateServiceSpy.getMetadataColumnTemplates.and.returnValue(
        of(createMockResponse(mockColumns))
      );
      service.initialize().subscribe(() => done());
    });

    it('should return columns for a schema', () => {
      const columns = service.getColumnsBySchema('sample-and-data-relationship-format');
      expect(columns.length).toBe(2);
    });

    it('should return empty array for unknown schema', () => {
      const columns = service.getColumnsBySchema('unknown-schema');
      expect(columns.length).toBe(0);
    });
  });

  describe('searchColumns', () => {
    beforeEach((done) => {
      columnTemplateServiceSpy.getMetadataColumnTemplates.and.returnValue(
        of(createMockResponse(mockColumns))
      );
      service.initialize().subscribe(() => done());
    });

    it('should find columns by partial name', () => {
      const results = service.searchColumns('characteristics');
      expect(results.length).toBe(4);
    });

    it('should return empty array for no matches', () => {
      const results = service.searchColumns('nonexistent');
      expect(results.length).toBe(0);
    });
  });

  describe('getColumnsByInputType', () => {
    beforeEach((done) => {
      columnTemplateServiceSpy.getMetadataColumnTemplates.and.returnValue(
        of(createMockResponse(mockColumns))
      );
      service.initialize().subscribe(() => done());
    });

    it('should filter by input type', () => {
      const selectColumns = service.getColumnsByInputType('select');
      expect(selectColumns.length).toBe(1);
      expect(selectColumns[0].columnName).toBe('characteristics[organism]');
    });

    it('should return multiple columns with same input type', () => {
      const unitColumns = service.getColumnsByInputType('number_with_unit');
      expect(unitColumns.length).toBe(2);
    });
  });

  describe('getSchemasForColumn', () => {
    beforeEach((done) => {
      columnTemplateServiceSpy.getMetadataColumnTemplates.and.returnValue(
        of(createMockResponse(mockColumns))
      );
      service.initialize().subscribe(() => done());
    });

    it('should return all schemas for a column', () => {
      const schemas = service.getSchemasForColumn('characteristics[age]');
      expect(schemas).toContain('sample-and-data-relationship-format');
      expect(schemas).toContain('ms-proteomics');
    });
  });

  describe('getPossibleValues', () => {
    beforeEach((done) => {
      columnTemplateServiceSpy.getMetadataColumnTemplates.and.returnValue(
        of(createMockResponse(mockColumns))
      );
      service.initialize().subscribe(() => done());
    });

    it('should return merged possible values', () => {
      const values = service.getPossibleValues('characteristics[organism]');
      expect(values).toEqual(['homo sapiens', 'mus musculus']);
    });

    it('should return empty array for unknown column', () => {
      const values = service.getPossibleValues('unknown');
      expect(values).toEqual([]);
    });
  });

  describe('getUnits', () => {
    beforeEach((done) => {
      columnTemplateServiceSpy.getMetadataColumnTemplates.and.returnValue(
        of(createMockResponse(mockColumns))
      );
      service.initialize().subscribe(() => done());
    });

    it('should return merged units', () => {
      const units = service.getUnits('characteristics[age]');
      expect(units).toContain('year');
      expect(units).toContain('week');
    });

    it('should return empty array for column without units', () => {
      const units = service.getUnits('characteristics[organism]');
      expect(units).toEqual([]);
    });
  });

  describe('clear and refresh', () => {
    beforeEach((done) => {
      columnTemplateServiceSpy.getMetadataColumnTemplates.and.returnValue(
        of(createMockResponse(mockColumns))
      );
      service.initialize().subscribe(() => done());
    });

    it('should clear the cache', () => {
      expect(service.loaded()).toBe(true);
      service.clear();
      expect(service.loaded()).toBe(false);
      expect(service.columnCount()).toBe(0);
    });

    it('should refresh the cache', (done) => {
      service.refresh().subscribe(result => {
        expect(result).toBe(true);
        expect(columnTemplateServiceSpy.getMetadataColumnTemplates).toHaveBeenCalledTimes(2);
        done();
      });
    });
  });
});
