import { Component, inject, signal, input, output, computed, OnInit, OnDestroy } from '@angular/core';
import { MetadataTableService, MetadataTable, MetadataColumnService } from '@noatgnu/cupcake-vanilla';
import { ExcelService } from '../../core/services/excel.service';
import { SyncService, CellChange } from '../../core/services/sync.service';
import { ToastService } from '../../core/services/toast.service';
import { SettingsService } from '../../core/services/settings';
import { ColumnList } from '../column-list/column-list';
import { ExportPanel } from '../export-panel/export-panel';
import { ImportPanel } from '../import-panel/import-panel';
import { PoolManager } from '../pool-manager/pool-manager';
import { AutofillPanel } from '../autofill-panel/autofill-panel';

type SyncStatus = 'idle' | 'pulling' | 'pushing' | 'detecting' | 'checking' | 'success' | 'error';
type PanelView = 'main' | 'columns' | 'export' | 'import' | 'pools' | 'autofill';

@Component({
  selector: 'app-sync-panel',
  imports: [ColumnList, ExportPanel, ImportPanel, PoolManager, AutofillPanel],
  templateUrl: './sync-panel.html',
  styleUrl: './sync-panel.scss',
})
export class SyncPanel implements OnInit, OnDestroy {
  private tableService = inject(MetadataTableService);
  private columnService = inject(MetadataColumnService);
  private excelService = inject(ExcelService);
  private syncService = inject(SyncService);
  private toastService = inject(ToastService);
  private settingsService = inject(SettingsService);

  readonly table = input.required<MetadataTable>();
  readonly back = output<void>();

  readonly syncStatus = signal<SyncStatus>('idle');
  readonly statusMessage = signal<string>('');
  readonly fullTable = signal<MetadataTable | null>(null);
  readonly pendingChanges = signal<CellChange[]>([]);
  readonly showDiffPreview = signal(false);
  readonly showConflictWarning = signal(false);

  readonly hasChanges = computed(() => this.pendingChanges().length > 0);
  readonly changesSummary = computed(() => {
    const changes = this.pendingChanges();
    const columns = new Set(changes.map(c => c.columnName));
    return `${changes.length} cell(s) in ${columns.size} column(s)`;
  });

  readonly currentView = signal<PanelView>('main');
  readonly protectSheet = signal(true);
  readonly isProtected = signal(false);
  readonly showBackConfirm = signal(false);
  readonly showOverwriteConfirm = signal(false);

