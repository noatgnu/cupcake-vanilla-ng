import { signal, WritableSignal, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService, LabGroupService } from '@noatgnu/cupcake-core';
import { Subject, of } from 'rxjs';
import { MetadataValueEditModal, MetadataValueEditConfig } from './metadata-value-edit-modal';
import { ExternalVocabularyUpdatedMessage, OntologySuggestion } from '../../models';
import {
  FavouriteMetadataOptionService,
  MetadataColumnService,
  MetadataColumnTemplateService,
  OntologySearchService
} from '../../services';

describe('MetadataValueEditModal', () => {
  let currentValue: WritableSignal<string>;
  let isLoading: WritableSignal<boolean>;

  beforeEach(() => {
    currentValue = signal('');
    isLoading = signal(false);
  });

  it('should initialize with empty value', () => {
    expect(currentValue()).toBe('');
  });

  it('should update value', () => {
    currentValue.set('new value');
    expect(currentValue()).toBe('new value');
  });

  it('should track loading state', () => {
    expect(isLoading()).toBe(false);
    isLoading.set(true);
    expect(isLoading()).toBe(true);
  });
});

describe('MetadataValueEditModal external vocabulary refresh', () => {
  const ripa = { id: '968629', value: 'RIPA Buffer', displayName: 'RIPA Buffer', ontologyType: 'protocols_io_reagent' } as OntologySuggestion;
  const ripaTen = { id: '347401', value: 'RIPA Buffer (10X)', displayName: 'RIPA Buffer (10X)', ontologyType: 'protocols_io_reagent' } as OntologySuggestion;

  let updates: Subject<ExternalVocabularyUpdatedMessage>;
  let columnService: jasmine.SpyObj<MetadataColumnService>;
  let modal: MetadataValueEditModal;

  function update(searchTerm: string, ontologyType = 'protocols_io_reagent'): ExternalVocabularyUpdatedMessage {
    return { type: 'external_vocabulary.updated', ontology_type: ontologyType, search_term: searchTerm, stored: 1 };
  }

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate();
    updates = new Subject<ExternalVocabularyUpdatedMessage>();
    columnService = jasmine.createSpyObj('MetadataColumnService', ['getOntologySuggestions']);
    const ontologySearch = jasmine.createSpyObj('OntologySearchService', ['suggest', 'vocabularyUpdates']);
    ontologySearch.vocabularyUpdates.and.returnValue(updates.asObservable());

    modal = runInInjectionContext(TestBed.inject(EnvironmentInjector), () => new MetadataValueEditModal(
      new FormBuilder(),
      {} as NgbActiveModal,
      {} as AuthService,
      {} as FavouriteMetadataOptionService,
      columnService,
      {} as MetadataColumnTemplateService,
      {} as LabGroupService,
      ontologySearch as OntologySearchService
    ));
    modal.config = {
      columnId: 5,
      columnName: 'reagent',
      columnType: 'characteristics',
      ontologyType: 'protocols_io_reagent',
      enableTypeahead: true,
      context: 'table'
    } as MetadataValueEditConfig;
  });

  it('should search again when platform results arrive for the current term', () => {
    columnService.getOntologySuggestions.and.returnValues(
      of({ suggestions: [ripa], remotePending: true } as any),
      of({ suggestions: [ripa, ripaTen], remotePending: false } as any)
    );
    const text = new Subject<string>();
    const emitted: OntologySuggestion[][] = [];
    const subscription = modal.searchOntology(text).subscribe(results => emitted.push(results));

    text.next('ripa');
    jasmine.clock().tick(201);
    updates.next(update('RIPA'));

    expect(columnService.getOntologySuggestions).toHaveBeenCalledTimes(2);
    expect(columnService.getOntologySuggestions.calls.mostRecent().args[0].search).toBe('ripa');
    expect(emitted.map(results => results.length)).toEqual([1, 2]);
    subscription.unsubscribe();
  });

  it('should ignore updates for another term or vocabulary', () => {
    columnService.getOntologySuggestions.and.returnValue(of({ suggestions: [ripa], remotePending: true } as any));
    const text = new Subject<string>();
    const subscription = modal.searchOntology(text).subscribe();

    text.next('ripa');
    jasmine.clock().tick(201);
    updates.next(update('trypsin'));
    updates.next(update('ripa', 'protocols_io_unit'));

    expect(columnService.getOntologySuggestions).toHaveBeenCalledTimes(1);
    subscription.unsubscribe();
  });
});
