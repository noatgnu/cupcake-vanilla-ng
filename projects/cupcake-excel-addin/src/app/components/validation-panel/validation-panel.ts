import { Component, inject, signal, OnInit, OnDestroy, computed, effect, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AsyncValidationService } from '@noatgnu/cupcake-vanilla';
import { ValidationSchema, TaskStatus, AsyncTaskMonitorService } from '@noatgnu/cupcake-core';
import { ExcelService } from '../../core/services/excel.service';
import { ToastService } from '../../core/services/toast.service';
import { SyncService, CellChange } from '../../core/services/sync.service';

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

  private activeTaskId = signal<string | null>(null);

  readonly schemas = signal<ValidationSchema[]>([]);
  readonly selectedSchema = signal<string>('default');
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

  readonly hasPendingChanges = computed(() => this.pendingChanges().length > 0);
  readonly changesSummary = computed(() => {
    const changes = this.pendingChanges();
    const columns = new Set(changes.map(c => c.columnName));
    return `${changes.length} cell(s) in ${columns.size} column(s)`;
  });

  constructor() {
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
          this.handleValidationResult(task.result);
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
    this.loadSchemas();
  }

  ngOnDestroy(): void {
    this.activeTaskId.set(null);
  }

  private loadSchemas(): void {
    this.isLoading.set(true);
    this.validationService.getAvailableSchemas().subscribe({
      next: (schemas) => {
        this.schemas.set(schemas);
        this.isLoading.set(false);
      },
      error: () => {
        this.schemas.set([]);
        this.isLoading.set(false);
      }
    });
  }

  onSchemaChange(schema: string): void {
    this.selectedSchema.set(schema);
  }

  async validate(): Promise<void> {
    const syncState = this.syncService.state();
    if (!syncState.tableId || !this.syncService.hasData()) {
      this.toastService.warning('Pull table data first before validating');
      return;
    }

    this.statusMessage.set('Checking for unsaved changes...');

    try {
      const worksheetData = await this.excelService.readWorksheetData();
      const changes = this.syncService.detectChanges(worksheetData.rows);

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
            this.syncService.updateOriginalData(worksheetData.rows);
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

  private runValidation(): void {
    const syncState = this.syncService.state();

    this.isValidating.set(true);
    this.errors.set([]);
    this.warnings.set([]);
    this.statusMessage.set('Starting validation...');
    this.taskProgress.set(0);

    this.validationService.metadataTable({
      metadataTableId: syncState.tableId!,
      validateSdrfFormat: true,
      includePools: this.includePools(),
      schemaNames: [this.selectedSchema()],
      skipOntology: this.skipOntology()
    }).subscribe({
      next: (response) => {
        this.activeTaskId.set(response.taskId);
        this.asyncTaskMonitor.loadSingleTask(response.taskId);
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

    const validationErrors: ValidationError[] = [];
    const validationWarnings: ValidationError[] = [];

    if (result?.validationErrors && Array.isArray(result.validationErrors)) {
      for (const error of result.validationErrors) {
        validationErrors.push({
          row: error.row || 0,
          column: error.column || 'Unknown',
          message: error.message || error,
          severity: 'error'
        });
      }
    }

    if (result?.errors && Array.isArray(result.errors)) {
      for (const error of result.errors) {
        if (typeof error === 'string') {
          validationErrors.push({ row: 0, column: 'General', message: error, severity: 'error' });
        }
      }
    }

    if (result?.warnings && Array.isArray(result.warnings)) {
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
