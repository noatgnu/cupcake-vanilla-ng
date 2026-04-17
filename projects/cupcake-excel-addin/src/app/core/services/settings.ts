import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'cupcake-excel-settings';

interface AddinSettings {
  autoDetectChanges: boolean;
}

const defaults: AddinSettings = {
  autoDetectChanges: true
};

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  readonly autoDetectChanges = signal<boolean>(defaults.autoDetectChanges);

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored: Partial<AddinSettings> = JSON.parse(raw);
        this.autoDetectChanges.set(stored.autoDetectChanges ?? defaults.autoDetectChanges);
      }
    } catch {
      // use defaults on parse error
    }
  }

  setAutoDetectChanges(value: boolean): void {
    this.autoDetectChanges.set(value);
    this.persist();
  }

  private persist(): void {
    try {
      const settings: AddinSettings = {
        autoDetectChanges: this.autoDetectChanges()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // ignore storage errors
    }
  }
}
