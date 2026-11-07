import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AsyncTaskStatus, TaskStatus, ToastService } from '@noatgnu/cupcake-core';
import { of } from 'rxjs';

import { Vocabulary } from '../../models';
import { AsyncTaskService } from '../../services/async-task';
import { VocabularyService } from '../../services/vocabulary';
import { VocabularyImportModal } from './vocabulary-import-modal';

describe('VocabularyImportModal', () => {
  let fixture: ComponentFixture<VocabularyImportModal>;
  let component: VocabularyImportModal;
  let vocabularyService: jasmine.SpyObj<VocabularyService>;
  let asyncTaskService: jasmine.SpyObj<AsyncTaskService>;
  let toastService: jasmine.SpyObj<ToastService>;
  let activeModal: jasmine.SpyObj<NgbActiveModal>;

  const choose = (name: string) => component.chooseFile({ target: { files: [new File(['x'], name)] } } as unknown as Event);

  beforeEach(async () => {
    vocabularyService = jasmine.createSpyObj('VocabularyService', ['previewImport', 'importVocabulary']);
    asyncTaskService = jasmine.createSpyObj('AsyncTaskService', ['getAsyncTask']);
    toastService = jasmine.createSpyObj('ToastService', ['success', 'error']);
    activeModal = jasmine.createSpyObj('NgbActiveModal', ['close', 'dismiss']);
    await TestBed.configureTestingModule({
      imports: [VocabularyImportModal],
      providers: [
        { provide: VocabularyService, useValue: vocabularyService },
        { provide: AsyncTaskService, useValue: asyncTaskService },
        { provide: ToastService, useValue: toastService },
        { provide: NgbActiveModal, useValue: activeModal }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(VocabularyImportModal);
    component = fixture.componentInstance;
    component.vocabulary = { key: 'custom.strains', label: 'Strains', termCount: 0 } as Vocabulary;
    fixture.detectChanges();
    jasmine.clock().install();
  });

  afterEach(() => jasmine.clock().uninstall());

  it('is ready for an OBO file without a preview', () => {
    choose('terms.obo');
    expect(component.format()).toBe('obo');
    expect(vocabularyService.previewImport).not.toHaveBeenCalled();
    expect(component.ready()).toBeTrue();
  });

  it('previews a CSV file and maps the first column to the name', () => {
    vocabularyService.previewImport.and.returnValue(of({ columns: ['label', 'id'], rows: [['a', '1']] }));
    choose('terms.csv');
    expect(component.mapping().nameColumn).toBe('label');
    expect(component.ready()).toBeTrue();
  });

  it('treats a .txt file as TSV', () => {
    vocabularyService.previewImport.and.returnValue(of({ columns: ['name'], rows: [] }));
    choose('terms.txt');
    expect(component.format()).toBe('tsv');
  });

  it('rejects an unknown file type', () => {
    choose('terms.xlsx');
    expect(toastService.error).toHaveBeenCalled();
    expect(component.ready()).toBeFalse();
  });

  it('queues the import and closes when the task succeeds', () => {
    vocabularyService.importVocabulary.and.returnValue(of({ taskId: 'task-1', message: 'queued' }));
    asyncTaskService.getAsyncTask.and.returnValue(of({ id: 'task-1', status: TaskStatus.SUCCESS } as AsyncTaskStatus));
    choose('terms.obo');
    component.mode.set('replace');
    component.start();
    jasmine.clock().tick(1);
    expect(vocabularyService.importVocabulary).toHaveBeenCalledWith('custom.strains', jasmine.objectContaining({ format: 'obo', mode: 'replace', mapping: undefined }));
    expect(activeModal.close).toHaveBeenCalledWith(true);
  });

  it('reports a failed task', () => {
    vocabularyService.importVocabulary.and.returnValue(of({ taskId: 'task-1', message: 'queued' }));
    asyncTaskService.getAsyncTask.and.returnValue(of({ id: 'task-1', status: TaskStatus.FAILURE, errorMessage: 'Bad file' } as AsyncTaskStatus));
    choose('terms.owl');
    component.start();
    jasmine.clock().tick(1);
    expect(toastService.error).toHaveBeenCalledWith('Bad file');
    expect(activeModal.close).not.toHaveBeenCalled();
  });
});
