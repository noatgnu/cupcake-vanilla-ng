import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';

export interface DemoModeInfo {
  isActive: boolean;
  cleanupIntervalMinutes: number;
  lastDetected?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class DemoModeService {
  private _demoMode = signal<DemoModeInfo>({
    isActive: false,
    cleanupIntervalMinutes: 15
  });

  public demoMode = this._demoMode.asReadonly();

  setDemoMode(isActive: boolean, cleanupInterval: number = 15): void {
    const currentInfo = this._demoMode();

    if (isActive !== currentInfo.isActive) {
      this._demoMode.set({
        isActive,
        cleanupIntervalMinutes: cleanupInterval,
        lastDetected: new Date()
      });

      if (isActive) {
        localStorage.setItem('demo_mode_active', 'true');
        localStorage.setItem('demo_mode_cleanup_interval', cleanupInterval.toString());
      } else {
        localStorage.removeItem('demo_mode_active');
        localStorage.removeItem('demo_mode_cleanup_interval');
      }
    }
  }

  isDemoMode(): boolean {
    return this._demoMode().isActive;
  }

  getDemoModeInfo(): DemoModeInfo {
    return this._demoMode();
  }

  checkLocalStorage(): void {
    const isDemoActive = localStorage.getItem('demo_mode_active') === 'true';
    const cleanupInterval = parseInt(localStorage.getItem('demo_mode_cleanup_interval') || '15', 10);

    if (isDemoActive) {
      this.setDemoMode(true, cleanupInterval);
    }
  }
}
