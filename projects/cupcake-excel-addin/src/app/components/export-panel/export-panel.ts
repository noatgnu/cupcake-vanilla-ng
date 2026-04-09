import { Component, inject, signal, input, output, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MetadataTable,
  AsyncExportService,
  AsyncTaskService
} from '@noatgnu/cupcake-vanilla';
import { TaskStatus } from '@noatgnu/cupcake-core';
import { ToastService } from '../../core/services/toast.service';

type ExportFormat = 'sdrf' | 'excel';

@Component({
  selector: 'app-export-panel',
  imports: [FormsModule],
  templateUrl: './export-panel.html',
  styleUrl: './export-panel.scss',
})
export class ExportPanel implements OnDestroy {
  private exportService = inject(AsyncExportService);
  private taskService = inject(AsyncTaskService);
  private toastService = inject(ToastService);

  private pollingInterval: any = null;

  readonly table = input.required<MetadataTable>();
  readonly back = output<void>();

  readonly exportFormat = signal<ExportFormat>('sdrf');
  readonly includePools = signal(true);
  readonly isExporting = signal(false);
  readonly taskProgress = signal(0);
  readonly statusMessage = signal('');
  readonly downloadUrl = signal<string | null>(null);

  ngOnDestroy(): void {
    this.stopPolling();
  }

  startExport(): void {
    this.isExporting.set(true);
    this.taskProgress.set(0);
    this.statusMessage.set('Starting export...');
    this.downloadUrl.set(null);

    const request = {
      metadataTableId: this.table().id,
      includePools: this.includePools()
    };

    const exportObservable = this.exportFormat() === 'sdrf'
      ? this.exportService.sdrfFile(request)
      : this.exportService.excelTemplate(request);

    exportObservable.subscribe({
      next: (response) => {
        this.statusMessage.set('Export task started...');
        this.startPolling(response.taskId);
      },
      error: () => {
        this.isExporting.set(false);
        this.statusMessage.set('Failed to start export');
        this.toastService.error('Failed to start export');
      }
    });
  }

  private startPolling(taskId: string): void {
    this.stopPolling();

    this.pollingInterval = setInterval(() => {
      this.taskService.getAsyncTask(taskId).subscribe({
        next: (task) => {
          this.taskProgress.set(task.progressPercentage || 0);

          if (task.progressDescription) {
            this.statusMessage.set(task.progressDescription);
          }

          if (task.status === TaskStatus.SUCCESS) {
            this.stopPolling();
            this.isExporting.set(false);
            this.statusMessage.set('Export completed');
            this.getDownloadUrl(taskId);
          } else if (task.status === TaskStatus.FAILURE) {
            this.stopPolling();
            this.isExporting.set(false);
            this.statusMessage.set('Export failed');
            this.toastService.error(task.errorMessage || 'Export failed');
          } else if (task.status === TaskStatus.CANCELLED) {
            this.stopPolling();
            this.isExporting.set(false);
            this.statusMessage.set('Export cancelled');
          }
        },
        error: () => {
          this.stopPolling();
          this.isExporting.set(false);
          this.statusMessage.set('Failed to check export status');
        }
      });
    }, 2000);
  }

  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  private getDownloadUrl(taskId: string): void {
    this.taskService.getDownloadUrl(taskId).subscribe({
      next: (response) => {
        this.downloadUrl.set(response.downloadUrl);
        this.toastService.success('Export ready for download');
      },
      error: () => {
        this.toastService.error('Failed to get download URL');
      }
    });
  }

  download(): void {
    const url = this.downloadUrl();
    if (url) {
      window.open(url, '_blank');
    }
  }

  goBack(): void {
    this.back.emit();
  }
}
