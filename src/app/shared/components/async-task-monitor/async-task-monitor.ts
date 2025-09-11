import { Component, OnInit, OnDestroy, Input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AsyncTaskStatus, TaskStatus, TaskType, TASK_TYPE_LABELS, TASK_STATUS_LABELS, TASK_STATUS_COLORS } from '@cupcake/vanilla';
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
  
  tasks$!: Observable<AsyncTaskStatus[]>;
  activeTasks$!: Observable<AsyncTaskStatus[]>;

  // Filter state using signals
  selectedFilter = signal<'all' | 'active' | 'completed' | 'failed'>('all');
  allTasks = signal<AsyncTaskStatus[]>([]);
  
  // Computed filtered tasks
  filteredTasks = computed(() => {
    const tasks = this.allTasks();
    const filter = this.selectedFilter();
    
    // Ensure tasks is always an array
    if (!Array.isArray(tasks)) {
      console.warn('filteredTasks: tasks is not an array:', tasks);
      return [];
    }
    
    switch (filter) {
      case 'active':
        return tasks.filter(task => task.status === 'QUEUED' || task.status === 'STARTED');
      case 'completed':
        return tasks.filter(task => task.status === 'SUCCESS');
      case 'failed':
        return tasks.filter(task => task.status === 'FAILURE');
      default:
        return tasks;
    }
  });

  // Labels and colors for display
  readonly taskTypeLabels = TASK_TYPE_LABELS;
  readonly taskStatusLabels = TASK_STATUS_LABELS;
  readonly taskStatusColors = TASK_STATUS_COLORS;

  constructor(private asyncTaskService: AsyncTaskService) {}

  ngOnInit(): void {
    console.log('AsyncTaskMonitorComponent ngOnInit');
    this.tasks$ = this.asyncTaskService.tasks$;
    this.activeTasks$ = this.asyncTaskService.activeTasks$;
    
    // Subscribe to tasks and update signal - component only displays data
    this.tasks$.pipe(takeUntil(this.destroy$)).subscribe(tasks => {
      // Ensure tasks is always an array
      const taskArray = Array.isArray(tasks) ? tasks : [];
      console.log('AsyncTaskMonitor received tasks:', taskArray.length);
      this.allTasks.set(taskArray);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
  downloadResult(task: AsyncTaskStatus): void {
    this.asyncTaskService.downloadTaskResult(task.id);
  }

  /**
   * Check if task can be cancelled
   */
  canCancelTask(task: AsyncTaskStatus): boolean {
    return this.asyncTaskService.canCancelTask(task.status);
  }

  /**
   * Check if task result can be downloaded
   */
  canDownloadResult(task: AsyncTaskStatus): boolean {
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
  private generateFilename(task: AsyncTaskStatus): string {
    const extension = task.taskType === 'EXPORT_EXCEL' ? '.xlsx' : '.sdrf.tsv';
    const tableName = task.metadataTableName ? `_${task.metadataTableName}` : '';
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
  trackByTaskId(index: number, task: AsyncTaskStatus): string {
    return task.id;
  }

  /**
   * Set filter for tasks
   */
  setFilter(filter: 'all' | 'active' | 'completed' | 'failed'): void {
    this.selectedFilter.set(filter);
  }

  /**
   * Clear completed tasks
   */
  clearCompletedTasks(): void {
    // This would typically call a service method to clear completed tasks
    console.log('Clear completed tasks - to be implemented');
  }

  /**
   * Get task icon based on task type and status
   */
  getTaskIcon(task: AsyncTaskStatus): string {
    if (task.status === 'STARTED') {
      return 'bi bi-hourglass-split';
    }
    
    switch (task.taskType) {
      case 'EXPORT_EXCEL':
        return 'bi bi-file-earmark-excel';
      case 'EXPORT_SDRF':
        return 'bi bi-file-earmark-text';
      case 'EXPORT_MULTIPLE_SDRF':
        return 'bi bi-collection';
      case 'EXPORT_MULTIPLE_EXCEL':
        return 'bi bi-files';
      case 'IMPORT_SDRF':
      case 'IMPORT_EXCEL':
        return 'bi bi-upload';
      default:
        return 'bi bi-gear';
    }
  }

  /**
   * Get task badge class based on status
   */
  getTaskBadgeClass(task: AsyncTaskStatus): string {
    const baseClass = 'task-icon';
    
    switch (task.status) {
      case 'QUEUED':
        return `${baseClass} bg-secondary`;
      case 'STARTED':
        return `${baseClass} bg-primary`;
      case 'SUCCESS':
        return `${baseClass} bg-success`;
      case 'FAILURE':
        return `${baseClass} bg-danger`;
      case 'CANCELLED':
        return `${baseClass} bg-warning`;
      default:
        return `${baseClass} bg-secondary`;
    }
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
