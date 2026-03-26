import { FormBuilder, FormGroup } from '@angular/forms';
import { signal, WritableSignal } from '@angular/core';

interface ValidationSchema {
  name: string;
  displayName: string;
  description: string;
  columnCount: number;
}

interface MetadataValidationConfig {
  metadataTableId: number;
  metadataTableName: string;
}

describe('MetadataValidationModal', () => {
  let fb: FormBuilder;
  let validationForm: FormGroup;
  let isValidating: WritableSignal<boolean>;
  let validationError: WritableSignal<string>;
  let availableSchemas: WritableSignal<ValidationSchema[]>;
  let selectedSchemas: WritableSignal<Set<string>>;

  const mockConfig: MetadataValidationConfig = {
    metadataTableId: 123,
    metadataTableName: 'Test Table'
  };

  const mockSchemas: ValidationSchema[] = [
    { name: 'default', displayName: 'Default', description: 'Standard schema', columnCount: 10 },
    { name: 'minimum', displayName: 'Minimum', description: 'Minimal schema', columnCount: 5 }
  ];

  function isSchemaSelected(schemaName: string): boolean {
    return selectedSchemas().has(schemaName);
  }

  function toggleSchema(schemaName: string): void {
    selectedSchemas.update(schemas => {
      const newSchemas = new Set(schemas);
      if (newSchemas.has(schemaName)) {
        newSchemas.delete(schemaName);
      } else {
        newSchemas.add(schemaName);
      }
      return newSchemas;
    });
  }

  function selectAllSchemas(): void {
    const allSchemaNames = availableSchemas().map(s => s.name);
    selectedSchemas.set(new Set(allSchemaNames));
  }

  function clearAllSchemas(): void {
    selectedSchemas.set(new Set());
  }

  beforeEach(() => {
    fb = new FormBuilder();
    validationForm = fb.group({
      validate_sdrf_format: [true],
      skip_ontology: [false],
      include_pools: [true]
    });
    isValidating = signal(false);
    validationError = signal('');
    availableSchemas = signal(mockSchemas);
    selectedSchemas = signal(new Set(mockSchemas.map(s => s.name)));
  });

  it('should initialize form with default values', () => {
    expect(validationForm.get('validate_sdrf_format')?.value).toBe(true);
    expect(validationForm.get('skip_ontology')?.value).toBe(false);
    expect(validationForm.get('include_pools')?.value).toBe(true);
  });

  it('should have available schemas loaded', () => {
    expect(availableSchemas()).toEqual(mockSchemas);
  });

  it('should toggle schema selection', () => {
    expect(isSchemaSelected('default')).toBeTrue();

    toggleSchema('default');
    expect(isSchemaSelected('default')).toBeFalse();

    toggleSchema('default');
    expect(isSchemaSelected('default')).toBeTrue();
  });

  it('should select all schemas', () => {
    clearAllSchemas();
    expect(selectedSchemas().size).toBe(0);

    selectAllSchemas();
    expect(selectedSchemas().size).toBe(mockSchemas.length);
  });

  it('should clear all schemas', () => {
    selectAllSchemas();
    expect(selectedSchemas().size).toBe(mockSchemas.length);

    clearAllSchemas();
    expect(selectedSchemas().size).toBe(0);
  });

  it('should track validating state', () => {
    expect(isValidating()).toBe(false);
    isValidating.set(true);
    expect(isValidating()).toBe(true);
  });

  it('should track validation error', () => {
    expect(validationError()).toBe('');
    validationError.set('Test error message');
    expect(validationError()).toBe('Test error message');
  });
});
