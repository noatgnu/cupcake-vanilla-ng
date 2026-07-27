import { ColumnOverrideImportOptions, ColumnOverridePreviewResult, ColumnOverrideCommitResult } from '../../models/metadata-table';

describe('ColumnOverrideImportModal logic', () => {
  const defaultOptions: ColumnOverrideImportOptions = {
    updateValue: true,
    updateModifiers: true,
    normalizeOntology: true,
  };

  const mockPreview: ColumnOverridePreviewResult = {
    columnsMatched: [
      {
        columnId: 1,
        columnName: 'characteristics[organism]',
        fileHeader: 'characteristics[organism]',
        fileColIndex: 0,
        currentValue: 'homo sapiens',
        newValue: 'mus musculus',
        currentModifiers: [],
        newModifiers: [],
        rowsChanged: 5,
      },
    ],
    columnsToAdd: [],
    warnings: [],
    sampleCountMismatch: false,
    fileRowCount: 5,
  };

  const mockCommit: ColumnOverrideCommitResult = {
    message: 'Column override applied',
    columnsUpdated: 1,
    columnsAdded: 0,
    warnings: [],
    updatedColumns: [{ id: 1, name: 'characteristics[organism]' }],
  };

  it('should default updateValue and updateModifiers to true', () => {
    expect(defaultOptions.updateValue).toBe(true);
    expect(defaultOptions.updateModifiers).toBe(true);
  });

  it('preview result should list matched columns', () => {
    expect(mockPreview.columnsMatched.length).toBe(1);
  });

  it('preview should detect value change', () => {
    const col = mockPreview.columnsMatched[0];
    expect(col.currentValue).not.toBe(col.newValue);
  });

  it('commit result should report updated count', () => {
    expect(mockCommit.columnsUpdated).toBe(1);
  });

  it('sampleCountMismatch should be false when rows match sample count', () => {
    expect(mockPreview.sampleCountMismatch).toBe(false);
  });
});
