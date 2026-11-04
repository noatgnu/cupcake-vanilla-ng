import { signal, WritableSignal } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ResourceVisibility } from '@noatgnu/cupcake-core';
import { labGroupRequiredForGroupVisibility } from './schema-selection-modal';

interface Schema {
  id: number;
  name: string;
  displayName: string;
}

describe('TemplateSchemaSelectionModal', () => {
  let schemas: WritableSignal<Schema[]>;
  let selectedSchemaIds: WritableSignal<Set<number>>;
  let isLoading: WritableSignal<boolean>;

  function toggleSchema(schemaId: number): void {
    selectedSchemaIds.update(ids => {
      const newIds = new Set(ids);
      if (newIds.has(schemaId)) {
        newIds.delete(schemaId);
      } else {
        newIds.add(schemaId);
      }
      return newIds;
    });
  }

  function isSchemaSelected(schemaId: number): boolean {
    return selectedSchemaIds().has(schemaId);
  }

  beforeEach(() => {
    schemas = signal<Schema[]>([
      { id: 1, name: 'schema1', displayName: 'Schema 1' },
      { id: 2, name: 'schema2', displayName: 'Schema 2' }
    ]);
    selectedSchemaIds = signal<Set<number>>(new Set());
    isLoading = signal(false);
  });

  it('should have available schemas', () => {
    expect(schemas().length).toBe(2);
  });

  it('should start with no schemas selected', () => {
    expect(selectedSchemaIds().size).toBe(0);
  });

  it('should toggle schema selection', () => {
    toggleSchema(1);
    expect(isSchemaSelected(1)).toBeTrue();
    toggleSchema(1);
    expect(isSchemaSelected(1)).toBeFalse();
  });

  it('should track loading state', () => {
    expect(isLoading()).toBe(false);
    isLoading.set(true);
    expect(isLoading()).toBe(true);
  });
});

describe('labGroupRequiredForGroupVisibility', () => {
  const form = (visibility: ResourceVisibility, labGroup: number | null) =>
    new FormGroup({ visibility: new FormControl(visibility), labGroup: new FormControl(labGroup) });

  it('rejects lab group visibility without a lab group', () => {
    expect(labGroupRequiredForGroupVisibility(form(ResourceVisibility.GROUP, null))).toEqual({ labGroupRequired: true });
  });

  it('accepts lab group visibility with a lab group', () => {
    expect(labGroupRequiredForGroupVisibility(form(ResourceVisibility.GROUP, 3))).toBeNull();
  });

  it('accepts private and public visibility without a lab group', () => {
    expect(labGroupRequiredForGroupVisibility(form(ResourceVisibility.PRIVATE, null))).toBeNull();
    expect(labGroupRequiredForGroupVisibility(form(ResourceVisibility.PUBLIC, null))).toBeNull();
  });
});
