import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Frontend-only navigation state service for tracking navigation context
 * This is application-specific UI state and doesn't interact with backend
 */
@Injectable({
  providedIn: 'root'
})
export class NavigationState {
  private navigationTypeSubject = new BehaviorSubject<'table' | 'template'>('table');
  public navigationType$ = this.navigationTypeSubject.asObservable();

  /**
   * Set the current navigation type
   */
  setNavigationType(type: 'table' | 'template'): void {
    this.navigationTypeSubject.next(type);
  }

  /**
   * Get the current navigation type
   */
  getCurrentNavigationType(): 'table' | 'template' {
    return this.navigationTypeSubject.value;
  }
}
