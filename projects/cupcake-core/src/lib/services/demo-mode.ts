import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface DemoModeInfo {
  isActive: boolean;
  cleanupIntervalMinutes: number;
  lastDetected?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class DemoModeService {
  private demoModeSubject = new BehaviorSubject<DemoModeInfo>({
    isActive: false,
    cleanupIntervalMinutes: 15
  });

  public demoMode$ = this.demoModeSubject.asObservable();

  setDemoMode(isActive: boolean, cleanupInterval: number = 15): void {
    const currentInfo = this.demoModeSubject.value;

    if (isActive !== currentInfo.isActive) {
      this.demoModeSubject.next({
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
    return this.demoModeSubject.value.isActive;
  }

  getDemoModeInfo(): DemoModeInfo {
    return this.demoModeSubject.value;
  }

  checkLocalStorage(): void {
    const isDemoActive = localStorage.getItem('demo_mode_active') === 'true';
    const cleanupInterval = parseInt(localStorage.getItem('demo_mode_cleanup_interval') || '15', 10);

    if (isDemoActive) {
      this.setDemoMode(true, cleanupInterval);
    }
  }
}
