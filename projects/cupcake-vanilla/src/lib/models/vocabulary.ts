import { OntologyTypeConfig } from './ontology-config';

export type VocabularyProvider = 'builtin' | 'addon' | 'custom' | 'plugin';

export type VocabularyStorage = 'builtin' | 'terms';

export type VocabularyStatus = 'active' | 'loading' | 'unavailable' | 'disabled';

export interface VocabularyFilterPreset {
  label: string;
  filters: Record<string, string>;
}

export interface VocabularySourceVersion {
  version: string;
  released: string | null;
  sourceUrl: string;
  retrievedAt: string;
}

export interface Vocabulary {
  id: number;
  key: string;
  label: string;
  kind: string;
  description: string;
  provider: VocabularyProvider;
  storage: VocabularyStorage;
  status: VocabularyStatus;
  approved: boolean;
  labGroup: number | null;
  labGroupName: string | null;
  owner: number | null;
  ownerUsername: string | null;
  plugin: number | null;
  pluginName: string | null;
  sdrfShortName: string;
  minTermLength: number;
  filterPresets: VocabularyFilterPreset[];
  liveSearch: boolean;
  canManage: boolean;
  termCount: number;
  lastLoadedAt: string | null;
  lastError: string;
  sourceVersion: VocabularySourceVersion | null;
  createdAt: string;
  updatedAt: string;
}

export interface VocabularyQueryParams {
  provider?: VocabularyProvider;
  kind?: string;
  status?: VocabularyStatus;
  labGroup?: number;
  search?: string;
  includeUnapproved?: boolean;
  metadataTable?: number;
  limit?: number;
  offset?: number;
}

/**
 * Ontology type choices for column editors: one per vocabulary, or one per filter preset of vocabularies that have presets.
 */
export function vocabularyChoices(vocabularies: Vocabulary[]): OntologyTypeConfig[] {
  return vocabularies.flatMap((vocabulary): OntologyTypeConfig[] =>
    vocabulary.filterPresets.length
      ? vocabulary.filterPresets.map(preset => ({
          value: vocabulary.key,
          label: preset.label,
          customFilters: { [vocabulary.key]: preset.filters }
        }))
      : [{ value: vocabulary.key, label: vocabulary.label, customFilters: undefined }]
  );
}

export interface VocabularyCreateRequest {
  label: string;
  slug?: string;
  kind?: string;
  description?: string;
  labGroup?: number | null;
  sdrfShortName?: string;
}

export interface VocabularyUpdateRequest {
  label?: string;
  kind?: string;
  description?: string;
  sdrfShortName?: string;
  status?: 'active' | 'unavailable';
}

export type VocabularyFileFormat = 'obo' | 'owl' | 'csv' | 'tsv';

export interface VocabularyColumnMapping {
  nameColumn: string;
  idColumn?: string;
  descriptionColumn?: string;
  synonymsColumn?: string;
  synonymSeparator?: string;
}

export interface VocabularyImportRequest {
  file: File;
  format?: VocabularyFileFormat;
  mode: 'merge' | 'replace';
  mapping?: VocabularyColumnMapping;
}

export interface VocabularyImportPreview {
  columns: string[];
  rows: string[][];
}

export interface VocabularyImportQueued {
  taskId: string;
  message: string;
}

export interface VocabularyInUse {
  error: string;
  columns: number;
  templates: number;
}

export interface VocabularyTerm {
  id: number;
  vocabulary: string;
  externalId: string;
  name: string;
  description: string;
  synonyms: string[];
  obsolete: boolean;
  data: Record<string, unknown>;
  fetchedAt: string;
}

export interface VocabularyTermRequest {
  vocabulary?: string;
  externalId?: string;
  name?: string;
  description?: string;
  synonyms?: string[];
  obsolete?: boolean;
}

export interface VocabularyTermQueryParams {
  vocabulary: string;
  search?: string;
  includeObsolete?: boolean;
  metadataTable?: number;
  limit?: number;
  offset?: number;
}
