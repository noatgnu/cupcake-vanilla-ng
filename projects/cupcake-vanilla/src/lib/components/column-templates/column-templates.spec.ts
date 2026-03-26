import { signal, WritableSignal } from '@angular/core';

interface ColumnGroup {
  columnName: string;
  columnType: string;
  schemaCount: number;
  schemas: string[];
  templateIds: number[];
}

describe('ColumnTemplates', () => {
  let viewMode: WritableSignal<'flat' | 'grouped'>;
  let expandedGroups: WritableSignal<Set<string>>;

  function setViewMode(mode: 'flat' | 'grouped'): void {
    viewMode.set(mode);
  }

  function getGroupKey(group: ColumnGroup): string {
    return `${group.columnName}::${group.columnType}`;
  }

  function toggleGroup(group: ColumnGroup): void {
    const key = getGroupKey(group);
    expandedGroups.update(groups => {
      const newGroups = new Set(groups);
      if (newGroups.has(key)) {
        newGroups.delete(key);
      } else {
        newGroups.add(key);
      }
      return newGroups;
    });
  }

  function isGroupExpanded(group: ColumnGroup): boolean {
    return expandedGroups().has(getGroupKey(group));
  }

  function collapseAllGroups(): void {
    expandedGroups.set(new Set());
  }

  beforeEach(() => {
    viewMode = signal<'flat' | 'grouped'>('flat');
    expandedGroups = signal<Set<string>>(new Set());
  });

  it('should start in flat view mode', () => {
    expect(viewMode()).toBe('flat');
  });

  it('should switch to grouped view mode', () => {
    setViewMode('grouped');
    expect(viewMode()).toBe('grouped');
  });

  it('should switch back to flat view mode', () => {
    setViewMode('grouped');
    setViewMode('flat');
    expect(viewMode()).toBe('flat');
  });

  it('should track expanded groups', () => {
    const mockGroup: ColumnGroup = {
      columnName: 'test_column',
      columnType: 'characteristics',
      schemaCount: 2,
      schemas: ['default', 'proteomics'],
      templateIds: [1, 2]
    };

    expect(isGroupExpanded(mockGroup)).toBeFalse();
    toggleGroup(mockGroup);
    expect(isGroupExpanded(mockGroup)).toBeTrue();
    toggleGroup(mockGroup);
    expect(isGroupExpanded(mockGroup)).toBeFalse();
  });

  it('should generate correct group key', () => {
    const mockGroup: ColumnGroup = {
      columnName: 'organism',
      columnType: 'characteristics',
      schemaCount: 1,
      schemas: ['default'],
      templateIds: [1]
    };

    expect(getGroupKey(mockGroup)).toBe('organism::characteristics');
  });

  it('should collapse all groups', () => {
    const mockGroup1: ColumnGroup = {
      columnName: 'col1',
      columnType: 'characteristics',
      schemaCount: 1,
      schemas: [],
      templateIds: [1]
    };
    const mockGroup2: ColumnGroup = {
      columnName: 'col2',
      columnType: 'comment',
      schemaCount: 1,
      schemas: [],
      templateIds: [2]
    };

    toggleGroup(mockGroup1);
    toggleGroup(mockGroup2);
    expect(expandedGroups().size).toBe(2);

    collapseAllGroups();
    expect(expandedGroups().size).toBe(0);
  });
});
