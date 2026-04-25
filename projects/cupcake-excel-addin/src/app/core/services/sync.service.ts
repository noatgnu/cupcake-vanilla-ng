import { Injectable, signal, inject } from '@angular/core';
import { MetadataTable, MetadataColumn, MetadataColumnService } from '@noatgnu/cupcake-vanilla';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface CellChange {
  rowIndex: number;
  columnIndex: number;
  columnId: number;
  columnName: string;
  originalValue: string;
  newValue: string;
  sampleIndex: number;
}

export interface SheetSyncState {
  tableId: number | null;
  tableName: string;
  originalData: string[][];
  columns: MetadataColumn[];
  lastPulledAt: Date | null;
  isDirty: boolean;
}

export interface PushResult {
  success: boolean;
  updatedCount: number;
  failedCount: number;
  errors: string[];
}

const defaultState = (): SheetSyncState => ({
  tableId: null,
  tableName: '',
  originalData: [],
  columns: [],
  lastPulledAt: null,
  isDirty: false
});

@Injectable({
  providedIn: 'root'
})
export class SyncService {
  private columnService = inject(MetadataColumnService);

  private _sessions = signal<Record<string, SheetSyncState>>({});
  readonly sessions = this._sessions.asReadonly();

  getSheetState(sheetName: string): SheetSyncState {
    return this._sessions()[sheetName] ?? defaultState();
  }

  hasDataForSheet(sheetName: string): boolean {
    const state = this._sessions()[sheetName];
    return !!state && state.tableId !== null && state.originalData.length > 0;
  }

  setPulledData(sheetName: string, table: MetadataTable, data: string[][]): void {
    this._sessions.update(sessions => ({
      ...sessions,
      [sheetName]: {
        tableId: table.id,
        tableName: table.name,
        originalData: data.map(row => [...row]),
        columns: table.columns
          ? [...table.columns].sort((a, b) => a.columnPosition - b.columnPosition)
          : [],
        lastPulledAt: new Date(),
        isDirty: false
      }
    }));
  }

  detectChanges(sheetName: string, currentData: string[][]): CellChange[] {
    const state = this.getSheetState(sheetName);
    const changes: CellChange[] = [];

    if (!state.originalData.length || !state.columns.length) {
      return changes;
    }

    const maxRows = state.originalData.length;
    const maxCols = state.columns.length;

    for (let rowIdx = 0; rowIdx < maxRows; rowIdx++) {
      for (let colIdx = 0; colIdx < maxCols; colIdx++) {
        const originalValue = String(state.originalData[rowIdx]?.[colIdx] ?? '');
        const newValue = String(currentData[rowIdx]?.[colIdx] ?? '');

        if (originalValue !== newValue) {
          const column = state.columns[colIdx];
          if (column) {
            changes.push({
              rowIndex: rowIdx,
              columnIndex: colIdx,
              columnId: column.id,
              columnName: column.name,
              originalValue,
              newValue,
              sampleIndex: rowIdx + 1
            });
          }
        }
      }
    }

    return changes;
  }

  hasRemoteChanges(sheetName: string, remoteData: string[][]): boolean {
    const state = this.getSheetState(sheetName);
    if (!state.originalData.length) return false;

    const maxRows = Math.max(state.originalData.length, remoteData.length);
    const maxCols = state.columns.length;

    for (let rowIdx = 0; rowIdx < maxRows; rowIdx++) {
      for (let colIdx = 0; colIdx < maxCols; colIdx++) {
        const original = String(state.originalData[rowIdx]?.[colIdx] ?? '');
        const remote = String(remoteData[rowIdx]?.[colIdx] ?? '');
        if (original !== remote) return true;
      }
    }

    return false;
  }

  pushChanges(changes: CellChange[]): Observable<PushResult> {
    if (changes.length === 0) {
      return of({ success: true, updatedCount: 0, failedCount: 0, errors: [] });
    }

    const changesByColumn = new Map<number, CellChange[]>();
    for (const change of changes) {
      const existing = changesByColumn.get(change.columnId) || [];
      existing.push(change);
      changesByColumn.set(change.columnId, existing);
    }

    const updateObservables: Observable<{ columnId: number; success: boolean; error?: string }>[] = [];

    for (const [columnId, columnChanges] of changesByColumn) {
      const updates = columnChanges.map(c => ({
        sampleIndex: c.sampleIndex,
        value: c.newValue
      }));

      const observable = this.columnService.bulkUpdateSampleValues(columnId, updates).pipe(
        map(() => ({ columnId, success: true })),
        catchError(err => of({ columnId, success: false, error: err.message || 'Update failed' }))
      );

      updateObservables.push(observable);
    }

    return forkJoin(updateObservables).pipe(
      map(results => {
        const errors: string[] = [];
        let updatedCount = 0;
        let failedCount = 0;

        for (const result of results) {
          if (result.success) {
            const columnChanges = changesByColumn.get(result.columnId);
            updatedCount += columnChanges?.length || 0;
          } else {
            const columnChanges = changesByColumn.get(result.columnId);
            failedCount += columnChanges?.length || 0;
            if (result.error) {
              errors.push(`Column ${result.columnId}: ${result.error}`);
            }
          }
        }

        return { success: failedCount === 0, updatedCount, failedCount, errors };
      })
    );
  }

  updateOriginalData(sheetName: string, currentData: string[][]): void {
    this._sessions.update(sessions => {
      const existing = sessions[sheetName];
      if (!existing) return sessions;
      return {
        ...sessions,
        [sheetName]: {
          ...existing,
          originalData: currentData.map(row => [...row]),
          lastPulledAt: new Date(),
          isDirty: false
        }
      };
    });
  }

  clearSheet(sheetName: string): void {
    this._sessions.update(sessions => {
      const { [sheetName]: _, ...rest } = sessions;
      return rest;
    });
  }

  getActiveSheetNames(): string[] {
    return Object.keys(this._sessions());
  }
}
