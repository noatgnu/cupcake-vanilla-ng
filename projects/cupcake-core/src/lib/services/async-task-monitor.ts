import { Injectable, OnDestroy, inject } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';
import { AsyncTaskStatus, TaskStatus, PaginatedResponse } from '../models';
import { BaseApiService } from './base-api';
import { WebSocketService } from './websocket';

@Injectable({
  providedIn: 'root'
})
export class AsyncTaskMonitorService extends BaseApiService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private tasksSubject = new BehaviorSubject<AsyncTaskStatus[]>([]);
  private isSubscribed = false;

  private websocket = inject(WebSocketService);

  constructor() {
    super();
  }

  public tasks$ = this.tasksSubject.asObservable();
  public activeTasks$ = this.tasks$.pipe(
    map(tasks => {
      const taskArray = Array.isArray(tasks) ? tasks : [];
      const active = taskArray.filter(task => task.status === TaskStatus.QUEUED || task.status === TaskStatus.STARTED);
      console.log('AsyncTaskMonitorService: activeTasks$ emitting:', active.length, 'active tasks out of', taskArray.length, 'total');
      return active;
    })
  );

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  startRealtimeUpdates(): void {
    if (this.isSubscribed) {
      console.log('AsyncTaskMonitorService: Already subscribed to real-time updates');
      return;
    }

    console.log('AsyncTaskMonitorService: Starting real-time updates');
    this.isSubscribed = true;

    this.websocket.filterMessages('async_task.update').pipe(
      takeUntil(this.destroy$)
    ).subscribe((message: any) => {
      console.log('AsyncTaskMonitorService: Received async_task.update message:', message);
      this.handleTaskUpdate(message);
    });

    this.websocket.isConnected$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(isConnected => {
      if (isConnected) {
        console.log('AsyncTaskMonitorService: WebSocket connected, subscribing to async_task_updates channel');
        this.websocket.subscribe('async_task_updates');
      }
    });

    this.loadAllTasks();
  }

  stopRealtimeUpdates(): void {
    console.log('AsyncTaskMonitorService: Stopping real-time updates');
    this.isSubscribed = false;
    this.destroy$.next();
  }

  loadAllTasks(): void {
    const httpParams = this.buildHttpParams({ limit: 100 });
    this.get<PaginatedResponse<AsyncTaskStatus>>(`${this.apiUrl}/async-tasks/`, { params: httpParams }).subscribe({
      next: (response: PaginatedResponse<AsyncTaskStatus>) => {
        const taskArray = Array.isArray(response.results) ? response.results : [];
        console.log('AsyncTaskMonitorService: Loaded tasks from server:', taskArray.length);
        this.tasksSubject.next(taskArray);
      },
      error: (error: any) => {
        console.error('AsyncTaskMonitorService: Error loading tasks:', error);
      }
    });
  }

  cancelTask(taskId: string): Observable<{ message: string }> {
    return this.delete<{ message: string }>(`${this.apiUrl}/async-tasks/${taskId}/cancel/`);
  }

  private handleTaskUpdate(message: any): void {
    console.log('AsyncTaskMonitorService: handleTaskUpdate called with message:', message);
    const taskId = message.task_id;
    const currentTasks = this.tasksSubject.value;
    console.log('AsyncTaskMonitorService: Current tasks in subject:', currentTasks.length);
    const existingTaskIndex = currentTasks.findIndex(t => t.id === taskId);
    console.log('AsyncTaskMonitorService: Existing task index:', existingTaskIndex);

    const isTaskCompleted = message.status === TaskStatus.SUCCESS ||
                           message.status === TaskStatus.FAILURE ||
                           message.status === TaskStatus.CANCELLED;

    if (isTaskCompleted) {
      console.log('AsyncTaskMonitorService: Task completed, fetching full task details from API');
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
      console.log('AsyncTaskMonitorService: Emitting updated tasks:', updatedTasks.length, 'active tasks:', updatedTasks.filter(t => t.status === TaskStatus.QUEUED || t.status === TaskStatus.STARTED).length);
      this.tasksSubject.next(updatedTasks);
    } else {
      console.log('AsyncTaskMonitorService: Task not found in current list, fetching all tasks');
      this.loadAllTasks();
    }
  }

  loadSingleTask(taskId: string): void {
    this.get<AsyncTaskStatus>(`${this.apiUrl}/async-tasks/${taskId}/`).subscribe({
      next: (task: AsyncTaskStatus) => {
        console.log('AsyncTaskMonitorService: Loaded single task from API:', task);
        const currentTasks = this.tasksSubject.value;
        const existingTaskIndex = currentTasks.findIndex(t => t.id === taskId);

        if (existingTaskIndex >= 0) {
          const updatedTasks = [...currentTasks];
          updatedTasks[existingTaskIndex] = task;
          console.log('AsyncTaskMonitorService: Updated task in list with full details');
          this.tasksSubject.next(updatedTasks);
        } else {
          console.log('AsyncTaskMonitorService: Adding new task to list');
          this.tasksSubject.next([task, ...currentTasks]);
        }
      },
      error: (error: any) => {
        console.error('AsyncTaskMonitorService: Error loading single task:', error);
        this.loadAllTasks();
      }
    });
  }
}
