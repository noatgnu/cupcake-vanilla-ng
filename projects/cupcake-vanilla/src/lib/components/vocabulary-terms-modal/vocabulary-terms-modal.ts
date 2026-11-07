import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmDialogService, ToastService } from '@noatgnu/cupcake-core';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

import { Vocabulary, VocabularyTerm } from '../../models';
import { VocabularyService } from '../../services/vocabulary';

const PAGE_SIZE = 10;

interface TermDraft {
  externalId: string;
  name: string;
  description: string;
  synonyms: string;
}

const EMPTY_DRAFT: TermDraft = { externalId: '', name: '', description: '', synonyms: '' };

@Component({
  selector: 'ccv-vocabulary-terms-modal',
  imports: [FormsModule],
  templateUrl: './vocabulary-terms-modal.html',
  styleUrl: './vocabulary-terms-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VocabularyTermsModal implements OnInit {
  private vocabularyService = inject(VocabularyService);
  private toastService = inject(ToastService);
  private confirmDialog = inject(ConfirmDialogService);
  private destroyRef = inject(DestroyRef);
  activeModal = inject(NgbActiveModal);

  vocabulary!: Vocabulary;

  terms = signal<VocabularyTerm[]>([]);
  total = signal(0);
  page = signal(0);
  search = signal('');
  includeObsolete = signal(false);
  loading = signal(false);
  editingId = signal<number | null>(null);
  draft = signal<TermDraft>({ ...EMPTY_DRAFT });
  adding = signal(false);
  changed = false;

  readonly pageSize = PAGE_SIZE;
  private searchChanges = new Subject<string>();

  ngOnInit(): void {
    this.searchChanges.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef)).subscribe(text => {
      this.search.set(text);
      this.page.set(0);
      this.load();
    });
    this.load();
  }

  /**
   * Load the current page of terms.
   */
  load(): void {
    this.loading.set(true);
    this.vocabularyService.getTerms({
      vocabulary: this.vocabulary.key,
      search: this.search() || undefined,
      includeObsolete: this.includeObsolete() || undefined,
      limit: PAGE_SIZE,
      offset: this.page() * PAGE_SIZE
    }).subscribe({
      next: response => {
        this.terms.set(response.results);
        this.total.set(response.count);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toastService.error('Failed to load the terms');
      }
    });
  }

  onSearch(text: string): void {
    this.searchChanges.next(text.trim());
  }

  toggleObsolete(include: boolean): void {
    this.includeObsolete.set(include);
    this.page.set(0);
    this.load();
  }

  goToPage(page: number): void {
    this.page.set(page);
    this.load();
  }

  lastPage(): number {
    return Math.max(0, Math.ceil(this.total() / PAGE_SIZE) - 1);
  }

  startAdding(): void {
    this.editingId.set(null);
    this.draft.set({ ...EMPTY_DRAFT });
    this.adding.set(true);
  }

  startEditing(term: VocabularyTerm): void {
    this.adding.set(false);
    this.editingId.set(term.id);
    this.draft.set({
      externalId: term.externalId,
      name: term.name,
      description: term.description,
      synonyms: term.synonyms.join('; ')
    });
  }

  cancelEditing(): void {
    this.adding.set(false);
    this.editingId.set(null);
  }

  setDraft(field: keyof TermDraft, value: string): void {
    this.draft.update(draft => ({ ...draft, [field]: value }));
  }

  /**
   * Save the new term or the changes to the edited one.
   */
  saveDraft(): void {
    const draft = this.draft();
    const synonyms = draft.synonyms.split(';').map(part => part.trim()).filter(Boolean);
    const editingId = this.editingId();
    const request = editingId
      ? this.vocabularyService.updateTerm(editingId, { name: draft.name, description: draft.description, synonyms })
      : this.vocabularyService.createTerm({
          vocabulary: this.vocabulary.key,
          externalId: draft.externalId || draft.name,
          name: draft.name,
          description: draft.description,
          synonyms
        });
    request.subscribe({
      next: () => {
        this.changed = true;
        this.cancelEditing();
        this.toastService.success('Term saved');
        this.load();
      },
      error: error => this.toastService.error(error?.error?.externalId?.[0] || error?.error?.detail || 'Failed to save the term')
    });
  }

  /**
   * Remove a term after confirmation.
   */
  async remove(term: VocabularyTerm): Promise<void> {
    if (!(await this.confirmDialog.confirm({ message: `Remove the term "${term.name}" from ${this.vocabulary.label}?` }))) {
      return;
    }
    this.vocabularyService.deleteTerm(term.id).subscribe({
      next: () => {
        this.changed = true;
        this.toastService.success('Term removed');
        this.load();
      },
      error: () => this.toastService.error('Failed to remove the term')
    });
  }

  close(): void {
    this.activeModal.close(this.changed);
  }
}
