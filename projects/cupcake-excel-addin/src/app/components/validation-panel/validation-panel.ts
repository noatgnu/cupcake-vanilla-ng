import { Component, inject, signal, OnInit, OnDestroy, computed, effect, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AsyncValidationService } from '@noatgnu/cupcake-vanilla';
import { TaskStatus, AsyncTaskMonitorService, SdrfValidationSchemaResult } from '@noatgnu/cupcake-core';
import { ExcelService } from '../../core/services/excel.service';
import { ToastService } from '../../core/services/toast.service';
import { SyncService, CellChange } from '../../core/services/sync.service';
import { SchemaContext } from '../../core/services/schema-context';

type ValidationMode = 'table' | 'excel' | 'file';

interface ValidationError {
  row: number;
  column: string;
  message: string;
  severity: 'error' | 'warning';
}

@Component({
  selector: 'app-validation-panel',
  imports: [FormsModule],
  templateUrl: './validation-panel.html',
  styleUrl: './validation-panel.scss',
})
export class ValidationPanel implements OnInit, OnDestroy {
  private validationService = inject(AsyncValidationService);
  private asyncTaskMonitor = inject(AsyncTaskMonitorService);
  private excelService = inject(ExcelService);
  private toastService = inject(ToastService);
  private syncService = inject(SyncService);
  readonly schemaContext = inject(SchemaContext);

  private activeTaskId = signal<string | null>(null);
  private activeSheetName = signal<string>('');

  readonly mode = signal<ValidationMode>('table');
  readonly isValidating = signal(false);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly errors = signal<ValidationError[]>([]);
  readonly warnings = signal<ValidationError[]>([]);
  readonly statusMessage = signal<string>('');
  readonly taskProgress = signal<number>(0);
  readonly skipOntology = signal(false);
  readonly includePools = signal(true);
  readonly pendingChanges = signal<CellChange[]>([]);
  readonly showUnsavedWarning = signal(false);

  readonly selectedFile = signal<File | null>(null);
  readonly useOlsCacheOnly = signal(false);
  readonly fileSchemaResults = signal<SdrfValidationSchemaResult[]>([]);
  readonly fileValidationSuccess = signal<boolean | null>(null);

  readonly hasBackendTable = computed(() => {
    const sheet = this.activeSheetName();
    const sessions = this.syncService.sessions();
    const state = sessions[sheet];
    return !!state && state.tableId !== null && state.originalData.length > 0;
  });

  readonly hasPendingChanges = computed(() => this.pendingChanges().length > 0);
  readonly changesSummary = computed(() => {
    const changes = this.pendingChanges();
    const columns = new Set(changes.map(c => c.columnName));
    return `${changes.length} cell(s) in ${columns.size} column(s)`;
  });