  private removeWorksheetChangedHandler: (() => void) | null = null;
  private autoDetectTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.excelService.onWorksheetChanged(() => this.onExcelContentChanged()).then(cleanup => {
      this.removeWorksheetChangedHandler = cleanup;
    });
  }

  ngOnDestroy(): void {
    if (this.removeWorksheetChangedHandler) {
      this.removeWorksheetChangedHandler();
      this.removeWorksheetChangedHandler = null;
    }
    if (this.autoDetectTimer) {
      clearTimeout(this.autoDetectTimer);
      this.autoDetectTimer = null;
    }
  }

  private onExcelContentChanged(): void {
    this.pendingChanges.set([]);
    this.showDiffPreview.set(false);

    if (!this.settingsService.autoDetectChanges()) return;

    if (this.autoDetectTimer) {
      clearTimeout(this.autoDetectTimer);
    }
    this.autoDetectTimer = setTimeout(() => {
      this.autoDetectTimer = null;
      this.runAutoDetect();
    }, 800);
  }

  private async runAutoDetect(): Promise<void> {
    const status = this.syncStatus();
    if (status === 'pulling' || status === 'pushing' || status === 'detecting') return;

    const sheetName = await this.excelService.getActiveWorksheetName();
    if (!this.syncService.hasDataForSheet(sheetName)) return;

    try {
      const worksheetData = await this.excelService.readWorksheetData();
      const changes = this.syncService.detectChanges(sheetName, worksheetData.rows);
      this.pendingChanges.set(changes);
      this.showDiffPreview.set(changes.length > 0);
    } catch {
      // silent — auto-detect failure should not surface as an error
    }
  }

  async pullToExcel(): Promise<void> {
    const sheetName = await this.excelService.getActiveWorksheetName();
    const state = this.syncService.getSheetState(sheetName);
    if (state.tableId !== null && state.tableId !== this.table().id && this.syncService.hasDataForSheet(sheetName)) {
      this.showOverwriteConfirm.set(true);
      return;
    }
    this.doPull();
  }

  confirmOverwrite(): void {
    this.showOverwriteConfirm.set(false);
    this.doPull();
  }

  cancelOverwrite(): void {
    this.showOverwriteConfirm.set(false);
  }

  private async doPull(): Promise<void> {
    this.syncStatus.set('pulling');
    this.statusMessage.set('Loading table data...');
    this.pendingChanges.set([]);
    this.showDiffPreview.set(false);
    this.showConflictWarning.set(false);

    try {
      const sheetName = await this.excelService.getActiveWorksheetName();

      this.tableService.getMetadataTable(this.table().id).subscribe({
        next: async (tableData) => {
          this.fullTable.set(tableData);

          if (!tableData.columns || tableData.columns.length === 0) {
            this.syncStatus.set('error');
            this.statusMessage.set('Table has no columns');
            return;
          }

          const sortedColumns = tableData.columns.sort((a, b) => a.columnPosition - b.columnPosition);
          const headers = sortedColumns.map(col => col.name);
          const rows: string[][] = [];

          for (let sampleIdx = 0; sampleIdx < tableData.sampleCount; sampleIdx++) {
            const row: string[] = [];
            for (const col of sortedColumns) {
              const value = this.getColumnValueForSample(col, sampleIdx);
              row.push(value);
            }
            rows.push(row);
          }

          this.statusMessage.set('Writing to Excel...');
          await this.excelService.writeTableToWorksheet(headers, rows);

          this.syncService.setPulledData(sheetName, tableData, rows);

          if (this.protectSheet()) {
            this.statusMessage.set('Applying protection...');
            await this.excelService.protectWorksheet();
            this.isProtected.set(true);
          } else {
            this.isProtected.set(false);
          }

          this.syncStatus.set('success');
          this.statusMessage.set(`Pulled ${tableData.sampleCount} samples, ${headers.length} columns`);
          this.toastService.success('Data pulled to Excel');
        },
        error: () => {
          this.syncStatus.set('error');
          this.statusMessage.set('Failed to load table data');
          this.toastService.error('Failed to load table data');
        }
      });
    } catch {
      this.syncStatus.set('error');
      this.statusMessage.set('Failed to write to Excel');
      this.toastService.error('Failed to write to Excel');
    }
  }

  async toggleProtection(): Promise<void> {
    try {
      if (this.isProtected()) {
        await this.excelService.unprotectWorksheet();
        this.isProtected.set(false);
        this.toastService.info('Sheet unprotected');
      } else {
        await this.excelService.protectWorksheet();
        this.isProtected.set(true);
        this.toastService.info('Sheet protected');
      }
    } catch {
      this.toastService.error('Failed to toggle protection');
    }
  }

  onProtectSheetChange(value: boolean): void {
    this.protectSheet.set(value);
  }

  private getColumnValueForSample(column: any, sampleIndex: number): string {
    if (column.modifiers && column.modifiers.length > 0) {
      for (const modifier of column.modifiers) {
        if (this.sampleInRange(modifier.samples, sampleIndex + 1)) {
          return modifier.value;
        }
      }
    }
    return column.value || '';
  }

  private sampleInRange(samplesStr: string, sampleNum: number): boolean {
    if (!samplesStr) return false;
    const parts = samplesStr.split(',');
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        if (sampleNum >= start && sampleNum <= end) return true;
      } else {
        if (Number(part) === sampleNum) return true;
      }
    }
    return false;
  }

  async detectChanges(): Promise<void> {
    const sheetName = await this.excelService.getActiveWorksheetName();

    if (!this.syncService.hasDataForSheet(sheetName)) {
      this.toastService.warning('Pull data first to detect changes');
      return;
    }

    this.syncStatus.set('detecting');
    this.statusMessage.set('Detecting changes...');

    try {
      const worksheetData = await this.excelService.readWorksheetData();
      const changes = this.syncService.detectChanges(sheetName, worksheetData.rows);

      this.pendingChanges.set(changes);

      if (changes.length > 0) {
        this.showDiffPreview.set(true);
        this.syncStatus.set('idle');
        this.statusMessage.set(`Found ${changes.length} change(s)`);
      } else {
        this.syncStatus.set('success');
        this.statusMessage.set('No changes detected');
        this.showDiffPreview.set(false);
      }
    } catch {
      this.syncStatus.set('error');
      this.statusMessage.set('Failed to detect changes');
      this.toastService.error('Failed to read Excel data');
    }
  }

  async pushFromExcel(): Promise<void> {
    await this.detectChanges();
    const changes = this.pendingChanges();

    if (changes.length === 0) {
      this.toastService.info('No changes to push');
      return;
    }

    const sheetName = await this.excelService.getActiveWorksheetName();
    const syncState = this.syncService.getSheetState(sheetName);
    if (!syncState.tableId) return;

    this.syncStatus.set('checking');
    this.statusMessage.set('Checking for remote changes...');

    this.tableService.getMetadataTable(syncState.tableId).subscribe({
      next: async (remoteTable) => {
        const remoteData = this.buildDataMatrix(remoteTable);
        const sn = await this.excelService.getActiveWorksheetName();
        if (this.syncService.hasRemoteChanges(sn, remoteData)) {
          this.showConflictWarning.set(true);
          this.syncStatus.set('idle');
          this.statusMessage.set('');
        } else {
          this.doPush(this.pendingChanges());
        }
      },
      error: () => {
        this.syncStatus.set('error');
        this.statusMessage.set('Failed to check remote version');
        this.toastService.error('Could not verify remote table state');
      }
    });
  }

  private buildDataMatrix(table: MetadataTable): string[][] {
    if (!table.columns || table.columns.length === 0) return [];
    const sortedColumns = [...table.columns].sort((a, b) => a.columnPosition - b.columnPosition);
    const rows: string[][] = [];
    for (let sampleIdx = 0; sampleIdx < table.sampleCount; sampleIdx++) {
      const row: string[] = [];
      for (const col of sortedColumns) {
        row.push(this.getColumnValueForSample(col, sampleIdx));
      }
      rows.push(row);
    }
    return rows;
  }

  overrideAndPush(): void {
    this.showConflictWarning.set(false);
    this.doPush(this.pendingChanges());
  }

  cancelConflict(): void {
    this.showConflictWarning.set(false);
    this.syncStatus.set('idle');
    this.statusMessage.set('');
  }

  private doPush(changes: CellChange[]): void {
    this.syncStatus.set('pushing');
    this.statusMessage.set(`Pushing ${changes.length} change(s)...`);

    this.syncService.pushChanges(changes).subscribe({
      next: async (result) => {
        if (result.success) {
          this.syncStatus.set('success');
          this.statusMessage.set(`Pushed ${result.updatedCount} change(s)`);
          this.toastService.success(`Pushed ${result.updatedCount} change(s) to backend`);

          const worksheetData = await this.excelService.readWorksheetData();
          const sheetName = await this.excelService.getActiveWorksheetName();
          this.syncService.updateOriginalData(sheetName, worksheetData.rows);
          this.pendingChanges.set([]);
          this.showDiffPreview.set(false);
        } else {
          this.syncStatus.set('error');
          this.statusMessage.set(`Failed: ${result.failedCount} error(s)`);
          this.toastService.error(`Push failed: ${result.errors.join(', ')}`);
        }
      },
      error: () => {
        this.syncStatus.set('error');
        this.statusMessage.set('Push failed');
        this.toastService.error('Failed to push changes');
      }
    });
  }

  confirmPush(): void {
    this.pushFromExcel();
  }

  cancelPush(): void {
    this.pendingChanges.set([]);
    this.showDiffPreview.set(false);
    this.syncStatus.set('idle');
    this.statusMessage.set('');
  }

  async goBack(): Promise<void> {
    const sheetName = await this.excelService.getActiveWorksheetName();
    if (this.syncService.hasDataForSheet(sheetName)) {
      this.showBackConfirm.set(true);
    } else {
      this.back.emit();
    }
  }

  async confirmBack(): Promise<void> {
    this.showBackConfirm.set(false);
    const sheetName = await this.excelService.getActiveWorksheetName();
    this.syncService.clearSheet(sheetName);
    this.back.emit();
  }

  cancelBack(): void {
    this.showBackConfirm.set(false);
  }

  openView(view: PanelView): void {
    this.currentView.set(view);
  }

  closeSubPanel(): void {
    this.currentView.set('main');
  }

  onColumnsRefresh(): void {
    this.currentView.set('main');
    this.tableService.getMetadataTable(this.table().id).subscribe({
      next: async (tableData) => {
        this.fullTable.set(tableData);
        if (!tableData.columns || tableData.columns.length === 0) return;
        const sortedColumns = [...tableData.columns].sort((a, b) => a.columnPosition - b.columnPosition);
        const newHeaders = sortedColumns.map(col => col.name);
        try {
          if (this.isProtected()) {
            await this.excelService.unprotectWorksheet();
          }
          await this.excelService.mergeTableStructure(newHeaders);
          if (this.isProtected()) {
            await this.excelService.protectWorksheet();
          }
          this.toastService.success('Column structure updated');
        } catch {
          this.toastService.error('Failed to update Excel structure');
        }
      },
      error: () => {
        this.toastService.error('Failed to reload table');
      }
    });
  }

  onImported(): void {
    this.currentView.set('main');
    this.toastService.success('Import completed - pull data to refresh');
  }

  onAutofillApplied(): void {
    this.currentView.set('main');
    this.toastService.success('Autofill applied - pull to refresh cell values');
  }
}
