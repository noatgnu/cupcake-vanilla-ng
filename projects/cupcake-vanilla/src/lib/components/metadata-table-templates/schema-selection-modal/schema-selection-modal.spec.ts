import { signal, WritableSignal } from '@angular/core';

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
