import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastService, ToastMessage } from '../../services/toast';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, NgbModule],
  templateUrl: './toast-container.html',
  styleUrl: './toast-container.scss'
})
export class ToastContainerComponent {
  private toastService = inject(ToastService);
  
  /**
   * Signal containing all active toast messages
   */
  toasts = this.toastService.toasts;

  /**
   * Computed signal that maps toast types to their CSS classes
   */
  private toastClassMap = computed(() => ({
    success: 'bg-success text-white',
    error: 'bg-danger text-white',
    warning: 'bg-warning text-dark',
    info: 'bg-primary text-white'
  }));

  /**
   * Computed signal that maps toast types to their Bootstrap icons
   */
  private toastIconMap = computed(() => ({
    success: 'bi-check-circle-fill',
    error: 'bi-exclamation-triangle-fill',
    warning: 'bi-exclamation-circle-fill',
    info: 'bi-info-circle-fill'
  }));

  /**
   * Removes a toast message from the service
   */
  remove(toast: ToastMessage): void {
    this.toastService.remove(toast.id);
  }

  /**
   * Gets the CSS class for a toast based on its type
   */
  getToastClass(type: string): string {
    const classMap = this.toastClassMap();
    return classMap[type as keyof typeof classMap] || classMap.info;
  }

  /**
   * Gets the Bootstrap icon class for a toast based on its type
   */
  getToastIcon(type: string): string {
    const iconMap = this.toastIconMap();
    return iconMap[type as keyof typeof iconMap] || iconMap.info;
  }
}
