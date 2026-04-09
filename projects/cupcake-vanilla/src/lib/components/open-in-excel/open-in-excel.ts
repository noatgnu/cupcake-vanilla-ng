import { Component, inject, signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExcelLaunchService } from '../../services/excel-launch';
import { ExcelLaunchCode } from '../../models';

@Component({
  selector: 'ccv-open-in-excel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './open-in-excel.html',
  styleUrl: './open-in-excel.scss'
})
export class OpenInExcel {
  private launchService = inject(ExcelLaunchService);

  readonly tableId = input.required<number>();
  readonly tableName = input<string>('');
  readonly buttonClass = input<string>('btn btn-outline-primary');
  readonly showIcon = input<boolean>(true);
  readonly buttonText = input<string>('Open in Excel');

  readonly launched = output<ExcelLaunchCode>();
  readonly error = output<string>();

  readonly isLoading = signal(false);
  readonly launchCode = signal<ExcelLaunchCode | null>(null);
  readonly showModal = signal(false);
  readonly copySuccess = signal(false);

  createLaunchCode(): void {
    this.isLoading.set(true);
    this.launchService.createLaunchCode({
      tableId: this.tableId(),
      tableName: this.tableName()
    }).subscribe({
      next: (code) => {
        this.launchCode.set(code);
        this.showModal.set(true);
        this.isLoading.set(false);
        this.launched.emit(code);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.emit(err.error?.detail || 'Failed to create launch code');
      }
    });
  }

  copyCode(): void {
    const code = this.launchCode()?.code;
    if (code && navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        this.copySuccess.set(true);
        setTimeout(() => this.copySuccess.set(false), 2000);
      });
    }
  }

  closeModal(): void {
    this.showModal.set(false);
    this.launchCode.set(null);
  }

  getExpiryTime(): string {
    const code = this.launchCode();
    if (!code?.expiresIn) return '';
    const diffMins = Math.ceil(code.expiresIn / 60);
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
  }
}
