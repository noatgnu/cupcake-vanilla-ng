import { signal, WritableSignal } from '@angular/core';

interface SamplePool {
  id: number;
  poolName: string;
  description?: string;
}

describe('SamplePoolDetailsModal', () => {
  let pool: WritableSignal<SamplePool | null>;
  let isLoading: WritableSignal<boolean>;

  beforeEach(() => {
    pool = signal<SamplePool | null>(null);
    isLoading = signal(false);
  });

  it('should start with no pool loaded', () => {
    expect(pool()).toBeNull();
  });

  it('should load pool data', () => {
    const mockPool: SamplePool = {
      id: 1,
      poolName: 'Test Pool',
      description: 'Test description'
    };
    pool.set(mockPool);
    expect(pool()).toEqual(mockPool);
  });

  it('should track loading state', () => {
    expect(isLoading()).toBe(false);
    isLoading.set(true);
    expect(isLoading()).toBe(true);
  });
});
