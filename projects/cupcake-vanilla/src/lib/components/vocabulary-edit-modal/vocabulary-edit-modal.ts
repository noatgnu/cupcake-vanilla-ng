import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { LabGroup, ToastService } from '@noatgnu/cupcake-core';

import { Vocabulary } from '../../models';
import { VocabularyService } from '../../services/vocabulary';

@Component({
  selector: 'ccv-vocabulary-edit-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './vocabulary-edit-modal.html',
  styleUrl: './vocabulary-edit-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VocabularyEditModal implements OnInit {
  private fb = inject(FormBuilder);
  private vocabularyService = inject(VocabularyService);
  private toastService = inject(ToastService);
  activeModal = inject(NgbActiveModal);

  vocabulary: Vocabulary | null = null;
  managedLabGroups: LabGroup[] = [];
  canCreateGlobal = false;

  saving = signal(false);

  form = this.fb.nonNullable.group({
    label: ['', [Validators.required, Validators.maxLength(255)]],
    slug: ['', Validators.pattern(/^[a-z0-9][a-z0-9_]{1,59}$/)],
    kind: [''],
    description: [''],
    sdrfShortName: [''],
    labGroup: [''],
    status: ['active' as 'active' | 'unavailable']
  });

  ngOnInit(): void {
    const vocabulary = this.vocabulary;
    if (vocabulary) {
      this.form.patchValue({
        label: vocabulary.label,
        kind: vocabulary.kind,
        description: vocabulary.description,
        sdrfShortName: vocabulary.sdrfShortName,
        status: vocabulary.status === 'unavailable' ? 'unavailable' : 'active'
      });
    } else if (!this.canCreateGlobal && this.managedLabGroups.length) {
      this.form.controls.labGroup.setValue(String(this.managedLabGroups[0].id));
    }
  }

  /**
   * Create the vocabulary, or save the changes to it.
   */
  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const vocabulary = this.vocabulary;
    const request = vocabulary
      ? this.vocabularyService.updateVocabulary(vocabulary.key, {
          label: value.label,
          kind: value.kind,
          description: value.description,
          sdrfShortName: value.sdrfShortName,
          status: value.status
        })
      : this.vocabularyService.createVocabulary({
          label: value.label,
          slug: value.slug || undefined,
          kind: value.kind,
          description: value.description,
          sdrfShortName: value.sdrfShortName,
          labGroup: value.labGroup ? Number(value.labGroup) : null
        });
    this.saving.set(true);
    request.subscribe({
      next: saved => {
        this.saving.set(false);
        this.toastService.success(vocabulary ? 'Vocabulary saved' : `Vocabulary ${saved.key} created`);
        this.activeModal.close(saved);
      },
      error: error => {
        this.saving.set(false);
        const detail = error?.error;
        this.toastService.error(detail?.slug?.[0] || detail?.error || detail?.detail || 'Failed to save the vocabulary');
      }
    });
  }
}
