import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';

/**
 * Frontend-only navigation state service for tracking navigation context
 * This is application-specific UI state and doesn't interact with backend
 */
@Injectable({
  providedIn: 'root'
})
export class NavigationState {
  private _navigationType = signal<'table' | 'template'>('table');
  public navigationType = this._navigationType.asReadonly();
  public navigationType$ = toObservable(this._navigationType);

  /**
   * Set the current navigation type
   */
  setNavigationType(type: 'table' | 'template'): void {
    this._navigationType.set(type);
  }

  /**
   * Get the current navigation type
   */
  getCurrentNavigationType(): 'table' | 'template' {
    return this._navigationType();
  }
}
