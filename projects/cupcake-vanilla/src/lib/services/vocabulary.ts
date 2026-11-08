import { Service } from '@angular/core';
import { EMPTY, Observable, catchError, expand, map, of, reduce } from 'rxjs';
import { BaseApiService } from '@noatgnu/cupcake-core';

import {
  ONTOLOGY_TYPE_CONFIGS,
  OntologyTypeConfig,
  PaginatedResponse,
  Vocabulary,
  VocabularyCreateRequest,
  VocabularyImportPreview,
  VocabularyImportQueued,
  VocabularyImportRequest,
  VocabularyQueryParams,
  VocabularyTerm,
  VocabularyTermQueryParams,
  VocabularyTermRequest,
  VocabularyUpdateRequest,
  vocabularyChoices
} from '../models';

const PAGE_SIZE = 10;

@Service()
export class VocabularyService extends BaseApiService {

  /**
   * One page of the vocabularies the user can use.
   */
  getVocabularies(params?: VocabularyQueryParams): Observable<PaginatedResponse<Vocabulary>> {
    return this.get<PaginatedResponse<Vocabulary>>(`${this.apiUrl}/vocabularies/`, {
      params: this.buildHttpParams(params)
    });
  }

  /**
   * Every vocabulary the user can use, read page by page.
   */
  getAllVocabularies(params?: Omit<VocabularyQueryParams, 'limit' | 'offset'>): Observable<Vocabulary[]> {
    const page = (offset: number) => this.getVocabularies({ ...params, limit: PAGE_SIZE, offset });
    return page(0).pipe(
      expand((response, index) => response.next ? page((index + 1) * PAGE_SIZE) : EMPTY),
      map(response => response.results),
      reduce((all, results) => [...all, ...results], [] as Vocabulary[])
    );
  }

  /**
   * One vocabulary by its key.
   */
  getVocabulary(key: string): Observable<Vocabulary> {
    return this.get<Vocabulary>(`${this.apiUrl}/vocabularies/${encodeURIComponent(key)}/`);
  }

  /**
   * Ontology type choices for column editors: "None" first, then every usable vocabulary with its filter presets,
   * or the built-in list when the backend has no vocabulary list.
   */
  getOntologyTypeChoices(metadataTable?: number): Observable<OntologyTypeConfig[]> {
    return this.getAllVocabularies(metadataTable ? { metadataTable } : undefined).pipe(
      map(vocabularies => [ONTOLOGY_TYPE_CONFIGS[0], ...vocabularyChoices(vocabularies)]),
      catchError(() => of(ONTOLOGY_TYPE_CONFIGS))
    );
  }

  /**
   * Create a custom vocabulary, global (staff) or for a lab group its user manages.
   */
  createVocabulary(request: VocabularyCreateRequest): Observable<Vocabulary> {
    return this.post<Vocabulary>(`${this.apiUrl}/vocabularies/`, request);
  }

  /**
   * Change a custom vocabulary's details or availability.
   */
  updateVocabulary(key: string, request: VocabularyUpdateRequest): Observable<Vocabulary> {
    return this.patch<Vocabulary>(`${this.apiUrl}/vocabularies/${encodeURIComponent(key)}/`, request);
  }

  /**
   * Let users see and use a plugin vocabulary, or withdraw it again (staff only).
   */
  approveVocabulary(key: string, approved: boolean): Observable<Vocabulary> {
    return this.post<Vocabulary>(`${this.apiUrl}/vocabularies/${encodeURIComponent(key)}/approve/`, { approved });
  }

  /**
   * Delete a custom vocabulary that no column or template uses.
   */
  deleteVocabulary(key: string): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/vocabularies/${encodeURIComponent(key)}/`);
  }

  /**
   * Queue the import of an OBO, OWL, CSV or TSV file into a custom vocabulary.
   */
  importVocabulary(key: string, request: VocabularyImportRequest): Observable<VocabularyImportQueued> {
    const form = new FormData();
    form.append('file', request.file);
    form.append('mode', request.mode);
    if (request.format) {
      form.append('format', request.format);
    }
    if (request.mapping) {
      form.append('name_column', request.mapping.nameColumn);
      form.append('id_column', request.mapping.idColumn ?? '');
      form.append('description_column', request.mapping.descriptionColumn ?? '');
      form.append('synonyms_column', request.mapping.synonymsColumn ?? '');
      form.append('synonym_separator', request.mapping.synonymSeparator ?? ';');
    }
    return this.post<VocabularyImportQueued>(`${this.apiUrl}/vocabularies/${encodeURIComponent(key)}/import/`, form);
  }

  /**
   * The columns and first rows of a CSV or TSV file, to choose which columns to import.
   */
  previewImport(key: string, file: File): Observable<VocabularyImportPreview> {
    const form = new FormData();
    form.append('file', file);
    return this.post<VocabularyImportPreview>(`${this.apiUrl}/vocabularies/${encodeURIComponent(key)}/import_preview/`, form);
  }

  /**
   * One page of a vocabulary's terms.
   */
  getTerms(params: VocabularyTermQueryParams): Observable<PaginatedResponse<VocabularyTerm>> {
    return this.get<PaginatedResponse<VocabularyTerm>>(`${this.apiUrl}/vocabulary-terms/`, {
      params: this.buildHttpParams(params)
    });
  }

  /**
   * Add a term to a custom vocabulary.
   */
  createTerm(request: VocabularyTermRequest): Observable<VocabularyTerm> {
    return this.post<VocabularyTerm>(`${this.apiUrl}/vocabulary-terms/`, request);
  }

  /**
   * Change a term of a custom vocabulary.
   */
  updateTerm(id: number, request: VocabularyTermRequest): Observable<VocabularyTerm> {
    return this.patch<VocabularyTerm>(`${this.apiUrl}/vocabulary-terms/${id}/`, request);
  }

  /**
   * Remove a term from a custom vocabulary.
   */
  deleteTerm(id: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/vocabulary-terms/${id}/`);
  }
}
