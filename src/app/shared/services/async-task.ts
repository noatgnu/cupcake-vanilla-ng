/**
 * Service for managing async tasks
 */

import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, interval } from 'rxjs';
import { takeUntil, switchMap, filter, map, tap } from 'rxjs/operators';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  AsyncTask,
  TaskListItem,
  TaskCreateRequest,
  TaskCreateResponse,
  ImportTaskCreateRequest,
  BulkExportTaskCreateRequest,
  BulkExcelExportTaskCreateRequest,
  ValidationTaskCreateRequest,
  TaskProgressEvent,
  TaskStatus,
  TaskType
} from '../models/async-task';
import { ApiService } from './api';
import { ToastService } from './toast';
import { Websocket } from './websocket';
import { ValidationResultsModal, ValidationResults } from '../components/validation-results-modal/validation-results-modal';

@Injectable({
  providedIn: 'root'
})
export class AsyncTaskService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private tasksSubject = new BehaviorSubject<TaskListItem[]>([]);
  private isSubscribed = false;
  private metadataTableRefreshSubject = new Subject<number>();
  private taskCompletedSubject = new Subject<TaskListItem>();
  private exportTaskCompletedSubject = new Subject<TaskListItem>();

  // Track which tasks were initiated by this browser tab/session
  private readonly sessionId = this.generateSessionId();
  private initiatedTasks = new Set<string>();

  public tasks$ = this.tasksSubject.asObservable();
  public activeTasks$ = this.tasks$.pipe(
    map(tasks => {
      // Ensure tasks is always an array before filtering
      const taskArray = Array.isArray(tasks) ? tasks : [];
      return taskArray.filter(task => task.status === 'QUEUED' || task.status === 'STARTED');
    })
  );

  // Observable for metadata table refresh events (emits table ID when import completes)
  public metadataTableRefresh$ = this.metadataTableRefreshSubject.asObservable();

  // Observable for any task completion
  public taskCompleted$ = this.taskCompletedSubject.asObservable();

  // Observable for export task completion (triggers download)
  public exportTaskCompleted$ = this.exportTaskCompletedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private api: ApiService,
    private toastService: ToastService,
    private websocket: Websocket,
    private modalService: NgbModal
  ) {
    // Initialize the service immediately
    this.initializeService();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize the service - called immediately in constructor
   */
  private initializeService(): void {
    this.startRealtimeUpdates();
  }

  /**
   * Start subscribing to task status updates via WebSocket
   */
  startRealtimeUpdates(): void {
    if (this.isSubscribed) {
      return;
    }

    this.isSubscribed = true;

    // Ensure WebSocket is connected
    if (!this.websocket.connectionState$() || this.websocket.connectionState$() === 'disconnected') {
      this.websocket.connect();
    }

    // Subscribe to async task updates when WebSocket connects
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

    // Initial load of tasks
    this.getTasks().subscribe({
      next: tasks => {
        // Ensure tasks is always an array
        const taskArray = Array.isArray(tasks) ? tasks : [];
        this.tasksSubject.next(taskArray);
      },
      error: error => {
        console.error('Error loading initial tasks:', error);
      }
    });
  }

  /**
   * Stop subscribing to task updates
   */
  stopRealtimeUpdates(): void {
    this.isSubscribed = false;
    this.destroy$.next();
  }

  /**
   * Get list of user's tasks
   */
  getTasks(): Observable<TaskListItem[]> {
    return this.http.get<{count: number; results: TaskListItem[]}>(`${this.api.baseUrl}/async-tasks/`).pipe(
      map(response => response.results || [])
    );
  }

  /**
   * Get specific task details
   */
  getTask(taskId: string): Observable<AsyncTask> {
    return this.http.get<AsyncTask>(`${this.api.baseUrl}/async-tasks/${taskId}/`);
  }

  /**
   * Cancel a task
   */
  cancelTask(taskId: string): Observable<{message: string}> {
    return this.http.delete<{message: string}>(`${this.api.baseUrl}/async-tasks/${taskId}/cancel/`);
  }

  /**
   * Generate a unique session ID for this browser tab
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if a task was initiated by this browser tab/session
   */
  private isTaskInitiatedByThisTab(taskId: string): boolean {
    return this.initiatedTasks.has(taskId);
  }

  /**
   * Queue async Excel export
   */
  queueExcelExport(request: TaskCreateRequest): Observable<TaskCreateResponse> {
    return this.http.post<TaskCreateResponse>(
      `${this.api.baseUrl}/async-export/excel_template/`,
      request
    ).pipe(
      map(response => {
        // Track that this task was initiated by this tab
        this.initiatedTasks.add(response.task_id);
        return response;
      })
    );
  }

  /**
   * Queue async SDRF export
   */
  queueSdrfExport(request: TaskCreateRequest): Observable<TaskCreateResponse> {
    return this.http.post<TaskCreateResponse>(
      `${this.api.baseUrl}/async-export/sdrf_file/`,
      request
    ).pipe(
      tap(response => {
        // Track that this task was initiated by this tab
        this.initiatedTasks.add(response.task_id);
      })
    );
  }

  /**
   * Queue async SDRF import
   */
  queueSdrfImport(request: ImportTaskCreateRequest): Observable<TaskCreateResponse> {
    const formData = new FormData();
    formData.append('metadata_table_id', request.metadata_table_id.toString());
    formData.append('file', request.file);

    if (request.replace_existing !== undefined) {
      formData.append('replace_existing', request.replace_existing.toString());
    }
    if (request.validate_ontologies !== undefined) {
      formData.append('validate_ontologies', request.validate_ontologies.toString());
    }

    return this.http.post<TaskCreateResponse>(
      `${this.api.baseUrl}/async-import/sdrf_file/`,
      formData
    ).pipe(
      tap(response => {
        // Track that this task was initiated by this tab
        this.initiatedTasks.add(response.task_id);
      })
    );
  }

  /**
   * Queue async Excel import
   */
  queueExcelImport(request: ImportTaskCreateRequest): Observable<TaskCreateResponse> {
    const formData = new FormData();
    formData.append('metadata_table_id', request.metadata_table_id.toString());
    formData.append('file', request.file);

    if (request.replace_existing !== undefined) {
      formData.append('replace_existing', request.replace_existing.toString());
    }
    if (request.validate_ontologies !== undefined) {
      formData.append('validate_ontologies', request.validate_ontologies.toString());
    }

    return this.http.post<TaskCreateResponse>(
      `${this.api.baseUrl}/async-import/excel_file/`,
      formData
    );
  }

  /**
   * Queue async bulk SDRF export
   */
  queueBulkSdrfExport(request: BulkExportTaskCreateRequest): Observable<TaskCreateResponse> {
    return this.http.post<TaskCreateResponse>(
      `${this.api.baseUrl}/async-export/multiple_sdrf_files/`,
      request
    ).pipe(
      tap(response => {
        // Track that this task was initiated by this tab
        this.initiatedTasks.add(response.task_id);
      })
    );
  }

  /**
   * Queue async bulk Excel export
   */
  queueBulkExcelExport(request: BulkExcelExportTaskCreateRequest): Observable<TaskCreateResponse> {
    return this.http.post<TaskCreateResponse>(
      `${this.api.baseUrl}/async-export/multiple_excel_templates/`,
      request
    );
  }

  /**
   * Download task result file by opening signed URL
   */
  downloadTaskResult(taskId: string): void {
    this.http.get<{download_url: string; filename: string}>(
      `${this.api.baseUrl}/async-tasks/${taskId}/download_url/`
    ).subscribe({
      next: (response) => {
        // Open signed URL in new tab - nginx handles X-Accel-Redirect
        window.open(response.download_url, '_blank');
      },
      error: (error) => {
        console.error('Error getting download URL:', error);
        this.toastService.error('Failed to get download URL');
      }
    });
  }

  /**
   * Handle WebSocket task update message
   */
  private handleTaskUpdate(message: any): void {
    const taskId = message.task_id;
    const currentTasks = this.tasksSubject.value;
    const existingTaskIndex = currentTasks.findIndex(t => t.id === taskId);

    if (existingTaskIndex >= 0) {
      // Update existing task
      const existingTask = currentTasks[existingTaskIndex];
      const wasRunning = existingTask.status === 'QUEUED' || existingTask.status === 'STARTED';

      const updatedTask: TaskListItem = {
        ...existingTask,
        status: message.status,
        progress_percentage: message.progress_percentage || existingTask.progress_percentage,
        progress_description: message.progress_description || existingTask.progress_description,
        error_message: message.error_message || existingTask.error_message,
        result: message.result || existingTask.result,
      };

      const updatedTasks = [...currentTasks];
      updatedTasks[existingTaskIndex] = updatedTask;
      this.tasksSubject.next(updatedTasks);

      // Show progress notification for running tasks with significant progress
      if (message.status === 'STARTED') {
        this.showTaskProgressNotification(updatedTask, existingTask);
      }

      // Show notification if task just completed
      if (wasRunning && (message.status === 'SUCCESS' || message.status === 'FAILURE' || message.status === 'CANCELLED')) {
        // Always show notifications (user might want to know about all their tasks)
        this.showTaskCompletionNotification(updatedTask);

        // Check if task was initiated by this tab for cleanup purposes
        const isTaskFromThisTab = this.isTaskInitiatedByThisTab(updatedTask.id);

        // Emit general task completion event
        this.taskCompletedSubject.next(updatedTask);

        // Handle successful task completions
        if (message.status === 'SUCCESS') {
          // Emit table refresh event for successful import tasks
          if (this.isImportTask(updatedTask.task_type) && updatedTask.metadata_table_id) {
            this.metadataTableRefreshSubject.next(updatedTask.metadata_table_id);
          }

          // Emit export completion event for successful export tasks (auto-download)
          if (this.isExportTask(updatedTask.task_type)) {
            this.exportTaskCompletedSubject.next(updatedTask);
            // Auto-download export results
            this.handleExportTaskCompletion(updatedTask);
          }

          // Emit table refresh event for validation tasks (to refresh validation status)
          if (updatedTask.task_type === 'VALIDATE_TABLE' && updatedTask.metadata_table_id) {
            this.metadataTableRefreshSubject.next(updatedTask.metadata_table_id);
          }
        }

        // Clean up tracking after task completion (only if task was from this tab)
        if (isTaskFromThisTab) {
          this.initiatedTasks.delete(updatedTask.id);
        }
      }
    } else {
      // Task not found in current list, refresh the full list and then process the update
      this.getTasks().subscribe(tasks => {
        // Ensure tasks is always an array
        const taskArray = Array.isArray(tasks) ? tasks : [];
        this.tasksSubject.next(taskArray);

        // After refresh, check if this was a completion event and handle it
        const refreshedTask = taskArray.find(t => t.id === taskId);
        if (refreshedTask && (message.status === 'SUCCESS' || message.status === 'FAILURE' || message.status === 'CANCELLED')) {
          // Show notification for completed task
          this.showTaskCompletionNotification(refreshedTask);

          // Check if task was initiated by this tab for cleanup purposes
          const isTaskFromThisTab = this.isTaskInitiatedByThisTab(refreshedTask.id);

          // Emit general task completion event
          this.taskCompletedSubject.next(refreshedTask);

          // Handle successful task completions
          if (message.status === 'SUCCESS') {
            // Emit table refresh event for successful import tasks
            if (this.isImportTask(refreshedTask.task_type) && refreshedTask.metadata_table_id) {
              this.metadataTableRefreshSubject.next(refreshedTask.metadata_table_id);
            }

            // Emit export completion event for successful export tasks (auto-download)
            if (this.isExportTask(refreshedTask.task_type)) {
              this.exportTaskCompletedSubject.next(refreshedTask);
              // Auto-download export results
              this.handleExportTaskCompletion(refreshedTask);
            }

            // Emit table refresh event for validation tasks (to refresh validation status)
            if (refreshedTask.task_type === 'VALIDATE_TABLE' && refreshedTask.metadata_table_id) {
              this.metadataTableRefreshSubject.next(refreshedTask.metadata_table_id);
            }
          }

          // Clean up tracking after task completion (only if task was from this tab)
          if (isTaskFromThisTab) {
            this.initiatedTasks.delete(refreshedTask.id);
          }
        }
      });
    }
  }

  /**
   * Show progress notification for running tasks
   */
  private showTaskProgressNotification(updatedTask: TaskListItem, previousTask: TaskListItem): void {
    const taskName = this.getTaskDisplayName(updatedTask.task_type);
    const tableName = updatedTask.metadata_table_name ? ` for "${updatedTask.metadata_table_name}"` : '';

    // Only show progress notifications for significant progress changes (every 25%)
    // or if there's a new progress description
    const progressChanged = Math.floor(updatedTask.progress_percentage / 25) !== Math.floor(previousTask.progress_percentage / 25);
    const descriptionChanged = updatedTask.progress_description !== previousTask.progress_description;

    if (progressChanged || (descriptionChanged && updatedTask.progress_description)) {
      let message = `${taskName}${tableName}`;
      if (updatedTask.progress_percentage > 0) {
        message += ` (${updatedTask.progress_percentage}%)`;
      }
      if (updatedTask.progress_description) {
        message += `: ${updatedTask.progress_description}`;
      }

      this.toastService.info(message, 3000); // Shorter duration for progress updates
    }
  }

  /**
   * Show notification when a task completes
   */
  private showTaskCompletionNotification(task: TaskListItem): void {
    const taskName = this.getTaskDisplayName(task.task_type);
    const tableName = task.metadata_table_name ? ` for "${task.metadata_table_name}"` : '';

    // Special handling for validation tasks
    if (task.task_type === 'VALIDATE_TABLE') {
      this.handleValidationTaskCompletion(task);
      return;
    }

    // Special handling for import tasks
    if (task.task_type === 'IMPORT_SDRF' || task.task_type === 'IMPORT_EXCEL') {
      this.handleImportTaskCompletion(task);
      return;
    }

    // Add progress information to completion messages
    const progressInfo = task.progress_percentage > 0 ? ` (${task.progress_percentage}%)` : '';
    const progressDesc = task.progress_description ? `: ${task.progress_description}` : '';

    switch (task.status) {
      case 'SUCCESS':
        this.toastService.success(
          `Task Completed: ${taskName}${tableName}${progressInfo} completed successfully${progressDesc}`
        );
        break;
      case 'FAILURE':
        this.toastService.error(
          `Task Failed: ${taskName}${tableName}${progressInfo} failed: ${task.error_message || 'Unknown error'}${progressDesc}`
        );
        break;
      case 'CANCELLED':
        this.toastService.warning(
          `Task Cancelled: ${taskName}${tableName}${progressInfo} was cancelled${progressDesc}`
        );
        break;
    }
  }

  /**
   * Get display name for task type
   */
  getTaskDisplayName(taskType: TaskType): string {
    const typeMap: Record<TaskType, string> = {
      'EXPORT_EXCEL': 'Excel export',
      'EXPORT_SDRF': 'SDRF export',
      'IMPORT_SDRF': 'SDRF import',
      'IMPORT_EXCEL': 'Excel import',
      'EXPORT_MULTIPLE_SDRF': 'Bulk SDRF export',
      'EXPORT_MULTIPLE_EXCEL': 'Bulk Excel export',
      'VALIDATE_TABLE': 'Table validation',
    };
    return typeMap[taskType] || taskType;
  }

  /**
   * Get task status badge class
   */
  getTaskStatusClass(status: TaskStatus): string {
    const statusMap: Record<TaskStatus, string> = {
      'QUEUED': 'badge-secondary',
      'STARTED': 'badge-primary',
      'SUCCESS': 'badge-success',
      'FAILURE': 'badge-danger',
      'CANCELLED': 'badge-warning',
    };
    return statusMap[status] || 'badge-secondary';
  }

  /**
   * Format task duration for display
   */
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

  /**
   * Check if a task can be cancelled
   */
  canCancelTask(status: TaskStatus): boolean {
    return status === 'QUEUED' || status === 'STARTED';
  }

  /**
   * Check if a task result can be downloaded
   */
  canDownloadResult(task: TaskListItem): boolean {
    return task.status === 'SUCCESS' &&
           (task.task_type === 'EXPORT_EXCEL' || task.task_type === 'EXPORT_SDRF' ||
            task.task_type === 'EXPORT_MULTIPLE_SDRF' || task.task_type === 'EXPORT_MULTIPLE_EXCEL');
  }

  /**
   * Check if a task type is an import task
   */
  private isImportTask(taskType: TaskType): boolean {
    return taskType === 'IMPORT_SDRF' || taskType === 'IMPORT_EXCEL';
  }

  /**
   * Check if a task type is an export task
   */
  private isExportTask(taskType: TaskType): boolean {
    return taskType === 'EXPORT_SDRF' || taskType === 'EXPORT_EXCEL' ||
           taskType === 'EXPORT_MULTIPLE_SDRF' || taskType === 'EXPORT_MULTIPLE_EXCEL';
  }

  /**
   * Validate a metadata table asynchronously
   */
  validateMetadataTable(validationRequest: ValidationTaskCreateRequest): Observable<TaskCreateResponse> {
    const url = `${this.api.baseUrl}/async-validation/metadata_table/`;

    const payload = {
      ...validationRequest,
      async_processing: true // Force async processing
    };

    return this.http.post<TaskCreateResponse>(url, payload).pipe(
      tap(response => {
        // Track that this task was initiated by this tab
        this.initiatedTasks.add(response.task_id);
      })
    );
  }

  /**
   * Handle export task completion for this tab (auto-download)
   */
  private handleExportTaskCompletion(task: TaskListItem): void {
    const taskName = this.getTaskDisplayName(task.task_type);
    const tableName = task.metadata_table_name ? ` for "${task.metadata_table_name}"` : '';

    // Show enhanced notification with immediate download for single exports
    if (task.task_type === 'EXPORT_SDRF' || task.task_type === 'EXPORT_EXCEL') {
      // Auto-download single file exports after a short delay
      setTimeout(() => {
        this.downloadTaskResult(task.id);
      }, 1500); // 1.5 second delay to let user see the completion notification

      this.toastService.success(
        `${taskName}${tableName} completed! Starting download...`,
        4000
      );
    } else {
      // Bulk exports - just notify, don't auto-download
      this.toastService.success(
        `${taskName}${tableName} completed! Check your downloads.`,
        6000
      );
    }
  }

  /**
   * Handle validation task completion with special logic for validation results
   */
  private handleValidationTaskCompletion(task: TaskListItem): void {
    const taskName = this.getTaskDisplayName(task.task_type);
    const tableName = task.metadata_table_name ? ` for "${task.metadata_table_name}"` : '';
    const progressInfo = task.progress_percentage > 0 ? ` (${task.progress_percentage}%)` : '';
    const progressDesc = task.progress_description ? `: ${task.progress_description}` : '';

    switch (task.status) {
      case 'SUCCESS':
        // Check if validation actually passed or failed
        const result = task.result as any;
        if (result && result.success === false) {
          // Validation completed but found errors
          const errorCount = result.errors?.length || 0;
          const warningCount = result.warnings?.length || 0;

          this.toastService.error(
            `Validation Failed${progressInfo}: Found ${errorCount} error(s) and ${warningCount} warning(s) in "${task.metadata_table_name}". Click to view details.${progressDesc}`,
            10000 // Show for 10 seconds
          );

          // Show validation results modal
          this.showValidationResultsModal(result);
        } else {
          // Validation passed successfully
          this.toastService.success(
            `Validation Passed${progressInfo}: ${task.metadata_table_name} is valid and complies with SDRF format${progressDesc}`
          );

          // Show success modal as well
          if (result) {
            this.showValidationResultsModal(result);
          }
        }
        break;
      case 'FAILURE':
        this.toastService.error(
          `Validation Error: ${taskName}${tableName} failed: ${task.error_message || 'Unknown error'}`
        );
        break;
      case 'CANCELLED':
        this.toastService.warning(
          `Validation Cancelled: ${taskName}${tableName} was cancelled`
        );
        break;
    }
  }

  /**
   * Show validation results modal
   */
  private showValidationResultsModal(validationResults: ValidationResults): void {
    const modalRef = this.modalService.open(ValidationResultsModal, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.componentInstance.results = validationResults;

    modalRef.result.then((result) => {
      if (result === 'edit') {
        // User wants to fix issues - could navigate to table edit view
        console.log('User wants to edit table to fix validation issues');
      }
    }).catch(() => {
      // Modal dismissed
    });
  }

  /**
   * Handle import task completion with appropriate notifications
   */
  private handleImportTaskCompletion(task: TaskListItem): void {
    const taskName = this.getTaskDisplayName(task.task_type);
    const tableName = task.metadata_table_name ? ` for "${task.metadata_table_name}"` : '';
    const progressInfo = task.progress_percentage > 0 ? ` (${task.progress_percentage}%)` : '';
    const progressDesc = task.progress_description ? `: ${task.progress_description}` : '';

    switch (task.status) {
      case 'SUCCESS':
        // Import completed successfully
        const result = task.result as any;
        let message = `${taskName}${tableName} completed successfully!`;

        // Add details if available in result
        if (result) {
          const details = [];
          if (result.columns_created || result.total_columns) {
            details.push(`${result.columns_created || result.total_columns || 0} columns processed`);
          }
          if (result.pools_created) {
            details.push(`${result.pools_created} pools created`);
          }
          if (result.samples_processed) {
            details.push(`${result.samples_processed} samples processed`);
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
          `${taskName} Failed${progressInfo}: ${task.error_message || 'Import failed due to an unknown error'}${progressDesc}`
        );
        break;

      case 'CANCELLED':
        this.toastService.warning(
          `${taskName} Cancelled${progressInfo}: Import was cancelled${progressDesc}`
        );
        break;
    }
  }
}
