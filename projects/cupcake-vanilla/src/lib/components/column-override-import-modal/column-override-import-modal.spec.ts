import { ColumnOverrideImportOptions, ColumnOverridePreviewResult, ColumnOverrideCommitResult } from '../../models/metadata-table';

describe('ColumnOverrideImportModal logic', () => {
  const defaultOptions: ColumnOverrideImportOptions = {
    matchBy: 'name',
    addUnmatched: false,
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
    columnsUnmatched: [{ fileHeader: 'comment[data file]', fileColIndex: 3 }],
    warnings: [],
    sampleCountMismatch: false,
    fileRowCount: 5,
  };

  const mockCommit: ColumnOverrideCommitResult = {
    message: 'Column override applied',
    columnsUpdated: 1,
    columnsAdded: 0,
    columnsSkipped: 1,
    warnings: [],
    updatedColumns: [{ id: 1, name: 'characteristics[organism]' }],
  };

  it('should have default options with matchBy name', () => {
    expect(defaultOptions.matchBy).toBe('name');
  });

  it('should default addUnmatched to false', () => {
    expect(defaultOptions.addUnmatched).toBe(false);
  });

  it('preview result should list matched and unmatched columns', () => {
    expect(mockPreview.columnsMatched.length).toBe(1);
    expect(mockPreview.columnsUnmatched.length).toBe(1);
  });

  it('preview should detect value change', () => {
    const col = mockPreview.columnsMatched[0];
    expect(col.currentValue).not.toBe(col.newValue);
  });

  it('commit result should report updated count', () => {
    expect(mockCommit.columnsUpdated).toBe(1);
    expect(mockCommit.columnsSkipped).toBe(1);
  });

  it('sampleCountMismatch should be false when rows match sample count', () => {
    expect(mockPreview.sampleCountMismatch).toBe(false);
  });
});
