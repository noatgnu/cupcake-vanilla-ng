import { Injectable, OnDestroy, inject, signal, computed, effect, untracked } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AsyncTaskStatus, TaskStatus, TaskResultData, PaginatedResponse } from '../models';
import { BaseApiService } from './base-api';
import { WebSocketService, WebSocketMessage } from './websocket';

const TERMINAL_STATUSES = new Set<TaskStatus>([TaskStatus.SUCCESS, TaskStatus.FAILURE, TaskStatus.CANCELLED]);

interface TaskUpdateMessage extends WebSocketMessage {
  task_id: string;
  status: TaskStatus;
  progress_percentage?: number;
  progress_description?: string;
  error_message?: string;
  result?: TaskResultData;
}

interface HttpError {
  status?: number;
  message?: string;
  error?: unknown;
}

@Injectable({
  providedIn: 'root'
})
export class AsyncTaskMonitorService extends BaseApiService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private _tasks = signal<AsyncTaskStatus[]>([]);
  private _isSubscribed = signal(false);

  private websocket = inject(WebSocketService);

  constructor() {
    super();

    effect(() => {
      const isConnected = this.websocket.isConnected();
      const isSubscribed = this._isSubscribed();
      
      if (isConnected && isSubscribed) {
        untracked(() => {
          this.websocket.subscribe('async_task_updates');
        });
      }
    });
  }

  public tasks = this._tasks.asReadonly();
  
  public activeTasks = computed(() => {
    const taskArray = this._tasks();
    return taskArray.filter(task => task.status === TaskStatus.QUEUED || task.status === TaskStatus.STARTED);
  });

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  startRealtimeUpdates(): void {
    if (this._isSubscribed()) {
      return;
    }

    this._isSubscribed.set(true);

    this.websocket.filterMessages<TaskUpdateMessage>('async_task.update').pipe(
      takeUntil(this.destroy$)
    ).subscribe((message: TaskUpdateMessage) => {
      this.handleTaskUpdate(message);
    });

    this.loadAllTasks();
  }

  stopRealtimeUpdates(): void {
    this._isSubscribed.set(false);
    this.destroy$.next();
  }

  loadAllTasks(): void {
    const httpParams = this.buildHttpParams({ limit: 10 });
    this.get<PaginatedResponse<AsyncTaskStatus>>(`${this.apiUrl}/async-tasks/`, { params: httpParams }).subscribe({
      next: (response: PaginatedResponse<AsyncTaskStatus>) => {
        const taskArray = Array.isArray(response.results) ? response.results : [];
        this._tasks.set(taskArray);
      },
      error: (_error: HttpError) => {
      }
    });
  }

  cancelTask(taskId: string): Observable<{ message: string }> {
    return this.delete<{ message: string }>(`${this.apiUrl}/async-tasks/${taskId}/cancel/`);
  }

  private handleTaskUpdate(message: TaskUpdateMessage): void {
    const taskId = message.task_id;
    const currentTasks = this._tasks();
    const existingTaskIndex = currentTasks.findIndex(t => t.id === taskId);

    const isTaskCompleted = message.status === TaskStatus.SUCCESS ||
                           message.status === TaskStatus.FAILURE ||
                           message.status === TaskStatus.CANCELLED;

    if (isTaskCompleted) {
      this.loadSingleTask(taskId);
    } else if (existingTaskIndex >= 0) {
      const existingTask = currentTasks[existingTaskIndex];

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
      this._tasks.set(updatedTasks);
    } else {
      this.loadAllTasks();
    }
  }

  pollUntilComplete(taskId: string, intervalMs: number = 3000): void {
    this.loadSingleTask(taskId);

    const intervalId = setInterval(() => {
      const task = this._tasks().find(t => t.id === taskId);
      if (task && TERMINAL_STATUSES.has(task.status)) {
        clearInterval(intervalId);
        return;
      }
      this.loadSingleTask(taskId);
    }, intervalMs);
  }

  loadSingleTask(taskId: string): void {
    this.get<AsyncTaskStatus>(`${this.apiUrl}/async-tasks/${taskId}/`).subscribe({
      next: (task: AsyncTaskStatus) => {
        const currentTasks = this._tasks();
        const existingTaskIndex = currentTasks.findIndex(t => t.id === taskId);

        if (existingTaskIndex >= 0) {
          const updatedTasks = [...currentTasks];
          updatedTasks[existingTaskIndex] = task;
          this._tasks.set(updatedTasks);
        } else {
          this._tasks.set([task, ...currentTasks]);
        }
      },
      error: (_error: HttpError) => {
        this.loadAllTasks();
      }
    });
  }
}
