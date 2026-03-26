import { signal, WritableSignal } from '@angular/core';

interface MetadataTableTemplate {
  id: number;
  name: string;
  description?: string;
}

describe('MetadataTableTemplates', () => {
  let templates: WritableSignal<MetadataTableTemplate[]>;
  let isLoading: WritableSignal<boolean>;

  beforeEach(() => {
    templates = signal<MetadataTableTemplate[]>([]);
    isLoading = signal(false);
  });

  it('should start with empty templates', () => {
    expect(templates().length).toBe(0);
  });

  it('should load templates', () => {
    templates.set([
      { id: 1, name: 'Template 1', description: 'Description 1' },
      { id: 2, name: 'Template 2' }
    ]);
    expect(templates().length).toBe(2);
  });

  it('should track loading state', () => {
    expect(isLoading()).toBe(false);
    isLoading.set(true);
    expect(isLoading()).toBe(true);
  });
});
