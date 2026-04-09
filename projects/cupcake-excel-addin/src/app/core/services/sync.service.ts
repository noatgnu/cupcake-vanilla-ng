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

export interface SyncState {
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

@Injectable({
  providedIn: 'root'
})
export class SyncService {
  private columnService = inject(MetadataColumnService);

  private _state = signal<SyncState>({
    tableId: null,
    tableName: '',
    originalData: [],
    columns: [],
    lastPulledAt: null,
    isDirty: false
  });

  readonly state = this._state.asReadonly();

  setPulledData(table: MetadataTable, data: string[][]): void {
    this._state.set({
      tableId: table.id,
      tableName: table.name,
      originalData: data.map(row => [...row]),
      columns: table.columns ? [...table.columns].sort((a, b) => a.columnPosition - b.columnPosition) : [],
      lastPulledAt: new Date(),
      isDirty: false
    });
  }

  detectChanges(currentData: string[][]): CellChange[] {
    const state = this._state();
    const changes: CellChange[] = [];

    if (!state.originalData.length || !state.columns.length) {
      return changes;
    }

    const maxRows = Math.max(state.originalData.length, currentData.length);
    const maxCols = state.columns.length;

    for (let rowIdx = 0; rowIdx < maxRows; rowIdx++) {
      for (let colIdx = 0; colIdx < maxCols; colIdx++) {
        const originalValue = state.originalData[rowIdx]?.[colIdx] ?? '';
        const newValue = currentData[rowIdx]?.[colIdx] ?? '';

        if (originalValue !== newValue) {
          const column = state.columns[colIdx];
          if (column) {
            changes.push({
              rowIndex: rowIdx,
              columnIndex: colIdx,
              columnId: column.id,
              columnName: column.name,
              originalValue: originalValue.toString(),
              newValue: newValue.toString(),
              sampleIndex: rowIdx + 1
            });
          }
        }
      }
    }

    return changes;
  }

  /**
   * Compare a remotely-fetched data matrix against the stored originalData.
   * Returns true if the backend data differs from what was pulled — meaning
   * someone else modified column values since the last pull.
   */
  hasRemoteChanges(remoteData: string[][]): boolean {
    const state = this._state();
    if (!state.originalData.length) return false;

    const maxRows = Math.max(state.originalData.length, remoteData.length);
    const maxCols = state.columns.length;

    for (let rowIdx = 0; rowIdx < maxRows; rowIdx++) {
      for (let colIdx = 0; colIdx < maxCols; colIdx++) {
        const original = state.originalData[rowIdx]?.[colIdx] ?? '';
        const remote = remoteData[rowIdx]?.[colIdx] ?? '';
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

  updateOriginalData(currentData: string[][]): void {
    this._state.update(state => ({
      ...state,
      originalData: currentData.map(row => [...row]),
      lastPulledAt: new Date(),
      isDirty: false
    }));
  }

  markDirty(): void {
    this._state.update(state => ({ ...state, isDirty: true }));
  }

  clear(): void {
    this._state.set({
      tableId: null,
      tableName: '',
      originalData: [],
      columns: [],
      lastPulledAt: null,
      isDirty: false
    });
  }

  hasData(): boolean {
    const state = this._state();
    return state.tableId !== null && state.originalData.length > 0;
  }
}
