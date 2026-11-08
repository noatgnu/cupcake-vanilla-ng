import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { AuthService, ConfirmDialogService, LabGroup, LabGroupService, ToastService, User } from '@noatgnu/cupcake-core';
import { of, throwError } from 'rxjs';

import { Vocabulary } from '../../models';
import { VocabularyService } from '../../services/vocabulary';
import { VocabularyEditModal } from '../vocabulary-edit-modal/vocabulary-edit-modal';
import { VocabularyManager } from './vocabulary-manager';

describe('VocabularyManager', () => {
  let fixture: ComponentFixture<VocabularyManager>;
  let component: VocabularyManager;
  let vocabularyService: jasmine.SpyObj<VocabularyService>;
  let labGroupService: jasmine.SpyObj<LabGroupService>;
  let modalService: jasmine.SpyObj<NgbModal>;
  let toastService: jasmine.SpyObj<ToastService>;
  let confirmDialog: jasmine.SpyObj<ConfirmDialogService>;
  let currentUser: ReturnType<typeof signal<User | null>>;

  const custom = { key: 'custom.strains', label: 'Strains', provider: 'custom', storage: 'terms', canManage: true, approved: true, termCount: 4, labGroupName: 'Lab A' } as Vocabulary;
  const builtin = { key: 'ncbi_taxonomy', label: 'NCBI Taxonomy', provider: 'builtin', storage: 'builtin', canManage: false, approved: true, termCount: 0, labGroupName: null } as Vocabulary;
  const pending = { key: 'plugin.strain-db.strains', label: 'Strain DB', provider: 'plugin', storage: 'terms', canManage: false, approved: false, termCount: 3, labGroupName: null, pluginName: 'strain-db' } as Vocabulary;

  const setUp = async (groups: LabGroup[][]) => {
    vocabularyService = jasmine.createSpyObj('VocabularyService', ['getVocabularies', 'deleteVocabulary', 'approveVocabulary']);
    vocabularyService.getVocabularies.and.returnValue(of({ count: 12, results: [custom, builtin, pending] }));
    labGroupService = jasmine.createSpyObj('LabGroupService', ['getMyLabGroups']);
    labGroupService.getMyLabGroups.and.returnValues(...groups.map((results, index) => of({
      count: groups.flat().length, next: index < groups.length - 1 ? 'next' : undefined, results
    })));
    modalService = jasmine.createSpyObj('NgbModal', ['open']);
    modalService.open.and.returnValue({ componentInstance: {}, result: new Promise(() => undefined) } as NgbModalRef);
    toastService = jasmine.createSpyObj('ToastService', ['success', 'error']);
    confirmDialog = jasmine.createSpyObj('ConfirmDialogService', ['confirm']);
    currentUser = signal<User | null>({ isStaff: false } as User);
    await TestBed.configureTestingModule({
      imports: [VocabularyManager],
      providers: [
        { provide: VocabularyService, useValue: vocabularyService },
        { provide: LabGroupService, useValue: labGroupService },
        { provide: AuthService, useValue: { currentUser } },
        { provide: NgbModal, useValue: modalService },
        { provide: ToastService, useValue: toastService },
        { provide: ConfirmDialogService, useValue: confirmDialog }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(VocabularyManager);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  it('loads the first page and lists who each vocabulary is available to', async () => {
    await setUp([[]]);
    expect(vocabularyService.getVocabularies).toHaveBeenCalledWith(jasmine.objectContaining({ limit: 10, offset: 0 }));
    expect(component.availableTo(custom)).toBe('Lab A');
    expect(component.availableTo(builtin)).toBe('Everyone');
    expect(component.lastPage()).toBe(1);
  });

  it('collects managed lab groups across pages', async () => {
    await setUp([[{ id: 1, canManage: true } as LabGroup, { id: 2, canManage: false } as LabGroup], [{ id: 3, canManage: true } as LabGroup]]);
    expect(labGroupService.getMyLabGroups).toHaveBeenCalledWith({ limit: 10, offset: 10 });
    expect(component.managedLabGroups().map(group => group.id)).toEqual([1, 3]);
    expect(component.canCreate()).toBeTrue();
  });

  it('does not allow creating without staff or a managed lab group', async () => {
    await setUp([[{ id: 2, canManage: false } as LabGroup]]);
    expect(component.canCreate()).toBeFalse();
    currentUser.set({ isStaff: true } as User);
    expect(component.canCreate()).toBeTrue();
  });

  it('filters by provider from the first page', async () => {
    await setUp([[]]);
    component.goToPage(1);
    component.setProvider('custom');
    expect(vocabularyService.getVocabularies).toHaveBeenCalledWith(jasmine.objectContaining({ provider: 'custom', offset: 0 }));
  });

  it('passes the managed lab groups to the editor', async () => {
    await setUp([[{ id: 1, canManage: true } as LabGroup]]);
    component.create();
    const instance = modalService.open.calls.mostRecent().returnValue.componentInstance;
    expect(modalService.open.calls.mostRecent().args[0]).toBe(VocabularyEditModal);
    expect(instance.vocabulary).toBeNull();
    expect(instance.managedLabGroups.length).toBe(1);
    expect(instance.canCreateGlobal).toBeFalse();
  });

  it('reports a vocabulary still in use instead of deleting it', async () => {
    await setUp([[]]);
    confirmDialog.confirm.and.resolveTo(true);
    vocabularyService.deleteVocabulary.and.returnValue(throwError(() => ({ status: 409, error: { error: 'in use', columns: 2, templates: 1 } })));
    await component.remove(custom);
    expect(vocabularyService.deleteVocabulary).toHaveBeenCalledWith('custom.strains');
    expect(toastService.error).toHaveBeenCalledWith(jasmine.stringContaining('2 columns and 1 templates'));
  });

  it('disables management actions for vocabularies the user cannot manage', async () => {
    await setUp([[]]);
    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    const buttons = (row: Element) => Array.from(row.querySelectorAll('button')) as HTMLButtonElement[];
    expect(buttons(rows[0]).every(button => !button.disabled)).toBeTrue();
    expect(buttons(rows[1]).every(button => button.disabled)).toBeTrue();
  });

  it('lets staff include vocabularies waiting for approval', async () => {
    await setUp([[]]);
    currentUser.set({ isStaff: true } as User);
    fixture.detectChanges();
    component.setShowPending(true);
    expect(vocabularyService.getVocabularies).toHaveBeenCalledWith(jasmine.objectContaining({ includeUnapproved: true, offset: 0 }));
  });

  it('approves a pending plugin vocabulary for staff', async () => {
    await setUp([[]]);
    vocabularyService.approveVocabulary.and.returnValue(of({ ...pending, approved: true }));
    component.toggleApproval(pending);
    expect(vocabularyService.approveVocabulary).toHaveBeenCalledWith('plugin.strain-db.strains', true);
    expect(toastService.success).toHaveBeenCalled();
  });

  it('marks pending plugin vocabularies and keeps approval to staff', async () => {
    await setUp([[]]);
    const row = fixture.nativeElement.querySelectorAll('tbody tr')[2] as HTMLElement;
    expect(row.textContent).toContain('Pending approval');
    expect(row.textContent).toContain('strain-db');
    const toggle = row.querySelector('.approve-toggle') as HTMLButtonElement;
    expect(toggle.disabled).toBeTrue();
    expect(toggle.title).toBe('Only staff approve plugin vocabularies');
    currentUser.set({ isStaff: true } as User);
    fixture.detectChanges();
    expect(toggle.disabled).toBeFalse();
    expect(fixture.nativeElement.querySelectorAll('tbody tr')[0].querySelector('.approve-toggle')).toBeNull();
  });
});
