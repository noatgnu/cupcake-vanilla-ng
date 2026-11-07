import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { LabGroup, ToastService } from '@noatgnu/cupcake-core';
import { of, throwError } from 'rxjs';

import { Vocabulary } from '../../models';
import { VocabularyService } from '../../services/vocabulary';
import { VocabularyEditModal } from './vocabulary-edit-modal';

describe('VocabularyEditModal', () => {
  let fixture: ComponentFixture<VocabularyEditModal>;
  let component: VocabularyEditModal;
  let vocabularyService: jasmine.SpyObj<VocabularyService>;
  let toastService: jasmine.SpyObj<ToastService>;
  let activeModal: jasmine.SpyObj<NgbActiveModal>;

  const vocabulary = { key: 'custom.strains', label: 'Strains', kind: 'organism', description: 'Lab strains', sdrfShortName: 'STR', status: 'unavailable' } as Vocabulary;

  beforeEach(async () => {
    vocabularyService = jasmine.createSpyObj('VocabularyService', ['createVocabulary', 'updateVocabulary']);
    toastService = jasmine.createSpyObj('ToastService', ['success', 'error']);
    activeModal = jasmine.createSpyObj('NgbActiveModal', ['close', 'dismiss']);
    await TestBed.configureTestingModule({
      imports: [VocabularyEditModal],
      providers: [
        { provide: VocabularyService, useValue: vocabularyService },
        { provide: ToastService, useValue: toastService },
        { provide: NgbActiveModal, useValue: activeModal }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(VocabularyEditModal);
    component = fixture.componentInstance;
  });

  it('fills the form from the vocabulary being edited', () => {
    component.vocabulary = vocabulary;
    fixture.detectChanges();
    expect(component.form.getRawValue()).toEqual(jasmine.objectContaining({ label: 'Strains', kind: 'organism', sdrfShortName: 'STR', status: 'unavailable' }));
  });

  it('picks the first managed lab group when a global vocabulary is not allowed', () => {
    component.managedLabGroups = [{ id: 7 } as LabGroup];
    fixture.detectChanges();
    expect(component.form.controls.labGroup.value).toBe('7');
  });

  it('creates a lab group vocabulary', () => {
    component.managedLabGroups = [{ id: 7 } as LabGroup];
    fixture.detectChanges();
    vocabularyService.createVocabulary.and.returnValue(of({ ...vocabulary, key: 'custom.strains' }));
    component.form.patchValue({ label: 'Strains', slug: 'strains' });
    component.save();
    expect(vocabularyService.createVocabulary).toHaveBeenCalledWith(jasmine.objectContaining({ label: 'Strains', slug: 'strains', labGroup: 7 }));
    expect(activeModal.close).toHaveBeenCalled();
  });

  it('sends null lab group for a global vocabulary', () => {
    component.canCreateGlobal = true;
    fixture.detectChanges();
    vocabularyService.createVocabulary.and.returnValue(of(vocabulary));
    component.form.patchValue({ label: 'Strains' });
    component.save();
    expect(vocabularyService.createVocabulary).toHaveBeenCalledWith(jasmine.objectContaining({ labGroup: null, slug: undefined }));
  });

  it('updates an existing vocabulary by key', () => {
    component.vocabulary = vocabulary;
    fixture.detectChanges();
    vocabularyService.updateVocabulary.and.returnValue(of(vocabulary));
    component.save();
    expect(vocabularyService.updateVocabulary).toHaveBeenCalledWith('custom.strains', jasmine.objectContaining({ label: 'Strains', status: 'unavailable' }));
  });

  it('does not save an invalid form', () => {
    fixture.detectChanges();
    component.form.patchValue({ label: '', slug: 'Bad Slug' });
    component.save();
    expect(vocabularyService.createVocabulary).not.toHaveBeenCalled();
  });

  it('shows the slug error from the backend', () => {
    component.canCreateGlobal = true;
    fixture.detectChanges();
    vocabularyService.createVocabulary.and.returnValue(throwError(() => ({ error: { slug: ['A vocabulary with this key already exists.'] } })));
    component.form.patchValue({ label: 'Strains' });
    component.save();
    expect(toastService.error).toHaveBeenCalledWith('A vocabulary with this key already exists.');
    expect(component.saving()).toBeFalse();
  });
});
