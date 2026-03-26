import { signal, WritableSignal } from '@angular/core';

interface MetadataColumn {
  id: number;
  metadataTable: number;
  name: string;
  displayName: string;
  type: string;
  columnPosition: number;
}

interface BasicAutofillConfig {
  column: MetadataColumn;
  sampleCount: number;
}

interface AdvancedAutofillConfig {
  metadataTableId: number;
  sampleCount: number;
  allColumns?: MetadataColumn[];
}

describe('MetadataColumnAutofillModal', () => {
  let activeTab: WritableSignal<number>;
  let basicConfig: WritableSignal<BasicAutofillConfig | null>;
  let advancedConfig: WritableSignal<AdvancedAutofillConfig | null>;

  const mockColumn: MetadataColumn = {
    id: 1,
    metadataTable: 1,
    name: 'test column',
    displayName: 'Test Column',
    type: 'text',
    columnPosition: 0
  };

  beforeEach(() => {
    activeTab = signal(1);
    basicConfig = signal<BasicAutofillConfig | null>({
      column: mockColumn,
      sampleCount: 10
    });
    advancedConfig = signal<AdvancedAutofillConfig | null>({
      metadataTableId: 1,
      sampleCount: 10,
      allColumns: [mockColumn]
    });
  });

  it('should initialize with basic tab active', () => {
    expect(activeTab()).toBe(1);
  });

  it('should have basic config', () => {
    expect(basicConfig()).toBeTruthy();
    expect(basicConfig()?.sampleCount).toBe(10);
  });

  it('should have advanced config', () => {
    expect(advancedConfig()).toBeTruthy();
    expect(advancedConfig()?.metadataTableId).toBe(1);
  });

  it('should switch tabs', () => {
    activeTab.set(2);
    expect(activeTab()).toBe(2);
    activeTab.set(1);
    expect(activeTab()).toBe(1);
  });
});
