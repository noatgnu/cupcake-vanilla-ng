import { signal, WritableSignal } from '@angular/core';

interface MetadataTable {
  id: number;
  name: string;
  sampleCount: number;
}

describe('MetadataTableDetails', () => {
  let table: WritableSignal<MetadataTable | null>;
  let isLoading: WritableSignal<boolean>;

  beforeEach(() => {
    table = signal<MetadataTable | null>(null);
    isLoading = signal(false);
  });

  it('should start with no table loaded', () => {
    expect(table()).toBeNull();
  });

  it('should track loading state', () => {
    expect(isLoading()).toBe(false);
    isLoading.set(true);
    expect(isLoading()).toBe(true);
  });

  it('should be able to set table data', () => {
    const mockTable: MetadataTable = {
      id: 1,
      name: 'Test Table',
      sampleCount: 10
    };
    table.set(mockTable);
    expect(table()).toEqual(mockTable);
  });
});
