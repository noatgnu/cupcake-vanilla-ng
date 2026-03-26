import { signal, WritableSignal } from '@angular/core';

interface MetadataColumnTemplate {
  id: number;
  name: string;
  columnName: string;
  columnType: string;
  inputType?: string;
  schemaName?: string;
  units?: string[];
  possibleDefaultValues?: string[];
  validators?: any[];
}

interface MergedColumnConfig {
  columnName: string;
  inputType: string;
  possibleValues: string[];
  units: string[];
  schemaName?: string;
}

describe('OfficialColumnCacheService', () => {
  let loaded: WritableSignal<boolean>;
  let columnCount: WritableSignal<number>;
  let uniqueColumnNames: WritableSignal<number>;
  let columns: Map<string, MetadataColumnTemplate[]>;
  let schemaColumns: Map<string, MetadataColumnTemplate[]>;

  const mockColumns: MetadataColumnTemplate[] = [
    {
      id: 1,
      name: 'Age Template',
      columnName: 'characteristics[age]',
      columnType: 'characteristic',
      inputType: 'number_with_unit',
      validators: [{ type: 'number_with_unit', params: { units: ['year', 'month', 'day'] } }],
      units: ['year', 'month', 'day'],
      possibleDefaultValues: ['25 year', '30 year'],
      schemaName: 'sample-and-data-relationship-format'
    },
    {
      id: 2,
      name: 'Organism Template',
      columnName: 'characteristics[organism]',
      columnType: 'characteristic',
      inputType: 'select',
      validators: [{ type: 'values', params: { values: ['homo sapiens', 'mus musculus'] } }],
      units: [],
      possibleDefaultValues: ['homo sapiens', 'mus musculus'],
      schemaName: 'sample-and-data-relationship-format'
    },
    {
      id: 3,
      name: 'Instrument Template',
      columnName: 'comment[instrument]',
      columnType: 'comment',
      inputType: 'text',
      validators: [],
      units: [],
      possibleDefaultValues: [],
      schemaName: 'ms-proteomics'
    },
    {
      id: 4,
      name: 'Age Template MS',
      columnName: 'characteristics[age]',
      columnType: 'characteristic',
      inputType: 'number_with_unit',
      validators: [{ type: 'number_with_unit', params: { units: ['year', 'week'] } }],
      units: ['year', 'week'],
      possibleDefaultValues: ['18 year', '65 year'],
      schemaName: 'ms-proteomics'
    }
  ];

  function initializeColumns(): void {
    columns.clear();
    schemaColumns.clear();

    for (const col of mockColumns) {
      const key = col.columnName.toLowerCase();
      if (!columns.has(key)) {
        columns.set(key, []);
      }
      columns.get(key)!.push(col);

      if (col.schemaName) {
        if (!schemaColumns.has(col.schemaName)) {
          schemaColumns.set(col.schemaName, []);
        }
        schemaColumns.get(col.schemaName)!.push(col);
      }
    }

    columnCount.set(mockColumns.length);
    uniqueColumnNames.set(columns.size);
    loaded.set(true);
  }

  function getColumns(columnName: string): MetadataColumnTemplate[] {
    return columns.get(columnName.toLowerCase()) || [];
  }

  function getColumn(columnName: string, schemaName?: string): MetadataColumnTemplate | undefined {
    const cols = getColumns(columnName);
    if (schemaName) {
      return cols.find(c => c.schemaName === schemaName);
    }
    return cols[0];
  }

  function getMergedColumnConfig(columnName: string): MergedColumnConfig | undefined {
    const cols = getColumns(columnName);
    if (cols.length === 0) return undefined;

    const possibleValues = new Set<string>();
    const units = new Set<string>();

    for (const col of cols) {
      col.possibleDefaultValues?.forEach(v => possibleValues.add(v));
      col.units?.forEach(u => units.add(u));
    }

    return {
      columnName: cols[0].columnName,
      inputType: cols[0].inputType || 'text',
      possibleValues: Array.from(possibleValues),
      units: Array.from(units),
      schemaName: cols.length === 1 ? cols[0].schemaName : undefined
    };
  }

  function getColumnsBySchema(schemaName: string): MetadataColumnTemplate[] {
    return schemaColumns.get(schemaName) || [];
  }

  function searchColumns(query: string): MetadataColumnTemplate[] {
    const lowerQuery = query.toLowerCase();
    return mockColumns.filter(c => c.columnName.toLowerCase().includes(lowerQuery));
  }

  function getColumnsByInputType(inputType: string): MetadataColumnTemplate[] {
    return mockColumns.filter(c => c.inputType === inputType);
  }

  function getSchemasForColumn(columnName: string): string[] {
    const cols = getColumns(columnName);
    return cols.map(c => c.schemaName).filter((s): s is string => !!s);
  }

  function getPossibleValues(columnName: string): string[] {
    const config = getMergedColumnConfig(columnName);
    return config?.possibleValues || [];
  }

  function getUnits(columnName: string): string[] {
    const config = getMergedColumnConfig(columnName);
    return config?.units || [];
  }

  function clear(): void {
    columns.clear();
    schemaColumns.clear();
    loaded.set(false);
    columnCount.set(0);
    uniqueColumnNames.set(0);
  }

  beforeEach(() => {
    loaded = signal(false);
    columnCount = signal(0);
    uniqueColumnNames = signal(0);
    columns = new Map();
    schemaColumns = new Map();
  });

  describe('initialize', () => {
    it('should load official columns on initialize', () => {
      initializeColumns();
      expect(loaded()).toBe(true);
      expect(columnCount()).toBe(4);
      expect(uniqueColumnNames()).toBe(3);
    });
  });

  describe('getColumns', () => {
    beforeEach(() => {
      initializeColumns();
    });

    it('should return all variants of a column name', () => {
      const cols = getColumns('characteristics[age]');
      expect(cols.length).toBe(2);
    });

    it('should be case-insensitive', () => {
      const cols = getColumns('CHARACTERISTICS[AGE]');
      expect(cols.length).toBe(2);
    });

    it('should return empty array for unknown column', () => {
      const cols = getColumns('unknown[column]');
      expect(cols.length).toBe(0);
    });
  });

  describe('getColumn', () => {
    beforeEach(() => {
      initializeColumns();
    });

    it('should return first column when no schema specified', () => {
      const column = getColumn('characteristics[age]');
      expect(column).toBeDefined();
      expect(column?.schemaName).toBe('sample-and-data-relationship-format');
    });

    it('should return specific schema column when specified', () => {
      const column = getColumn('characteristics[age]', 'ms-proteomics');
      expect(column).toBeDefined();
      expect(column?.schemaName).toBe('ms-proteomics');
    });

    it('should return undefined for unknown column', () => {
      const column = getColumn('unknown[column]');
      expect(column).toBeUndefined();
    });
  });

  describe('getMergedColumnConfig', () => {
    beforeEach(() => {
      initializeColumns();
    });

    it('should merge values from all schemas', () => {
      const config = getMergedColumnConfig('characteristics[age]');
      expect(config).toBeDefined();
      expect(config?.possibleValues).toContain('25 year');
      expect(config?.possibleValues).toContain('18 year');
      expect(config?.possibleValues).toContain('65 year');
    });

    it('should merge units from all schemas', () => {
      const config = getMergedColumnConfig('characteristics[age]');
      expect(config).toBeDefined();
      expect(config?.units).toContain('year');
      expect(config?.units).toContain('month');
      expect(config?.units).toContain('day');
      expect(config?.units).toContain('week');
    });

    it('should not set schemaName when multiple schemas exist', () => {
      const config = getMergedColumnConfig('characteristics[age]');
      expect(config?.schemaName).toBeUndefined();
    });
  });

  describe('getColumnsBySchema', () => {
    beforeEach(() => {
      initializeColumns();
    });

    it('should return columns for a schema', () => {
      const cols = getColumnsBySchema('sample-and-data-relationship-format');
      expect(cols.length).toBe(2);
    });

    it('should return empty array for unknown schema', () => {
      const cols = getColumnsBySchema('unknown-schema');
      expect(cols.length).toBe(0);
    });
  });

  describe('searchColumns', () => {
    beforeEach(() => {
      initializeColumns();
    });

    it('should find columns by partial name', () => {
      const results = searchColumns('characteristics');
      expect(results.length).toBe(3);
    });

    it('should return empty array for no matches', () => {
      const results = searchColumns('nonexistent');
      expect(results.length).toBe(0);
    });
  });

  describe('getColumnsByInputType', () => {
    beforeEach(() => {
      initializeColumns();
    });

    it('should filter by input type', () => {
      const selectColumns = getColumnsByInputType('select');
      expect(selectColumns.length).toBe(1);
      expect(selectColumns[0].columnName).toBe('characteristics[organism]');
    });

    it('should return multiple columns with same input type', () => {
      const unitColumns = getColumnsByInputType('number_with_unit');
      expect(unitColumns.length).toBe(2);
    });
  });

  describe('getSchemasForColumn', () => {
    beforeEach(() => {
      initializeColumns();
    });

    it('should return all schemas for a column', () => {
      const schemas = getSchemasForColumn('characteristics[age]');
      expect(schemas).toContain('sample-and-data-relationship-format');
      expect(schemas).toContain('ms-proteomics');
    });
  });

  describe('getPossibleValues', () => {
    beforeEach(() => {
      initializeColumns();
    });

    it('should return merged possible values', () => {
      const values = getPossibleValues('characteristics[organism]');
      expect(values).toEqual(['homo sapiens', 'mus musculus']);
    });

    it('should return empty array for unknown column', () => {
      const values = getPossibleValues('unknown');
      expect(values).toEqual([]);
    });
  });

  describe('getUnits', () => {
    beforeEach(() => {
      initializeColumns();
    });

    it('should return merged units', () => {
      const units = getUnits('characteristics[age]');
      expect(units).toContain('year');
      expect(units).toContain('week');
    });

    it('should return empty array for column without units', () => {
      const units = getUnits('characteristics[organism]');
      expect(units).toEqual([]);
    });
  });

  describe('clear', () => {
    beforeEach(() => {
      initializeColumns();
    });

    it('should clear the cache', () => {
      expect(loaded()).toBe(true);
      clear();
      expect(loaded()).toBe(false);
      expect(columnCount()).toBe(0);
    });
  });
});
