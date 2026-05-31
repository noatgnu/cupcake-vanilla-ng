import { Injectable, inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmDialogComponent } from '../components/confirm-dialog/confirm-dialog';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmClass?: string;
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly modal = inject(NgbModal);

  /**
   * Opens a Bootstrap confirmation modal and returns a promise that resolves
   * to true when confirmed or false when cancelled/dismissed.
   */
  async confirm(options: ConfirmOptions): Promise<boolean> {
    const ref = this.modal.open(ConfirmDialogComponent, { backdrop: 'static', keyboard: false });
    const instance = ref.componentInstance as ConfirmDialogComponent;
    instance.title = options.title ?? 'Confirm';
    instance.message = options.message;
    instance.confirmLabel = options.confirmLabel ?? 'Confirm';
    instance.cancelLabel = options.cancelLabel ?? 'Cancel';
    instance.confirmClass = options.confirmClass ?? 'btn-danger';

    try {
      return await ref.result;
    } catch {
      return false;
    }
  }
}
