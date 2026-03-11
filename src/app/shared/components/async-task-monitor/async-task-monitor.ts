import { Component, OnInit, OnDestroy, Input, signal, computed, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AsyncTaskStatus, TaskStatus, TaskType, TASK_TYPE_LABELS, TASK_STATUS_LABELS, TASK_STATUS_COLORS, AsyncTaskMonitorService } from '@noatgnu/cupcake-core';
import { AsyncTaskUIService } from '@noatgnu/cupcake-vanilla';

@Component({
  selector: 'app-async-task-monitor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './async-task-monitor.html',
  styleUrl: './async-task-monitor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AsyncTaskMonitorComponent implements OnInit, OnDestroy {
  @Input() showCompleted = true;
  @Input() maxTasks = 20;
  @Input() autoRefresh = true;

  private destroy$ = new Subject<void>();
  private asyncTaskMonitor = inject(AsyncTaskMonitorService);
  private asyncTaskService = inject(AsyncTaskUIService);
  
  tasks = this.asyncTaskMonitor.tasks;
  activeTasks = this.asyncTaskMonitor.activeTasks;

  selectedFilter = signal<'all' | 'active' | 'completed' | 'failed'>('all');
  
  filteredTasks = computed(() => {
    const tasks = this.tasks();
    const filter = this.selectedFilter();
    
    if (!Array.isArray(tasks)) {
      return [];
    }
    
    switch (filter) {
      case 'active':
        return tasks.filter(task => task.status === TaskStatus.QUEUED || task.status === TaskStatus.STARTED);
      case 'completed':
        return tasks.filter(task => task.status === TaskStatus.SUCCESS);
      case 'failed':
        return tasks.filter(task => task.status === TaskStatus.FAILURE);
      default:
        return tasks;
    }
  });

  readonly taskTypeLabels = TASK_TYPE_LABELS;
  readonly taskStatusLabels = TASK_STATUS_LABELS;
  readonly taskStatusColors = TASK_STATUS_COLORS;

  constructor() {}

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

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

  downloadResult(task: AsyncTaskStatus): void {
    this.asyncTaskService.downloadTaskResult(task.id);
  }

  canCancelTask(task: AsyncTaskStatus): boolean {
    return this.asyncTaskService.canCancelTask(task.status);
  }

  canDownloadResult(task: AsyncTaskStatus): boolean {
    return this.asyncTaskService.canDownloadResult(task);
  }

  formatDuration(duration: number | null): string {
    return this.asyncTaskService.formatDuration(duration);
  }

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

  private generateFilename(task: AsyncTaskStatus): string {
    const extension = task.taskType === 'EXPORT_EXCEL' ? '.xlsx' : '.sdrf.tsv';
    const tableName = task.metadataTableName ? `_${task.metadataTableName}` : '';
    return `export${tableName}${extension}`;
  }

  refreshTasks(): void {
    this.asyncTaskMonitor.loadAllTasks();
  }

  trackByTaskId(index: number, task: AsyncTaskStatus): string {
    return task.id;
  }

  setFilter(filter: 'all' | 'active' | 'completed' | 'failed'): void {
    this.selectedFilter.set(filter);
  }

  clearCompletedTasks(): void {
    console.log('Clear completed tasks - to be implemented');
  }

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
