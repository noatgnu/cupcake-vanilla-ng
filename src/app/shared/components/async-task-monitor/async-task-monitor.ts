import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TaskListItem, TaskStatus, TaskType, TASK_TYPE_LABELS, TASK_STATUS_LABELS, TASK_STATUS_COLORS } from '../../models/async-task';
import { AsyncTaskService } from '../../services/async-task';

@Component({
  selector: 'app-async-task-monitor',
  imports: [CommonModule],
  templateUrl: './async-task-monitor.html',
  styleUrl: './async-task-monitor.scss'
})
export class AsyncTaskMonitorComponent implements OnInit, OnDestroy {
  @Input() showCompleted = true;
  @Input() maxTasks = 20;
  @Input() autoRefresh = true;

  private destroy$ = new Subject<void>();
  
  tasks$!: Observable<TaskListItem[]>;
  activeTasks$!: Observable<TaskListItem[]>;

  // Labels and colors for display
  readonly taskTypeLabels = TASK_TYPE_LABELS;
  readonly taskStatusLabels = TASK_STATUS_LABELS;
  readonly taskStatusColors = TASK_STATUS_COLORS;

  constructor(private asyncTaskService: AsyncTaskService) {}

  ngOnInit(): void {
    this.tasks$ = this.asyncTaskService.tasks$;
    this.activeTasks$ = this.asyncTaskService.activeTasks$;
    
    if (this.autoRefresh) {
      this.asyncTaskService.startRealtimeUpdates();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.autoRefresh) {
      this.asyncTaskService.stopRealtimeUpdates();
    }
  }

  /**
   * Cancel a task
   */
  cancelTask(taskId: string): void {
    this.asyncTaskService.cancelTask(taskId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        console.log('Task cancelled:', response.message);
      },
      error: (error) => {
        console.error('Error cancelling task:', error);
      }
    });
  }

  /**
   * Download task result
   */
  downloadResult(task: TaskListItem): void {
    this.asyncTaskService.downloadTaskResult(task.id);
  }

  /**
   * Check if task can be cancelled
   */
  canCancelTask(task: TaskListItem): boolean {
    return this.asyncTaskService.canCancelTask(task.status);
  }

  /**
   * Check if task result can be downloaded
   */
  canDownloadResult(task: TaskListItem): boolean {
    return this.asyncTaskService.canDownloadResult(task);
  }

  /**
   * Format task duration
   */
  formatDuration(duration: number | null): string {
    return this.asyncTaskService.formatDuration(duration);
  }

  /**
   * Get task status badge class
   */
  getStatusBadgeClass(status: TaskStatus): string {
    const colorMap: Record<TaskStatus, string> = {
      'QUEUED': 'bg-secondary',
      'STARTED': 'bg-primary',
      'SUCCESS': 'bg-success',
      'FAILURE': 'bg-danger',
      'CANCELLED': 'bg-warning',
    };
    return `badge ${colorMap[status] || 'bg-secondary'}`;
  }

  /**
   * Get progress bar class based on status
   */
  getProgressBarClass(status: TaskStatus): string {
    const colorMap: Record<TaskStatus, string> = {
      'QUEUED': 'bg-secondary',
      'STARTED': 'bg-primary',
      'SUCCESS': 'bg-success',
      'FAILURE': 'bg-danger',
      'CANCELLED': 'bg-warning',
    };
    return colorMap[status] || 'bg-secondary';
  }

  /**
   * Generate filename for download if not provided
   */
  private generateFilename(task: TaskListItem): string {
    const extension = task.task_type === 'EXPORT_EXCEL' ? '.xlsx' : '.sdrf.tsv';
    const tableName = task.metadata_table_name ? `_${task.metadata_table_name}` : '';
    return `export${tableName}${extension}`;
  }

  /**
   * Refresh task list manually
   */
  refreshTasks(): void {
    this.asyncTaskService.getTasks().pipe(
      takeUntil(this.destroy$)
    ).subscribe();
  }

  /**
   * Track by function for task list
   */
  trackByTaskId(index: number, task: TaskListItem): string {
    return task.id;
  }

  /**
   * Get relative time string
   */
  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffMins / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  }
}
