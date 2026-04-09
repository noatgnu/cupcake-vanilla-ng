import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
  duration: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private nextId = 0;
  private _toasts = signal<ToastMessage[]>([]);
  readonly toasts = this._toasts.asReadonly();

  success(message: string, duration = 3000): void {
    this.show('success', message, duration);
  }

  error(message: string, duration = 5000): void {
    this.show('error', message, duration);
  }

  warning(message: string, duration = 4000): void {
    this.show('warning', message, duration);
  }

  info(message: string, duration = 3000): void {
    this.show('info', message, duration);
  }

  private show(type: ToastType, message: string, duration: number): void {
    const id = this.nextId++;
    const toast: ToastMessage = { id, type, message, duration };

    this._toasts.update(toasts => [...toasts, toast]);

    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }

  dismiss(id: number): void {
    this._toasts.update(toasts => toasts.filter(t => t.id !== id));
  }

  clear(): void {
    this._toasts.set([]);
  }
}
