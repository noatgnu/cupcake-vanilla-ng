import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService, ConfirmDialogService, LabGroup, LabGroupService, ToastService } from '@noatgnu/cupcake-core';
import { EMPTY, Subject, debounceTime, distinctUntilChanged, expand, map, reduce } from 'rxjs';

import { Vocabulary, VocabularyInUse, VocabularyProvider } from '../../models';
import { VocabularyService } from '../../services/vocabulary';
import { VocabularyEditModal } from '../vocabulary-edit-modal/vocabulary-edit-modal';
import { VocabularyImportModal } from '../vocabulary-import-modal/vocabulary-import-modal';
import { VocabularyTermsModal } from '../vocabulary-terms-modal/vocabulary-terms-modal';

const PAGE_SIZE = 10;

export const PROVIDER_LABELS: Record<VocabularyProvider, string> = {
  builtin: 'Built-in',
  addon: 'Add-on',
  custom: 'Custom',
  plugin: 'Plugin'
};

@Component({
  selector: 'ccv-vocabulary-manager',
  imports: [FormsModule, DatePipe],
  templateUrl: './vocabulary-manager.html',
  styleUrl: './vocabulary-manager.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VocabularyManager implements OnInit {
  private vocabularyService = inject(VocabularyService);
  private labGroupService = inject(LabGroupService);
  private authService = inject(AuthService);
  private modalService = inject(NgbModal);
  private toastService = inject(ToastService);
  private confirmDialog = inject(ConfirmDialogService);
  private destroyRef = inject(DestroyRef);

  vocabularies = signal<Vocabulary[]>([]);
  total = signal(0);
  page = signal(0);
  search = signal('');
  provider = signal<VocabularyProvider | ''>('');
  showPending = signal(false);
  loading = signal(false);
  managedLabGroups = signal<LabGroup[]>([]);

  isStaff = computed(() => !!this.authService.currentUser()?.isStaff);
  canCreate = computed(() => this.isStaff() || this.managedLabGroups().length > 0);

  readonly providerLabels = PROVIDER_LABELS;
  readonly providers = Object.keys(PROVIDER_LABELS) as VocabularyProvider[];
  readonly pageSize = PAGE_SIZE;
  private searchChanges = new Subject<string>();

  ngOnInit(): void {
    this.searchChanges.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef)).subscribe(text => {
      this.search.set(text);
      this.page.set(0);
      this.load();
    });
    this.loadManagedLabGroups();
    this.load();
  }

  /**
   * Load the current page of vocabularies.
   */
  load(): void {
    this.loading.set(true);
    this.vocabularyService.getVocabularies({
      search: this.search() || undefined,
      provider: this.provider() || undefined,
      includeUnapproved: this.showPending() || undefined,
      limit: PAGE_SIZE,
      offset: this.page() * PAGE_SIZE
    }).subscribe({
      next: response => {
        this.vocabularies.set(response.results);
        this.total.set(response.count);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toastService.error('Failed to load the vocabularies');
      }
    });
  }

  onSearch(text: string): void {
    this.searchChanges.next(text.trim());
  }

  setProvider(provider: VocabularyProvider | ''): void {
    this.provider.set(provider);
    this.page.set(0);
    this.load();
  }

  setShowPending(show: boolean): void {
    this.showPending.set(show);
    this.page.set(0);
    this.load();
  }

  /**
   * Approve a plugin vocabulary so users can use it, or withdraw the approval.
   */
  toggleApproval(vocabulary: Vocabulary): void {
    const approved = !vocabulary.approved;
    this.vocabularyService.approveVocabulary(vocabulary.key, approved).subscribe({
      next: () => {
        this.toastService.success(approved ? `${vocabulary.label} is now available to users` : `${vocabulary.label} is hidden from users`);
        this.load();
      },
      error: error => this.toastService.error(error?.error?.error || 'Failed to change the approval')
    });
  }

  goToPage(page: number): void {
    this.page.set(page);
    this.load();
  }

  lastPage(): number {
    return Math.max(0, Math.ceil(this.total() / PAGE_SIZE) - 1);
  }

  create(): void {
    this.openEditor(null);
  }

  edit(vocabulary: Vocabulary): void {
    this.openEditor(vocabulary);
  }

  openImport(vocabulary: Vocabulary): void {
    const modalRef = this.modalService.open(VocabularyImportModal, { size: 'lg', backdrop: 'static' });
    modalRef.componentInstance.vocabulary = vocabulary;
    modalRef.result.then(() => this.load(), () => this.load());
  }

  openTerms(vocabulary: Vocabulary): void {
    const modalRef = this.modalService.open(VocabularyTermsModal, { size: 'xl', scrollable: true });
    modalRef.componentInstance.vocabulary = vocabulary;
    modalRef.result.then(changed => changed && this.load(), () => undefined);
  }

  /**
   * Delete a custom vocabulary after confirmation; one still in use is reported instead.
   */
  async remove(vocabulary: Vocabulary): Promise<void> {
    const message = `Delete the vocabulary "${vocabulary.label}" and its ${vocabulary.termCount} terms? This cannot be undone.`;
    if (!(await this.confirmDialog.confirm({ message }))) {
      return;
    }
    this.vocabularyService.deleteVocabulary(vocabulary.key).subscribe({
      next: () => {
        this.toastService.success('Vocabulary deleted');
        this.load();
      },
      error: error => {
        const inUse = error?.error as VocabularyInUse | undefined;
        this.toastService.error(
          error?.status === 409 && inUse
            ? `Still used by ${inUse.columns} columns and ${inUse.templates} templates; make it unavailable instead`
            : 'Failed to delete the vocabulary'
        );
      }
    });
  }

  availableTo(vocabulary: Vocabulary): string {
    return vocabulary.labGroupName ?? 'Everyone';
  }

  private openEditor(vocabulary: Vocabulary | null): void {
    const modalRef = this.modalService.open(VocabularyEditModal, { backdrop: 'static' });
    modalRef.componentInstance.vocabulary = vocabulary;
    modalRef.componentInstance.managedLabGroups = this.managedLabGroups();
    modalRef.componentInstance.canCreateGlobal = this.isStaff();
    modalRef.result.then(() => this.load(), () => undefined);
  }

  private loadManagedLabGroups(): void {
    const page = (offset: number) => this.labGroupService.getMyLabGroups({ limit: PAGE_SIZE, offset });
    page(0).pipe(
      expand((response, index) => response.next ? page((index + 1) * PAGE_SIZE) : EMPTY),
      map(response => response.results.filter(group => group.canManage)),
      reduce((all, groups) => [...all, ...groups], [] as LabGroup[])
    ).subscribe({
      next: groups => this.managedLabGroups.set(groups),
      error: () => this.managedLabGroups.set([])
    });
  }
}
