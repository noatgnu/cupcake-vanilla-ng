/**
 * Service for managing async tasks
 */

import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, interval } from 'rxjs';
import { takeUntil, switchMap, filter, map } from 'rxjs/operators';
import { 
  AsyncTask, 
  TaskListItem, 
  TaskCreateRequest, 
  TaskCreateResponse, 
  ImportTaskCreateRequest,
  TaskProgressEvent,
  TaskStatus,
  TaskType 
} from '../models/async-task';
import { ApiService } from './api';
import { ToastService } from './toast';
import { Websocket } from './websocket';

@Injectable({
  providedIn: 'root'
})
export class AsyncTaskService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private tasksSubject = new BehaviorSubject<TaskListItem[]>([]);
  private isSubscribed = false;

  public tasks$ = this.tasksSubject.asObservable();
  public activeTasks$ = this.tasks$.pipe(
    map(tasks => tasks.filter(task => task.status === 'QUEUED' || task.status === 'STARTED'))
  );

  constructor(
    private http: HttpClient,
    private api: ApiService,
    private toastService: ToastService,
    private websocket: Websocket
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
      console.log('WebSocket connected, subscribing to async task updates');
      this.websocket.subscribe('async_task_updates');
    });

    // Listen for task update messages
    this.websocket.filterMessages('async_task.update').pipe(
      takeUntil(this.destroy$)
    ).subscribe((message: any) => {
      console.log('Received task update:', message);
      this.handleTaskUpdate(message);
    });

    // Initial load of tasks
    this.getTasks().subscribe(tasks => {
      this.tasksSubject.next(tasks);
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
    return this.http.get<TaskListItem[]>(`${this.api.baseUrl}/async-tasks/`);
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
   * Queue async Excel export
   */
  queueExcelExport(request: TaskCreateRequest): Observable<TaskCreateResponse> {
    return this.http.post<TaskCreateResponse>(
      `${this.api.baseUrl}/async-export/excel_template/`, 
      request
    );
  }

  /**
   * Queue async SDRF export
   */
  queueSdrfExport(request: TaskCreateRequest): Observable<TaskCreateResponse> {
    return this.http.post<TaskCreateResponse>(
      `${this.api.baseUrl}/async-export/sdrf_file/`, 
      request
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

      // Show notification if task just completed
      if (wasRunning && (message.status === 'SUCCESS' || message.status === 'FAILURE' || message.status === 'CANCELLED')) {
        this.showTaskCompletionNotification(updatedTask);
      }
    } else {
      // Task not found, refresh the full list
      this.getTasks().subscribe(tasks => {
        this.tasksSubject.next(tasks);
      });
    }
  }

  /**
   * Show notification when a task completes
   */
  private showTaskCompletionNotification(task: TaskListItem): void {
    const taskName = this.getTaskDisplayName(task.task_type);
    const tableName = task.metadata_table_name ? ` for "${task.metadata_table_name}"` : '';
    
    switch (task.status) {
      case 'SUCCESS':
        this.toastService.success(
          `Task Completed: ${taskName}${tableName} completed successfully`
        );
        break;
      case 'FAILURE':
        this.toastService.error(
          `Task Failed: ${taskName}${tableName} failed: ${task.error_message || 'Unknown error'}`
        );
        break;
      case 'CANCELLED':
        this.toastService.warning(
          `Task Cancelled: ${taskName}${tableName} was cancelled`
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
           (task.task_type === 'EXPORT_EXCEL' || task.task_type === 'EXPORT_SDRF');
  }
}