import { Injectable, OnDestroy, inject } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { takeUntil, filter, map, tap } from 'rxjs/operators';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  AsyncTaskStatus,
  AsyncTaskCreateResponse,
  MetadataImportRequest,
  MetadataExportRequest,
  BulkExportRequest,
  BulkExcelExportRequest,
  MetadataValidationRequest,
  AsyncTaskService as LibraryAsyncTaskService,
  AsyncExportService,
  AsyncImportService,
  AsyncValidationService
} from '../models';
import { ToastService } from './toast';
import { Websocket } from './websocket';
import { ValidationResultsModal, ValidationResults } from '../components/validation-results-modal/validation-results-modal';

@Injectable({
  providedIn: 'root'
})
export class AsyncTaskService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private tasksSubject = new BehaviorSubject<AsyncTaskStatus[]>([]);
  private isSubscribed = false;
  private metadataTableRefreshSubject = new Subject<number>();
  private taskCompletedSubject = new Subject<AsyncTaskStatus>();
  private exportTaskCompletedSubject = new Subject<AsyncTaskStatus>();

  private readonly sessionId = this.generateSessionId();
  private initiatedTasks = new Set<string>();

  private libraryAsyncTaskService = inject(LibraryAsyncTaskService);
  private asyncExportService = inject(AsyncExportService);
  private asyncImportService = inject(AsyncImportService);
  private asyncValidationService = inject(AsyncValidationService);
  private toastService = inject(ToastService);
  private websocket = inject(Websocket);
  private modalService = inject(NgbModal);

  public tasks$ = this.tasksSubject.asObservable();
  public activeTasks$ = this.tasks$.pipe(
    map(tasks => {
      const taskArray = Array.isArray(tasks) ? tasks : [];
      return taskArray.filter(task => task.status === 'QUEUED' || task.status === 'STARTED');
    })
  );

  public metadataTableRefresh$ = this.metadataTableRefreshSubject.asObservable();
  public taskCompleted$ = this.taskCompletedSubject.asObservable();
  public exportTaskCompleted$ = this.exportTaskCompletedSubject.asObservable();

  constructor() {
    this.initializeService();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeService(): void {
    this.startRealtimeUpdates();
  }

  startRealtimeUpdates(): void {
    if (this.isSubscribed) {
      return;
    }

    this.isSubscribed = true;

    if (!this.websocket.connectionState$() || this.websocket.connectionState$() === 'disconnected') {
      this.websocket.connect();
    }

    this.websocket.isConnected$.pipe(
      takeUntil(this.destroy$),
      filter(connected => connected)
    ).subscribe(() => {
      this.websocket.subscribe('async_task_updates');
    });

    this.websocket.filterMessages('async_task.update').pipe(
      takeUntil(this.destroy$)
    ).subscribe((message: any) => {
      this.handleTaskUpdate(message);
    });

    this.getTasks().subscribe({
      next: tasks => {
        const taskArray = Array.isArray(tasks) ? tasks : [];
        this.tasksSubject.next(taskArray);
      },
      error: error => {
        console.error('Error loading initial tasks:', error);
      }
    });
  }

  stopRealtimeUpdates(): void {
    this.isSubscribed = false;
    this.destroy$.next();
  }

  getTasks(): Observable<AsyncTaskStatus[]> {
    return this.libraryAsyncTaskService.getAsyncTasks().pipe(
      map(response => response.results || [])
    );
  }

  getTask(taskId: string): Observable<AsyncTaskStatus> {
    return this.libraryAsyncTaskService.getAsyncTask(taskId);
  }

  cancelTask(taskId: string): Observable<{message: string}> {
    return this.libraryAsyncTaskService.cancelTask(taskId);
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private isTaskInitiatedByThisTab(taskId: string): boolean {
    return this.initiatedTasks.has(taskId);
  }

  /**
   * Mark a task as initiated by this tab for tracking purposes
   */
  monitorTask(taskId: string): void {
    this.initiatedTasks.add(taskId);
  }

  queueExcelExport(request: MetadataExportRequest): Observable<AsyncTaskCreateResponse> {
    return this.asyncExportService.excelTemplate(request).pipe(
      tap(response => {
        this.initiatedTasks.add(response.taskId);
      })
    );
  }

  queueSdrfExport(request: MetadataExportRequest): Observable<AsyncTaskCreateResponse> {
    return this.asyncExportService.sdrfFile(request).pipe(
      tap(response => {
        this.initiatedTasks.add(response.taskId);
      })
    );
  }

  queueSdrfImport(request: MetadataImportRequest): Observable<AsyncTaskCreateResponse> {
    return this.asyncImportService.sdrfFile(request).pipe(
      tap(response => {
        this.initiatedTasks.add(response.taskId);
      })
    );
  }

  queueExcelImport(request: MetadataImportRequest): Observable<AsyncTaskCreateResponse> {
    return this.asyncImportService.excelFile(request);
  }

  queueBulkSdrfExport(request: BulkExportRequest): Observable<AsyncTaskCreateResponse> {
    return this.asyncExportService.multipleSdrfFiles(request).pipe(
      tap(response => {
        this.initiatedTasks.add(response.taskId);
      })
    );
  }

  queueBulkExcelExport(request: BulkExcelExportRequest): Observable<AsyncTaskCreateResponse> {
    return this.asyncExportService.multipleExcelTemplates(request);
  }

  downloadTaskResult(taskId: string): void {
    this.libraryAsyncTaskService.getDownloadUrl(taskId).subscribe({
      next: (response) => {
        window.open(response.downloadUrl, '_blank');
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
      })
    );
  }

  private handleTaskUpdate(message: any): void {
    const taskId = message.task_id;
    const currentTasks = this.tasksSubject.value;
    const existingTaskIndex = currentTasks.findIndex(t => t.id === taskId);

    if (existingTaskIndex >= 0) {
      const existingTask = currentTasks[existingTaskIndex];
      const wasRunning = existingTask.status === 'QUEUED' || existingTask.status === 'STARTED';

      const updatedTask: AsyncTaskStatus = {
        ...existingTask,
        status: message.status,
        progressPercentage: message.progress_percentage || existingTask.progressPercentage,
        progressDescription: message.progress_description || existingTask.progressDescription,
        errorMessage: message.error_message || existingTask.errorMessage,
        result: message.result || existingTask.result,
      };

      const updatedTasks = [...currentTasks];
      updatedTasks[existingTaskIndex] = updatedTask;
      this.tasksSubject.next(updatedTasks);

      if (message.status === 'STARTED') {
        this.showTaskProgressNotification(updatedTask, existingTask);
      }

      if (wasRunning && (message.status === 'SUCCESS' || message.status === 'FAILURE' || message.status === 'CANCELLED')) {
        this.showTaskCompletionNotification(updatedTask);
        
        const isTaskFromThisTab = this.isTaskInitiatedByThisTab(updatedTask.id);
        this.taskCompletedSubject.next(updatedTask);

        if (message.status === 'SUCCESS') {
          if (this.isImportTask(updatedTask.taskType) && updatedTask.metadataTable) {
            this.metadataTableRefreshSubject.next(updatedTask.metadataTable);
          }

          if (this.isExportTask(updatedTask.taskType)) {
            this.exportTaskCompletedSubject.next(updatedTask);
            this.handleExportTaskCompletion(updatedTask);
          }

          if (updatedTask.taskType === 'VALIDATE_TABLE' && updatedTask.metadataTable) {
            this.metadataTableRefreshSubject.next(updatedTask.metadataTable);
          }

          if ((updatedTask.taskType === 'REORDER_TABLE_COLUMNS') && updatedTask.metadataTable) {
            this.metadataTableRefreshSubject.next(updatedTask.metadataTable);
          }
        }

        if (isTaskFromThisTab) {
          this.initiatedTasks.delete(updatedTask.id);
        }
      }
    } else {
      this.getTasks().subscribe(tasks => {
        const taskArray = Array.isArray(tasks) ? tasks : [];
        this.tasksSubject.next(taskArray);

        const refreshedTask = taskArray.find(t => t.id === taskId);
        if (refreshedTask && (message.status === 'SUCCESS' || message.status === 'FAILURE' || message.status === 'CANCELLED')) {
          this.showTaskCompletionNotification(refreshedTask);
          
          const isTaskFromThisTab = this.isTaskInitiatedByThisTab(refreshedTask.id);
          this.taskCompletedSubject.next(refreshedTask);

          if (message.status === 'SUCCESS') {
            if (this.isImportTask(refreshedTask.taskType) && refreshedTask.metadataTable) {
              this.metadataTableRefreshSubject.next(refreshedTask.metadataTable);
            }

            if (this.isExportTask(refreshedTask.taskType)) {
              this.exportTaskCompletedSubject.next(refreshedTask);
              this.handleExportTaskCompletion(refreshedTask);
            }

            if (refreshedTask.taskType === 'VALIDATE_TABLE' && refreshedTask.metadataTable) {
              this.metadataTableRefreshSubject.next(refreshedTask.metadataTable);
            }

            if ((refreshedTask.taskType === 'REORDER_TABLE_COLUMNS') && refreshedTask.metadataTable) {
              this.metadataTableRefreshSubject.next(refreshedTask.metadataTable);
            }
          }

          if (isTaskFromThisTab) {
            this.initiatedTasks.delete(refreshedTask.id);
          }
        }
      });
    }
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

    if (task.taskType === 'VALIDATE_TABLE') {
      this.handleValidationTaskCompletion(task);
      return;
    }

    if (task.taskType === 'IMPORT_SDRF' || task.taskType === 'IMPORT_EXCEL') {
      this.handleImportTaskCompletion(task);
      return;
    }

    if (task.taskType === 'REORDER_TABLE_COLUMNS' || task.taskType === 'REORDER_TEMPLATE_COLUMNS') {
      this.handleReorderTaskCompletion(task);
      return;
    }

    const progressInfo = task.progressPercentage && task.progressPercentage > 0 ? ` (${task.progressPercentage}%)` : '';
    const progressDesc = task.progressDescription ? `: ${task.progressDescription}` : '';

    switch (task.status) {
      case 'SUCCESS':
        this.toastService.success(
          `Task Completed: ${taskName}${tableName}${progressInfo} completed successfully${progressDesc}`
        );
        break;
      case 'FAILURE':
        this.toastService.error(
          `Task Failed: ${taskName}${tableName}${progressInfo} failed: ${task.errorMessage || 'Unknown error'}${progressDesc}`
        );
        break;
      case 'CANCELLED':
        this.toastService.warning(
          `Task Cancelled: ${taskName}${tableName}${progressInfo} was cancelled${progressDesc}`
        );
        break;
    }
  }

  getTaskDisplayName(taskType: string): string {
    const typeMap: Record<string, string> = {
      'EXPORT_EXCEL': 'Excel export',
      'EXPORT_SDRF': 'SDRF export',
      'IMPORT_SDRF': 'SDRF import',
      'IMPORT_EXCEL': 'Excel import',
      'EXPORT_MULTIPLE_SDRF': 'Bulk SDRF export',
      'EXPORT_MULTIPLE_EXCEL': 'Bulk Excel export',
      'VALIDATE_TABLE': 'Table validation',
      'REORDER_TABLE_COLUMNS': 'Column reordering',
      'REORDER_TEMPLATE_COLUMNS': 'Template column reordering',
    };
    return typeMap[taskType] || taskType;
  }

  getTaskStatusClass(status: string): string {
    const statusMap: Record<string, string> = {
      'QUEUED': 'badge-secondary',
      'STARTED': 'badge-primary',
      'SUCCESS': 'badge-success',
      'FAILURE': 'badge-danger',
      'CANCELLED': 'badge-warning',
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

  canCancelTask(status: string): boolean {
    return status === 'QUEUED' || status === 'STARTED';
  }

  canDownloadResult(task: AsyncTaskStatus): boolean {
    return task.status === 'SUCCESS' &&
           (task.taskType === 'EXPORT_EXCEL' || task.taskType === 'EXPORT_SDRF' ||
            task.taskType === 'EXPORT_MULTIPLE_SDRF' || task.taskType === 'EXPORT_MULTIPLE_EXCEL');
  }

  private isImportTask(taskType: string): boolean {
    return taskType === 'IMPORT_SDRF' || taskType === 'IMPORT_EXCEL';
  }

  private isExportTask(taskType: string): boolean {
    return taskType === 'EXPORT_SDRF' || taskType === 'EXPORT_EXCEL' ||
           taskType === 'EXPORT_MULTIPLE_SDRF' || taskType === 'EXPORT_MULTIPLE_EXCEL';
  }

  private handleExportTaskCompletion(task: AsyncTaskStatus): void {
    const taskName = this.getTaskDisplayName(task.taskType);
    const tableName = task.metadataTableName ? ` for "${task.metadataTableName}"` : '';

    if (task.taskType === 'EXPORT_SDRF' || task.taskType === 'EXPORT_EXCEL') {
      setTimeout(() => {
        this.downloadTaskResult(task.id);
      }, 1500);

      this.toastService.success(
        `${taskName}${tableName} completed! Starting download...`,
        4000
      );
    } else {
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
      case 'SUCCESS':
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
      case 'FAILURE':
        this.toastService.error(
          `Validation Error: ${taskName}${tableName} failed: ${task.errorMessage || 'Unknown error'}`
        );
        break;
      case 'CANCELLED':
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
      case 'SUCCESS':
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

      case 'FAILURE':
        this.toastService.error(
          `${taskName} Failed${progressInfo}: ${task.errorMessage || 'Import failed due to an unknown error'}${progressDesc}`
        );
        break;

      case 'CANCELLED':
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
      case 'SUCCESS':
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

      case 'FAILURE':
        this.toastService.error(
          `${taskName} Failed: ${task.errorMessage || 'Unknown error'}${progressInfo}${progressDesc}`
        );
        break;

      case 'CANCELLED':
        this.toastService.warning(
          `${taskName} Cancelled: ${taskName}${tableName} was cancelled`
        );
        break;
    }
  }
}