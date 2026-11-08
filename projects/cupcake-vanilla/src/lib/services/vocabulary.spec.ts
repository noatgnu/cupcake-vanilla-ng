import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CUPCAKE_CORE_CONFIG } from '@noatgnu/cupcake-core';

import { VocabularyService } from './vocabulary';
import { ONTOLOGY_TYPE_CONFIGS, Vocabulary, vocabularyChoices } from '../models';

const API = 'http://localhost:8000/api/v1';

function vocabulary(key: string, extra: Partial<Vocabulary> = {}): Vocabulary {
  return { key, label: key, filterPresets: [], ...extra } as Vocabulary;
}

describe('VocabularyService', () => {
  let service: VocabularyService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: API } }
      ]
    });
    service = TestBed.inject(VocabularyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('reads every vocabulary ten at a time with snake_case filters', () => {
    let all: Vocabulary[] = [];
    service.getAllVocabularies({ includeUnapproved: true }).subscribe(result => all = result);

    const first = httpMock.expectOne(r => r.url === `${API}/vocabularies/` && r.params.get('offset') === '0');
    expect(first.request.params.get('limit')).toBe('10');
    expect(first.request.params.get('include_unapproved')).toBe('true');
    first.flush({ count: 11, next: 'more', previous: null, results: Array.from({ length: 10 }, (_, i) => ({ key: `v${i}` })) });

    const second = httpMock.expectOne(r => r.url === `${API}/vocabularies/` && r.params.get('offset') === '10');
    second.flush({ count: 11, next: null, previous: 'back', results: [{ key: 'v10', filter_presets: [] }] });

    expect(all.length).toBe(11);
    expect(all[10].key).toBe('v10');
  });

  it('approves a plugin vocabulary by its dotted key', () => {
    let approved: Vocabulary | undefined;
    service.approveVocabulary('plugin.strain-db.strains', true).subscribe(result => (approved = result));
    const request = httpMock.expectOne(`${API}/vocabularies/plugin.strain-db.strains/approve/`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ approved: true });
    request.flush({ key: 'plugin.strain-db.strains', approved: true, plugin_name: 'strain-db' });
    expect(approved?.pluginName).toBe('strain-db');
  });

  it('looks a vocabulary up by its dotted key', () => {
    service.getVocabulary('custom.lab_strains').subscribe(result => expect(result.labGroupName).toBe('Strain lab'));
    httpMock.expectOne(`${API}/vocabularies/custom.lab_strains/`).flush({ key: 'custom.lab_strains', lab_group_name: 'Strain lab' });
  });

  it('offers one choice per vocabulary, or one per filter preset', () => {
    const choices = vocabularyChoices([
      vocabulary('mondo', { label: 'MONDO Disease' }),
      vocabulary('ms_unique_vocabularies', {
        filterPresets: [
          { label: 'Instrument (MS)', filters: { term_type: 'instrument' } },
          { label: 'Sex (MS)', filters: { term_type: 'sex' } }
        ]
      })
    ]);
    expect(choices.map(choice => choice.label)).toEqual(['MONDO Disease', 'Instrument (MS)', 'Sex (MS)']);
    expect(choices[1]).toEqual({
      value: 'ms_unique_vocabularies',
      label: 'Instrument (MS)',
      customFilters: { ms_unique_vocabularies: { term_type: 'instrument' } }
    });
    expect(choices[0].customFilters).toBeUndefined();
  });

  it('puts "None" first and falls back to the built-in list when the backend has no vocabulary list', () => {
    let choices: { value: string; label: string }[] = [];
    service.getOntologyTypeChoices().subscribe(result => choices = result);
    httpMock.expectOne(r => r.url === `${API}/vocabularies/`).flush('', { status: 404, statusText: 'Not Found' });
    expect(choices).toEqual(ONTOLOGY_TYPE_CONFIGS);

    service.getOntologyTypeChoices().subscribe(result => choices = result);
    httpMock.expectOne(r => r.url === `${API}/vocabularies/`).flush({ count: 1, next: null, previous: null, results: [{ key: 'custom.lab_strains', label: 'Lab strains', filter_presets: [] }] });
    expect(choices.map(choice => choice.label)).toEqual(['None', 'Lab strains']);
  });
});
