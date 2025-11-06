import { Injectable, OnDestroy, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  AsyncTaskStatus,
  AsyncTaskCreateResponse,
  MetadataImportRequest,
  MetadataExportRequest,
  BulkExportRequest,
  BulkExcelExportRequest,
  MetadataValidationRequest,
  TaskType,
  TaskStatus,
  ToastService,
  AsyncTaskMonitorService
} from '@noatgnu/cupcake-core';
import {
  AsyncTaskService as LibraryAsyncTaskService,
  AsyncExportService,
  AsyncImportService,
  AsyncValidationService,
  ElectronService
} from '../services';
import { ValidationResultsModal, ValidationResults } from './validation-results-modal/validation-results-modal';

@Injectable({
  providedIn: 'root'
})
export class AsyncTaskUIService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private metadataTableRefreshSubject = new Subject<number>();
  private taskCompletedSubject = new Subject<AsyncTaskStatus>();
  private exportTaskCompletedSubject = new Subject<AsyncTaskStatus>();

  private readonly sessionId = this.generateSessionId();
  private initiatedTasks = new Set<string>();
  private processedCompletedTasks = new Set<string>();

  private libraryAsyncTaskService = inject(LibraryAsyncTaskService);
  private asyncExportService = inject(AsyncExportService);
  private asyncImportService = inject(AsyncImportService);
  private asyncValidationService = inject(AsyncValidationService);
  private toastService = inject(ToastService);
  private asyncTaskMonitor = inject(AsyncTaskMonitorService);
  private modalService = inject(NgbModal);
  private electronService = inject(ElectronService);

  public tasks$ = this.asyncTaskMonitor.tasks$;
  public activeTasks$ = this.asyncTaskMonitor.activeTasks$;

  public metadataTableRefresh$ = this.metadataTableRefreshSubject.asObservable();
  public taskCompleted$ = this.taskCompletedSubject.asObservable();
  public exportTaskCompleted$ = this.exportTaskCompletedSubject.asObservable();

  constructor() {
    this.asyncTaskMonitor.tasks$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(tasks => {
      this.handleTasksUpdate(tasks);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private handleTasksUpdate(tasks: AsyncTaskStatus[]): void {

    tasks.forEach(task => {
      const wasRunning = task.status === TaskStatus.QUEUED || task.status === TaskStatus.STARTED;

      if (task.status === TaskStatus.SUCCESS || task.status === TaskStatus.FAILURE || task.status === TaskStatus.CANCELLED) {
        const isTaskFromThisTab = this.isTaskInitiatedByThisTab(task.id);

        if (this.processedCompletedTasks.has(task.id)) {
          return;
        }

        this.taskCompletedSubject.next(task);

        if (task.status === TaskStatus.SUCCESS && isTaskFromThisTab) {
          if (this.isImportTask(task.taskType) && task.metadataTable) {
            this.metadataTableRefreshSubject.next(task.metadataTable);
          }

          if (this.isExportTask(task.taskType)) {
            this.exportTaskCompletedSubject.next(task);
            this.handleExportTaskCompletion(task);
          }

          if (task.taskType === TaskType.VALIDATE_TABLE && task.metadataTable) {
            this.metadataTableRefreshSubject.next(task.metadataTable);
          }

          if ((task.taskType === TaskType.REORDER_TABLE_COLUMNS) && task.metadataTable) {
            this.metadataTableRefreshSubject.next(task.metadataTable);
          }
        }

        if (isTaskFromThisTab) {
          this.showTaskCompletionNotification(task);
        }

        this.processedCompletedTasks.add(task.id);
      }
    });
  }

  cancelTask(taskId: string): Observable<{message: string}> {
    return this.asyncTaskMonitor.cancelTask(taskId);
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private isTaskInitiatedByThisTab(taskId: string): boolean {
    return this.initiatedTasks.has(taskId);
  }

  monitorTask(taskId: string): void {
    this.initiatedTasks.add(taskId);
    this.asyncTaskMonitor.loadSingleTask(taskId);
  }

  queueExcelExport(request: MetadataExportRequest): Observable<AsyncTaskCreateResponse> {
    return this.asyncExportService.excelTemplate(request).pipe(
      tap(response => {
        this.initiatedTasks.add(response.taskId);
        this.asyncTaskMonitor.loadSingleTask(response.taskId);
      })
    );
  }

  queueSdrfExport(request: MetadataExportRequest): Observable<AsyncTaskCreateResponse> {
    return this.asyncExportService.sdrfFile(request).pipe(
      tap(response => {
        this.initiatedTasks.add(response.taskId);
        this.asyncTaskMonitor.loadSingleTask(response.taskId);
      })
    );
  }

  queueSdrfImport(request: MetadataImportRequest): Observable<AsyncTaskCreateResponse> {
    return this.asyncImportService.sdrfFile(request).pipe(
      tap(response => {
        this.initiatedTasks.add(response.taskId);
        this.asyncTaskMonitor.loadSingleTask(response.taskId);
      })
    );
  }

  queueExcelImport(request: MetadataImportRequest): Observable<AsyncTaskCreateResponse> {
    return this.asyncImportService.excelFile(request).pipe(
      tap(response => {
        this.initiatedTasks.add(response.taskId);
        this.asyncTaskMonitor.loadSingleTask(response.taskId);
      })
    );
  }

  queueBulkSdrfExport(request: BulkExportRequest): Observable<AsyncTaskCreateResponse> {
    return this.asyncExportService.multipleSdrfFiles(request).pipe(
      tap(response => {
        this.initiatedTasks.add(response.taskId);
        this.asyncTaskMonitor.loadSingleTask(response.taskId);
      })
    );
  }

  queueBulkExcelExport(request: BulkExcelExportRequest): Observable<AsyncTaskCreateResponse> {
    return this.asyncExportService.multipleExcelTemplates(request).pipe(
      tap(response => {
        this.initiatedTasks.add(response.taskId);
        this.asyncTaskMonitor.loadSingleTask(response.taskId);
      })
    );
  }

  downloadTaskResult(taskId: string): void {
    this.libraryAsyncTaskService.getDownloadUrl(taskId).subscribe({
      next: (response) => {
        console.log('Download task result - checking Electron service:', {
          isElectron: this.electronService.isElectron,
          downloadUrl: response.downloadUrl
        });

        if (this.electronService.isElectron) {
          console.log('Using Electron download for:', response.downloadUrl);
          this.electronService.downloadFile(response.downloadUrl)
            .then((filePath: string) => {
              console.log('Electron download successful:', filePath);
              this.toastService.success(`File downloaded to: ${filePath}`);
            })
            .catch((error: any) => {
              console.error('Error downloading file with Electron:', error);
              this.toastService.error('Failed to download file');
            });
        } else {
          console.log('Using browser fallback for:', response.downloadUrl);
          window.open(response.downloadUrl, '_blank');
        }
      },
      error: (error) => {
        console.error('Error getting download URL:', error);
        this.toastService.error('Failed to get download URL');
      }
    });
  }

  validateMetadataTable(validationRequest: MetadataValidationRequest): Observable<AsyncTaskCreateResponse> {
    return this.asyncValidationService.metadataTable(validationRequest).pipe(
      tap(response => {
        this.initiatedTasks.add(response.taskId);
        this.asyncTaskMonitor.loadSingleTask(response.taskId);
      })
    );
  }

  private showTaskProgressNotification(updatedTask: AsyncTaskStatus, previousTask: AsyncTaskStatus): void {
    const taskName = this.getTaskDisplayName(updatedTask.taskType);
    const tableName = updatedTask.metadataTableName ? ` for "${updatedTask.metadataTableName}"` : '';

    const progressChanged = Math.floor((updatedTask.progressPercentage || 0) / 25) !== Math.floor((previousTask.progressPercentage || 0) / 25);
    const descriptionChanged = updatedTask.progressDescription !== previousTask.progressDescription;

    if (progressChanged || (descriptionChanged && updatedTask.progressDescription)) {
      let message = `${taskName}${tableName}`;
      if (updatedTask.progressPercentage && updatedTask.progressPercentage > 0) {
        message += ` (${updatedTask.progressPercentage}%)`;
      }
      if (updatedTask.progressDescription) {
        message += `: ${updatedTask.progressDescription}`;
      }

      this.toastService.info(message, 3000);
    }
  }

  private showTaskCompletionNotification(task: AsyncTaskStatus): void {
    const taskName = this.getTaskDisplayName(task.taskType);
    const tableName = task.metadataTableName ? ` for "${task.metadataTableName}"` : '';

    if (task.taskType === TaskType.VALIDATE_TABLE) {
      this.handleValidationTaskCompletion(task);
      return;
    }

    if (task.taskType === TaskType.IMPORT_SDRF || task.taskType === TaskType.IMPORT_EXCEL) {
      this.handleImportTaskCompletion(task);
      return;
    }

    if (task.taskType === TaskType.REORDER_TABLE_COLUMNS || task.taskType === TaskType.REORDER_TEMPLATE_COLUMNS) {
      this.handleReorderTaskCompletion(task);
      return;
    }

    const progressInfo = task.progressPercentage && task.progressPercentage > 0 ? ` (${task.progressPercentage}%)` : '';
    const progressDesc = task.progressDescription ? `: ${task.progressDescription}` : '';

    switch (task.status) {
      case TaskStatus.SUCCESS:
        this.toastService.success(
          `Task Completed: ${taskName}${tableName}${progressInfo} completed successfully${progressDesc}`
        );
        break;
      case TaskStatus.FAILURE:
        this.toastService.error(
          `Task Failed: ${taskName}${tableName}${progressInfo} failed: ${task.errorMessage || 'Unknown error'}${progressDesc}`
        );
        break;
      case TaskStatus.CANCELLED:
        this.toastService.warning(
          `Task Cancelled: ${taskName}${tableName}${progressInfo} was cancelled${progressDesc}`
        );
        break;
    }
  }

  getTaskDisplayName(taskType: TaskType): string {
    const typeMap: Record<TaskType, string> = {
      [TaskType.EXPORT_EXCEL]: 'Excel export',
      [TaskType.EXPORT_SDRF]: 'SDRF export',
      [TaskType.IMPORT_SDRF]: 'SDRF import',
      [TaskType.IMPORT_EXCEL]: 'Excel import',
      [TaskType.EXPORT_MULTIPLE_SDRF]: 'Bulk SDRF export',
      [TaskType.EXPORT_MULTIPLE_EXCEL]: 'Bulk Excel export',
      [TaskType.VALIDATE_TABLE]: 'Table validation',
      [TaskType.REORDER_TABLE_COLUMNS]: 'Column reordering',
      [TaskType.REORDER_TEMPLATE_COLUMNS]: 'Template column reordering',
      [TaskType.TRANSCRIBE_AUDIO]: 'Audio transcription',
      [TaskType.TRANSCRIBE_VIDEO]: 'Video transcription',
    };
    return typeMap[taskType] || taskType;
  }

  getTaskStatusClass(status: TaskStatus): string {
    const statusMap: Record<TaskStatus, string> = {
      [TaskStatus.QUEUED]: 'badge-secondary',
      [TaskStatus.STARTED]: 'badge-primary',
      [TaskStatus.SUCCESS]: 'badge-success',
      [TaskStatus.FAILURE]: 'badge-danger',
      [TaskStatus.CANCELLED]: 'badge-warning',
    };
    return statusMap[status] || 'badge-secondary';
  }

  formatDuration(duration: number | null): string {
    if (!duration) {
      return '-';
    }

    if (duration < 60) {
      return `${Math.round(duration)}s`;
    } else if (duration < 3600) {
      return `${Math.round(duration / 60)}m`;
    } else {
      const hours = Math.floor(duration / 3600);
      const minutes = Math.round((duration % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  }

  canCancelTask(status: TaskStatus): boolean {
    return status === TaskStatus.QUEUED || status === TaskStatus.STARTED;
  }

  canDownloadResult(task: AsyncTaskStatus): boolean {
    return task.status === TaskStatus.SUCCESS &&
           (task.taskType === TaskType.EXPORT_EXCEL || task.taskType === TaskType.EXPORT_SDRF ||
            task.taskType === TaskType.EXPORT_MULTIPLE_SDRF || task.taskType === TaskType.EXPORT_MULTIPLE_EXCEL);
  }

  private isImportTask(taskType: TaskType): boolean {
    return taskType === TaskType.IMPORT_SDRF || taskType === TaskType.IMPORT_EXCEL;
  }

  private isExportTask(taskType: TaskType): boolean {
    return taskType === TaskType.EXPORT_SDRF || taskType === TaskType.EXPORT_EXCEL ||
           taskType === TaskType.EXPORT_MULTIPLE_SDRF || taskType === TaskType.EXPORT_MULTIPLE_EXCEL;
  }

  private handleExportTaskCompletion(task: AsyncTaskStatus): void {
    console.log('AsyncTaskUIService: handleExportTaskCompletion called for task:', task.id, 'type:', task.taskType);
    const taskName = this.getTaskDisplayName(task.taskType);
    const tableName = task.metadataTableName ? ` for "${task.metadataTableName}"` : '';

    if (task.taskType === TaskType.EXPORT_SDRF || task.taskType === TaskType.EXPORT_EXCEL) {
      console.log('AsyncTaskUIService: Single export task - starting download in 1500ms');
      setTimeout(() => {
        console.log('AsyncTaskUIService: Calling downloadTaskResult for task:', task.id);
        this.downloadTaskResult(task.id);
      }, 1500);

      this.toastService.success(
        `${taskName}${tableName} completed! Starting download...`,
        4000
      );
    } else {
      console.log('AsyncTaskUIService: Bulk export task - no auto-download');
      this.toastService.success(
        `${taskName}${tableName} completed! Check your downloads.`,
        6000
      );
    }
  }

  private handleValidationTaskCompletion(task: AsyncTaskStatus): void {
    const taskName = this.getTaskDisplayName(task.taskType);
    const tableName = task.metadataTableName ? ` for "${task.metadataTableName}"` : '';
    const progressInfo = task.progressPercentage && task.progressPercentage > 0 ? ` (${task.progressPercentage}%)` : '';
    const progressDesc = task.progressDescription ? `: ${task.progressDescription}` : '';

    switch (task.status) {
      case TaskStatus.SUCCESS:
        const result = task.result as any;
        if (result && result.success === false) {
          const errorCount = result.errors?.length || 0;
          const warningCount = result.warnings?.length || 0;

          this.toastService.error(
            `Validation Failed${progressInfo}: Found ${errorCount} error(s) and ${warningCount} warning(s) in "${task.metadataTableName}". Click to view details.${progressDesc}`,
            10000
          );

          this.showValidationResultsModal(result);
        } else {
          this.toastService.success(
            `Validation Passed${progressInfo}: ${task.metadataTableName} is valid and complies with SDRF format${progressDesc}`
          );

          if (result) {
            this.showValidationResultsModal(result);
          }
        }
        break;
      case TaskStatus.FAILURE:
        this.toastService.error(
          `Validation Error: ${taskName}${tableName} failed: ${task.errorMessage || 'Unknown error'}`
        );
        break;
      case TaskStatus.CANCELLED:
        this.toastService.warning(
          `Validation Cancelled: ${taskName}${tableName} was cancelled`
        );
        break;
    }
  }

  private showValidationResultsModal(validationResults: ValidationResults): void {
    const modalRef = this.modalService.open(ValidationResultsModal, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.componentInstance.results = validationResults;

    modalRef.result.then((result) => {
      if (result === 'edit') {
        console.log('User wants to edit table to fix validation issues');
      }
    }).catch(() => {
      // Modal dismissed
    });
  }

  private handleImportTaskCompletion(task: AsyncTaskStatus): void {
    const taskName = this.getTaskDisplayName(task.taskType);
    const tableName = task.metadataTableName ? ` for "${task.metadataTableName}"` : '';
    const progressInfo = task.progressPercentage && task.progressPercentage > 0 ? ` (${task.progressPercentage}%)` : '';
    const progressDesc = task.progressDescription ? `: ${task.progressDescription}` : '';

    switch (task.status) {
      case TaskStatus.SUCCESS:
        const result = task.result as any;
        let message = `${taskName}${tableName} completed successfully!`;

        if (result) {
          const details = [];
          if (result.columnsCreated || result.totalColumns) {
            details.push(`${result.columnsCreated || result.totalColumns || 0} columns processed`);
          }
          if (result.poolsCreated) {
            details.push(`${result.poolsCreated} pools created`);
          }
          if (result.samplesProcessed) {
            details.push(`${result.samplesProcessed} samples processed`);
          }

          if (details.length > 0) {
            message = `${taskName}${tableName}${progressInfo} completed! ${details.join(', ')}.${progressDesc}`;
          } else {
            message = `${taskName}${tableName}${progressInfo} completed successfully!${progressDesc}`;
          }
        }

        this.toastService.success(message, 6000);
        break;

      case TaskStatus.FAILURE:
        this.toastService.error(
          `${taskName} Failed${progressInfo}: ${task.errorMessage || 'Import failed due to an unknown error'}${progressDesc}`
        );
        break;

      case TaskStatus.CANCELLED:
        this.toastService.warning(
          `${taskName} Cancelled${progressInfo}: Import was cancelled${progressDesc}`
        );
        break;
    }
  }

  private handleReorderTaskCompletion(task: AsyncTaskStatus): void {
    const taskName = this.getTaskDisplayName(task.taskType);
    const tableName = task.metadataTableName ? ` for "${task.metadataTableName}"` : '';
    const progressInfo = task.progressPercentage && task.progressPercentage > 0 ? ` (${task.progressPercentage}%)` : '';
    const progressDesc = task.progressDescription ? `: ${task.progressDescription}` : '';

    switch (task.status) {
      case TaskStatus.SUCCESS:
        const result = task.result as any;
        let message = `${taskName}${tableName} completed successfully!`;

        if (result) {
          const details = [];
          if (result.reorderedColumns) {
            details.push(`${result.reorderedColumns} columns reordered`);
          }
          if (result.reorderedPools) {
            details.push(`${result.reorderedPools} pools updated`);
          }
          if (result.schemaIdsUsed && result.schemaIdsUsed.length > 0) {
            details.push(`using ${result.schemaIdsUsed.length} schema(s)`);
          }

          if (details.length > 0) {
            message += `\n${details.join(', ')}`;
          }
        }

        this.toastService.success(message, 5000);
        break;

      case TaskStatus.FAILURE:
        this.toastService.error(
          `${taskName} Failed: ${task.errorMessage || 'Unknown error'}${progressInfo}${progressDesc}`
        );
        break;

      case TaskStatus.CANCELLED:
        this.toastService.warning(
          `${taskName} Cancelled: ${taskName}${tableName} was cancelled`
        );
        break;
    }
  }
}