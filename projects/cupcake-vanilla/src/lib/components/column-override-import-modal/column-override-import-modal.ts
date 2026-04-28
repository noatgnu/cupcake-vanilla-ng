import { ChangeDetectionStrategy, Component, Input, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MetadataTableService } from '../../services/metadata-table';
import {
  ColumnOverrideMappingEntry,
  ColumnOverrideImportOptions,
  ColumnOverrideSuggestResult,
  ColumnOverridePreviewResult,
  ColumnOverrideCommitResult,
} from '../../models/metadata-table';

export interface ColumnOverrideImportModalConfig {
  tableId: number;
  tableName: string;
  sampleCount: number;
}

type Step = 'upload' | 'map' | 'preview' | 'confirming' | 'done';
type Algorithm = 'name' | 'position' | 'none';

@Component({
  selector: 'ccv-column-override-import-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbModule],
  templateUrl: './column-override-import-modal.html',
  styleUrl: './column-override-import-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColumnOverrideImportModal {
  @Input() config!: ColumnOverrideImportModalConfig;

  private activeModal = inject(NgbActiveModal);
  private tableService = inject(MetadataTableService);
  private fb = inject(FormBuilder);

  readonly step = signal<Step>('upload');
  readonly selectedFile = signal<File | null>(null);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  readonly suggestResult = signal<ColumnOverrideSuggestResult | null>(null);
  readonly userMapping = signal<ColumnOverrideMappingEntry[]>([]);
  readonly previewResult = signal<ColumnOverridePreviewResult | null>(null);
  readonly commitResult = signal<ColumnOverrideCommitResult | null>(null);

  readonly optionsForm: FormGroup = this.fb.group({
    algorithm: ['name'],
    updateValue: [true],
    updateModifiers: [true],
    normalizeOntology: [true],
  });

  readonly mappedColumnIds = computed(() =>
    new Set(this.userMapping().filter(e => e.columnId !== null).map(e => e.columnId as number))
  );

  readonly newColumnCount = computed(() =>
    this.userMapping().filter(e => e.columnId === null).length
  );

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile.set(input.files?.[0] ?? null);
    this.error.set(null);
  }

  generateMapping(): void {
    const file = this.selectedFile();
    if (!file) return;

    this.isLoading.set(true);
    this.error.set(null);

    const algorithm = this.optionsForm.value.algorithm as Algorithm;
    this.tableService.suggestColumnMapping(this.config.tableId, file, algorithm).subscribe({
      next: (result) => {
        this.suggestResult.set(result);
        this.userMapping.set(result.suggestedMapping.map(e => ({ ...e })));
        this.step.set('map');
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.error ?? 'Failed to parse file');
        this.isLoading.set(false);
      },
    });
  }

  updateMappingEntry(fileColIndex: number, value: string): void {
    const columnId = value === 'null' ? null : parseInt(value, 10);
    this.userMapping.update(mapping =>
      mapping.map(e => e.fileColIndex === fileColIndex ? { ...e, columnId } : e)
    );
  }

  removeMappingEntry(fileColIndex: number): void {
    this.userMapping.update(mapping => mapping.filter(e => e.fileColIndex !== fileColIndex));
  }

  restoreMappingEntry(fileColIndex: number): void {
    const result = this.suggestResult();
    if (!result) return;
    const header = result.fileHeaders.find(h => h.fileColIndex === fileColIndex);
    if (!header) return;
    const alreadyPresent = this.userMapping().some(e => e.fileColIndex === fileColIndex);
    if (!alreadyPresent) {
      this.userMapping.update(mapping => [...mapping, { fileColIndex, columnId: null }]);
    }
  }

  isIgnored(fileColIndex: number): boolean {
    return !this.userMapping().some(e => e.fileColIndex === fileColIndex);
  }

  getColumnIdForFileCol(fileColIndex: number): string {
    const entry = this.userMapping().find(e => e.fileColIndex === fileColIndex);
    if (!entry) return '__ignored__';
    return entry.columnId === null ? 'null' : String(entry.columnId);
  }

  reapplyAlgorithm(): void {
    const file = this.selectedFile();
    if (!file) return;

    this.isLoading.set(true);
    this.error.set(null);

    const algorithm = this.optionsForm.value.algorithm as Algorithm;
    this.tableService.suggestColumnMapping(this.config.tableId, file, algorithm).subscribe({
      next: (result) => {
        this.suggestResult.set(result);
        this.userMapping.set(result.suggestedMapping.map(e => ({ ...e })));
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.error ?? 'Failed to regenerate mapping');
        this.isLoading.set(false);
      },
    });
  }

  preview(): void {
    const file = this.selectedFile();
    if (!file) return;

    this.isLoading.set(true);
    this.error.set(null);

    const opts = this.buildOptions();
    this.tableService.previewColumnOverride(this.config.tableId, file, this.userMapping(), opts).subscribe({
      next: (result) => {
        this.previewResult.set(result);
        this.step.set('preview');
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.error ?? 'Preview failed');
        this.isLoading.set(false);
      },
    });
  }

  confirm(): void {
    const file = this.selectedFile();
    if (!file) return;

    this.step.set('confirming');
    this.isLoading.set(true);
    this.error.set(null);

    const opts = this.buildOptions();
    this.tableService.commitColumnOverride(this.config.tableId, file, this.userMapping(), opts).subscribe({
      next: (result) => {
        this.commitResult.set(result);
        this.step.set('done');
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.error ?? 'Import failed');
        this.step.set('preview');
        this.isLoading.set(false);
      },
    });
  }

  backToUpload(): void {
    this.step.set('upload');
    this.error.set(null);
  }

  backToMap(): void {
    this.step.set('map');
    this.error.set(null);
    this.previewResult.set(null);
  }

  close(): void {
    this.activeModal.close(this.commitResult());
  }

  dismiss(): void {
    this.activeModal.dismiss();
  }

  private buildOptions(): ColumnOverrideImportOptions {
    const v = this.optionsForm.value;
    return {
      updateValue: v.updateValue,
      updateModifiers: v.updateModifiers,
      normalizeOntology: v.normalizeOntology,
    };
  }
}
