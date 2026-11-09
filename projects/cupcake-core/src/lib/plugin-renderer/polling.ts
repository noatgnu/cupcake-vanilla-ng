import { DestroyRef } from '@angular/core';

export const MIN_REFRESH_INTERVAL = 1000;

export function pollEvery(destroyRef: DestroyRef, intervalMs: number | undefined, load: () => void): void {
  if (!intervalMs || intervalMs < MIN_REFRESH_INTERVAL) {
    return;
  }
  const handle = setInterval(load, intervalMs);
  destroyRef.onDestroy(() => clearInterval(handle));
}
