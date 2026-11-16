import { Injectable, inject, signal } from '@angular/core';

import { MaintenanceService } from './maintenance';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  dismissible?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSignal = signal<ToastMessage[]>([]);
  private readonly maintenance = inject(MaintenanceService);
  
  readonly toasts = this.toastsSignal.asReadonly();

  show(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration = 5000) {
    const id = this.generateId();
    const toast: ToastMessage = {
      id,
      message,
      type,
      duration,
      dismissible: true
    };

    this.toastsSignal.update(toasts => [...toasts, toast]);

    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
  }

  success(message: string, duration = 5000) {
    this.show(message, 'success', duration);
  }

  /**
   * Show an error, unless the backend is restarting or out of reach and the maintenance overlay already says so.
   */
  error(message: string, duration = 8000) {
    if (this.maintenance.active()) {
      return;
    }
    this.show(message, 'error', duration);
  }

  warning(message: string, duration = 6000) {
    this.show(message, 'warning', duration);
  }

  info(message: string, duration = 5000) {
    this.show(message, 'info', duration);
  }

  remove(id: string) {
    this.toastsSignal.update(toasts => toasts.filter(toast => toast.id !== id));
  }

  clear() {
    this.toastsSignal.set([]);
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}
