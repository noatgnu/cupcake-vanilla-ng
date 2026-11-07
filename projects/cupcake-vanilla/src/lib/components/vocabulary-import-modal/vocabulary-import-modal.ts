import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AsyncTaskStatus, TaskStatus, ToastService } from '@noatgnu/cupcake-core';
import { switchMap, takeWhile, timer } from 'rxjs';

import { Vocabulary, VocabularyColumnMapping, VocabularyFileFormat, VocabularyImportPreview } from '../../models';
import { AsyncTaskService } from '../../services/async-task';
import { VocabularyService } from '../../services/vocabulary';

const FORMATS: Record<string, VocabularyFileFormat> = { obo: 'obo', owl: 'owl', csv: 'csv', tsv: 'tsv', txt: 'tsv' };
const POLL_INTERVAL_MS = 2000;
const FINISHED: string[] = [TaskStatus.SUCCESS, TaskStatus.FAILURE, TaskStatus.CANCELLED];

@Component({
  selector: 'ccv-vocabulary-import-modal',
  imports: [FormsModule],
  templateUrl: './vocabulary-import-modal.html',
  styleUrl: './vocabulary-import-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VocabularyImportModal {
  private vocabularyService = inject(VocabularyService);
  private asyncTaskService = inject(AsyncTaskService);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);
  activeModal = inject(NgbActiveModal);

  vocabulary!: Vocabulary;

  file = signal<File | null>(null);
  format = signal<VocabularyFileFormat | null>(null);
  mode = signal<'merge' | 'replace'>('merge');
  preview = signal<VocabularyImportPreview | null>(null);
  mapping = signal<VocabularyColumnMapping>({ nameColumn: '', idColumn: '', descriptionColumn: '', synonymsColumn: '', synonymSeparator: ';' });
  task = signal<AsyncTaskStatus | null>(null);
  busy = signal(false);

  /**
   * Take the chosen file, work out its format and preview CSV and TSV files.
   */
  chooseFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.file.set(file);
    this.preview.set(null);
    const format = file ? FORMATS[file.name.split('.').pop()?.toLowerCase() ?? ''] ?? null : null;
    this.format.set(format);
    if (file && !format) {
      this.toastService.error('Choose an .obo, .owl, .csv or .tsv file');
      return;
    }
    if (file && (format === 'csv' || format === 'tsv')) {
      this.busy.set(true);
      this.vocabularyService.previewImport(this.vocabulary.key, file).subscribe({
        next: preview => {
          this.busy.set(false);
          this.preview.set(preview);
          this.mapping.update(mapping => ({ ...mapping, nameColumn: preview.columns[0] ?? '' }));
        },
        error: error => {
          this.busy.set(false);
          this.toastService.error(error?.error?.error || 'Failed to read the file');
        }
      });
    }
  }

  /**
   * Change one part of the CSV or TSV column mapping.
   */
  setMapping(field: keyof VocabularyColumnMapping, value: string): void {
    this.mapping.update(mapping => ({ ...mapping, [field]: value }));
  }

  /**
   * Whether the file can be imported as chosen.
   */
  ready(): boolean {
    const format = this.format();
    if (!this.file() || !format || this.busy() || this.task()) {
      return false;
    }
    return format === 'obo' || format === 'owl' || !!this.mapping().nameColumn;
  }

  /**
   * Queue the import and follow its task until it ends.
   */
  start(): void {
    const file = this.file();
    const format = this.format();
    if (!file || !format) {
      return;
    }
    this.busy.set(true);
    this.vocabularyService.importVocabulary(this.vocabulary.key, {
      file,
      format,
      mode: this.mode(),
      mapping: format === 'csv' || format === 'tsv' ? this.mapping() : undefined
    }).subscribe({
      next: queued => this.follow(queued.taskId),
      error: error => {
        this.busy.set(false);
        this.toastService.error(error?.error?.error || error?.error?.detail || 'Failed to start the import');
      }
    });
  }

  private follow(taskId: string): void {
    timer(0, POLL_INTERVAL_MS).pipe(
      switchMap(() => this.asyncTaskService.getAsyncTask(taskId)),
      takeWhile(task => !FINISHED.includes(task.status), true),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: task => {
        this.task.set(task);
        if (task.status === TaskStatus.SUCCESS) {
          this.busy.set(false);
          this.toastService.success(`Imported terms into ${this.vocabulary.label}`);
          this.activeModal.close(true);
        } else if (FINISHED.includes(task.status)) {
          this.busy.set(false);
          this.toastService.error(task.errorMessage || 'The import failed');
        }
      },
      error: () => {
        this.busy.set(false);
        this.toastService.error('Lost track of the import; check the task list');
      }
    });
  }
}
