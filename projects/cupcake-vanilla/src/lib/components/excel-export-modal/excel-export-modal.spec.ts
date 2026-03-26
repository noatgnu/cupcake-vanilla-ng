import { signal, WritableSignal } from '@angular/core';

describe('ExcelExportModalComponent', () => {
  let includeLabGroups: WritableSignal<'none' | 'selected' | 'all'>;
  let includePools: WritableSignal<boolean>;
  let selectedLabGroupIds: WritableSignal<number[]>;
  let showLabGroupSelection: WritableSignal<boolean>;

  function onIncludeLabGroupsChange(value: 'none' | 'selected' | 'all'): void {
    includeLabGroups.set(value);
    showLabGroupSelection.set(value === 'selected');
  }

  beforeEach(() => {
    includeLabGroups = signal<'none' | 'selected' | 'all'>('none');
    includePools = signal(true);
    selectedLabGroupIds = signal<number[]>([]);
    showLabGroupSelection = signal(false);
  });

  it('should initialize with default values', () => {
    expect(includeLabGroups()).toBe('none');
    expect(includePools()).toBe(true);
    expect(selectedLabGroupIds()).toEqual([]);
  });

  it('should show lab group selection when includeLabGroups is selected', () => {
    onIncludeLabGroupsChange('selected');
    expect(showLabGroupSelection()).toBe(true);
  });

  it('should hide lab group selection when includeLabGroups is none', () => {
    onIncludeLabGroupsChange('none');
    expect(showLabGroupSelection()).toBe(false);
  });

  it('should return correct options for confirm', () => {
    const options = {
      includeLabGroups: includeLabGroups(),
      selectedLabGroupIds: selectedLabGroupIds(),
      includePools: includePools()
    };
    expect(options).toEqual({
      includeLabGroups: 'none',
      selectedLabGroupIds: [],
      includePools: true
    });
  });
});
