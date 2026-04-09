import { Component, inject } from '@angular/core';
import { ToastService, ToastMessage } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  imports: [],
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
})
export class ToastContainer {
  private toastService = inject(ToastService);

  readonly toasts = this.toastService.toasts;

  dismiss(toast: ToastMessage): void {
    this.toastService.dismiss(toast.id);
  }

  getIcon(type: string): string {
    switch (type) {
      case 'success': return 'bi-check-circle-fill';
      case 'error': return 'bi-x-circle-fill';
      case 'warning': return 'bi-exclamation-triangle-fill';
      case 'info': return 'bi-info-circle-fill';
      default: return 'bi-info-circle';
    }
  }
}
