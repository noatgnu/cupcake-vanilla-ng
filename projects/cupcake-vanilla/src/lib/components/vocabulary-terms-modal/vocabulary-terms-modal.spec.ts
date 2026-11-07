import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmDialogService, ToastService } from '@noatgnu/cupcake-core';
import { of } from 'rxjs';

import { Vocabulary, VocabularyTerm } from '../../models';
import { VocabularyService } from '../../services/vocabulary';
import { VocabularyTermsModal } from './vocabulary-terms-modal';

describe('VocabularyTermsModal', () => {
  let fixture: ComponentFixture<VocabularyTermsModal>;
  let component: VocabularyTermsModal;
  let vocabularyService: jasmine.SpyObj<VocabularyService>;
  let confirmDialog: jasmine.SpyObj<ConfirmDialogService>;
  let activeModal: jasmine.SpyObj<NgbActiveModal>;

  const term = { id: 3, vocabulary: 'custom.strains', externalId: 'STR:1', name: 'wild type', description: '', synonyms: ['wt', 'WT'], obsolete: false } as VocabularyTerm;

  beforeEach(async () => {
    vocabularyService = jasmine.createSpyObj('VocabularyService', ['getTerms', 'createTerm', 'updateTerm', 'deleteTerm']);
    vocabularyService.getTerms.and.returnValue(of({ count: 25, results: [term] }));
    confirmDialog = jasmine.createSpyObj('ConfirmDialogService', ['confirm']);
    activeModal = jasmine.createSpyObj('NgbActiveModal', ['close', 'dismiss']);
    await TestBed.configureTestingModule({
      imports: [VocabularyTermsModal],
      providers: [
        { provide: VocabularyService, useValue: vocabularyService },
        { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['success', 'error']) },
        { provide: ConfirmDialogService, useValue: confirmDialog },
        { provide: NgbActiveModal, useValue: activeModal }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(VocabularyTermsModal);
    component = fixture.componentInstance;
    component.vocabulary = { key: 'custom.strains', label: 'Strains', canManage: true } as Vocabulary;
    fixture.detectChanges();
  });

  it('loads the first page of terms for the vocabulary', () => {
    expect(vocabularyService.getTerms).toHaveBeenCalledWith(jasmine.objectContaining({ vocabulary: 'custom.strains', limit: 10, offset: 0 }));
    expect(component.terms()).toEqual([term]);
    expect(component.lastPage()).toBe(2);
  });

  it('asks for obsolete terms when toggled', () => {
    component.toggleObsolete(true);
    expect(vocabularyService.getTerms).toHaveBeenCalledWith(jasmine.objectContaining({ includeObsolete: true }));
  });

  it('pages with offset', () => {
    component.goToPage(2);
    expect(vocabularyService.getTerms).toHaveBeenCalledWith(jasmine.objectContaining({ offset: 20 }));
  });

  it('creates a term, using the name as id when none is given', () => {
    vocabularyService.createTerm.and.returnValue(of(term));
    component.startAdding();
    component.setDraft('name', 'mutant');
    component.setDraft('synonyms', 'mut; m ;');
    component.saveDraft();
    expect(vocabularyService.createTerm).toHaveBeenCalledWith({ vocabulary: 'custom.strains', externalId: 'mutant', name: 'mutant', description: '', synonyms: ['mut', 'm'] });
    expect(component.adding()).toBeFalse();
  });

  it('updates the edited term', () => {
    vocabularyService.updateTerm.and.returnValue(of(term));
    component.startEditing(term);
    expect(component.draft().synonyms).toBe('wt; WT');
    component.setDraft('name', 'wildtype');
    component.saveDraft();
    expect(vocabularyService.updateTerm).toHaveBeenCalledWith(3, { name: 'wildtype', description: '', synonyms: ['wt', 'WT'] });
  });

  it('removes a term only after confirmation', async () => {
    vocabularyService.deleteTerm.and.returnValue(of(undefined));
    confirmDialog.confirm.and.resolveTo(false);
    await component.remove(term);
    expect(vocabularyService.deleteTerm).not.toHaveBeenCalled();
    confirmDialog.confirm.and.resolveTo(true);
    await component.remove(term);
    expect(vocabularyService.deleteTerm).toHaveBeenCalledWith(3);
  });

  it('closes reporting whether terms changed', () => {
    vocabularyService.createTerm.and.returnValue(of(term));
    component.startAdding();
    component.setDraft('name', 'mutant');
    component.saveDraft();
    component.close();
    expect(activeModal.close).toHaveBeenCalledWith(true);
  });
});