  constructor() {
    effect(() => {
      if (!this.hasBackendTable() && this.mode() === 'table') {
        untracked(() => this.mode.set('excel'));
      }
    });

    effect(() => {
      const tasks = this.asyncTaskMonitor.tasks();
      const taskId = this.activeTaskId();
      if (!taskId) return;

      untracked(() => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        this.taskProgress.set(task.progressPercentage || 0);

        if (task.progressDescription) {
          this.statusMessage.set(task.progressDescription);
        }

        if (task.status === TaskStatus.SUCCESS) {
          this.activeTaskId.set(null);
          if (this.mode() === 'table') {
            this.handleValidationResult(task.result);
          } else {
            this.handleFileValidationResult(task.result);
          }
        } else if (task.status === TaskStatus.FAILURE) {
          this.activeTaskId.set(null);
          this.isValidating.set(false);
          this.statusMessage.set('Validation failed');
          this.toastService.error(task.errorMessage || 'Validation failed');
        } else if (task.status === TaskStatus.CANCELLED) {
          this.activeTaskId.set(null);
          this.isValidating.set(false);
          this.statusMessage.set('Validation cancelled');
        }
      });
    });
  }

  ngOnInit(): void {
    this.schemaContext.loadSchemas();
    this.excelService.getActiveWorksheetName().then(name => this.activeSheetName.set(name));
  }

  ngOnDestroy(): void {
    this.activeTaskId.set(null);
  }

  onSchemaChange(schema: string): void {
    this.schemaContext.setSchema(schema);
  }

  async validate(): Promise<void> {
    const sheetName = await this.excelService.getActiveWorksheetName();
    const syncState = this.syncService.getSheetState(sheetName);
    if (!syncState.tableId || !this.syncService.hasDataForSheet(sheetName)) {
      this.toastService.warning('Pull table data first before validating');
      return;
    }

    this.statusMessage.set('Checking for unsaved changes...');

    try {
      const worksheetData = await this.excelService.readWorksheetData();
      const changes = this.syncService.detectChanges(sheetName, worksheetData.rows);

      if (changes.length > 0) {
        this.pendingChanges.set(changes);
        this.showUnsavedWarning.set(true);
        this.statusMessage.set('');
        return;
      }
    } catch {
      this.toastService.error('Failed to check for unsaved changes');
      this.statusMessage.set('');
      return;
    }

    this.runValidation();
  }

  async saveAndValidate(): Promise<void> {
    const changes = this.pendingChanges();
    if (changes.length === 0) {
      this.showUnsavedWarning.set(false);
      this.runValidation();
      return;
    }

    this.isSaving.set(true);
    this.statusMessage.set(`Saving ${changes.length} change(s)...`);

    this.syncService.pushChanges(changes).subscribe({
      next: async (result) => {
        if (result.success) {
          try {
            const worksheetData = await this.excelService.readWorksheetData();
            const sn = await this.excelService.getActiveWorksheetName();
            this.syncService.updateOriginalData(sn, worksheetData.rows);
          } catch {}

          this.pendingChanges.set([]);
          this.showUnsavedWarning.set(false);
          this.isSaving.set(false);
          this.toastService.success(`Saved ${result.updatedCount} change(s)`);
          this.runValidation();
        } else {
          this.isSaving.set(false);
          this.statusMessage.set(`Save failed: ${result.failedCount} error(s)`);
          this.toastService.error(`Failed to save: ${result.errors.join(', ')}`);
        }
      },
      error: () => {
        this.isSaving.set(false);
        this.statusMessage.set('Save failed');
        this.toastService.error('Failed to save changes to backend');
      }
    });
  }

  dismissUnsavedWarning(): void {
    this.showUnsavedWarning.set(false);
    this.pendingChanges.set([]);
    this.statusMessage.set('');
  }

  private async runValidation(): Promise<void> {
    const sheetName = await this.excelService.getActiveWorksheetName();
    const syncState = this.syncService.getSheetState(sheetName);

    this.isValidating.set(true);
    this.errors.set([]);
    this.warnings.set([]);
    this.statusMessage.set('Starting validation...');
    this.taskProgress.set(0);

    this.validationService.metadataTable({
      metadataTableId: syncState.tableId!,
      validateSdrfFormat: true,
      includePools: this.includePools(),
      schemaNames: [this.schemaContext.selectedSchema()],
      skipOntology: this.skipOntology()
    }).subscribe({
      next: (response) => {
        this.activeTaskId.set(response.taskId);
        this.asyncTaskMonitor.pollUntilComplete(response.taskId);
        this.statusMessage.set('Validation running...');
      },
      error: () => {
        this.isValidating.set(false);
        this.statusMessage.set('Failed to start validation');
        this.toastService.error('Failed to start validation task');
      }
    });
  }

  private async handleValidationResult(result: any): Promise<void> {
    this.isValidating.set(false);

    if (Array.isArray(result?.schemaResults) && result.schemaResults.length > 0) {
      this.handleFileValidationResult(result);
      return;
    }

    const validationErrors: ValidationError[] = [];
    const validationWarnings: ValidationError[] = [];

    if (Array.isArray(result?.validationErrors)) {
      for (const error of result.validationErrors) {
        validationErrors.push({
          row: error.row || 0,
          column: error.column || 'Unknown',
          message: error.message || String(error),
          severity: 'error'
        });
      }
    }

    if (Array.isArray(result?.errors)) {
      for (const error of result.errors) {
        if (typeof error === 'string') {
          validationErrors.push({ row: 0, column: 'General', message: error, severity: 'error' });
        }
      }
    }

    if (Array.isArray(result?.warnings)) {
      for (const warning of result.warnings) {
        if (typeof warning === 'string') {
          validationWarnings.push({ row: 0, column: 'General', message: warning, severity: 'warning' });
        }
      }
    }

    this.errors.set(validationErrors);
    this.warnings.set(validationWarnings);

    if (validationErrors.length > 0) {
      this.statusMessage.set(`Found ${validationErrors.length} error(s), ${validationWarnings.length} warning(s)`);
      this.toastService.warning(`Found ${validationErrors.length} validation error(s)`);

      try {
        const data = await this.excelService.readWorksheetData();
        const cellRefs = validationErrors
          .filter(e => e.row > 0)
          .map(e => ({ row: e.row - 1, column: data.headers.indexOf(e.column) }))
          .filter(c => c.column >= 0);

        if (cellRefs.length > 0) {
          await this.excelService.highlightCells(cellRefs, '#FFCDD2');
        }
      } catch {}
    } else if (result?.isValid === true) {
      this.statusMessage.set('Validation passed');
      this.toastService.success('Validation passed');
    } else {
      this.statusMessage.set('Validation completed');
    }
  }

  onModeChange(mode: ValidationMode): void {
    this.mode.set(mode);
    this.errors.set([]);
    this.warnings.set([]);
    this.statusMessage.set('');
    this.fileSchemaResults.set([]);
    this.fileValidationSuccess.set(null);
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile.set(input.files?.[0] ?? null);
    this.fileSchemaResults.set([]);
    this.fileValidationSuccess.set(null);
    this.statusMessage.set('');
  }

  async validateFromExcel(): Promise<void> {
    let worksheetData;
    try {
      worksheetData = await this.excelService.readWorksheetData();
    } catch {
      this.toastService.error('Failed to read worksheet data');
      return;
    }

    if (!worksheetData.headers.length) {
      this.toastService.warning('No data found in the active worksheet');
      return;
    }

    const rows = [worksheetData.headers, ...worksheetData.rows];
    const tsv = rows.map(r => r.map(cell => (cell ?? '').toString().replace(/\t/g, ' ')).join('\t')).join('\n');
    const file = new File([tsv], 'excel-table.sdrf.tsv', { type: 'text/tab-separated-values' });
    this.runFileValidation(file);
  }

  validateFile(): void {
    const file = this.selectedFile();
    if (!file) {
      this.toastService.warning('Select an SDRF file first');
      return;
    }
    this.runFileValidation(file);
  }

  private runFileValidation(file: File): void {
    this.isValidating.set(true);
    this.fileSchemaResults.set([]);
    this.fileValidationSuccess.set(null);
    this.errors.set([]);
    this.warnings.set([]);
    this.statusMessage.set('Uploading file...');
    this.taskProgress.set(0);

    this.validationService.sdrfFile({
      file,
      schemaNames: [this.schemaContext.selectedSchema()],
      skipOntology: this.skipOntology(),
      useOlsCacheOnly: this.useOlsCacheOnly()
    }).subscribe({
      next: (response) => {
        this.activeTaskId.set(response.taskId);
        this.asyncTaskMonitor.pollUntilComplete(response.taskId);
        this.statusMessage.set('Validation running...');
      },
      error: () => {
        this.isValidating.set(false);
        this.statusMessage.set('Failed to start validation');
        this.toastService.error('Failed to upload and validate SDRF file');
      }
    });
  }

  private handleFileValidationResult(result: any): void {
    this.isValidating.set(false);

    const schemaResults: SdrfValidationSchemaResult[] = result?.schemaResults ?? [];
    const success: boolean = result?.success ?? false;

    this.fileSchemaResults.set(schemaResults);
    this.fileValidationSuccess.set(success);

    const totalErrors = schemaResults.reduce((n, r) => n + r.errors.length, 0);
    const totalWarnings = schemaResults.reduce((n, r) => n + r.warnings.length, 0);

    if (success) {
      this.statusMessage.set('File validation passed');
      this.toastService.success('SDRF file validation passed');
    } else {
      this.statusMessage.set(`Found ${totalErrors} error(s), ${totalWarnings} warning(s)`);
      this.toastService.warning(`SDRF validation: ${totalErrors} error(s)`);
    }
  }

  async clearHighlights(): Promise<void> {
    await this.excelService.clearHighlights();
    this.errors.set([]);
    this.warnings.set([]);
    this.statusMessage.set('');
  }

  async navigateToError(error: ValidationError): Promise<void> {
    if (error.row > 0) {
      try {
        const data = await this.excelService.readWorksheetData();
        const colIndex = data.headers.indexOf(error.column);
        if (colIndex >= 0) {
          await this.excelService.highlightCells([{ row: error.row - 1, column: colIndex }], '#FFCDD2');
        }
      } catch {}
    }
  }
}
