import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { MetadataColumn } from '../../models';

export interface SearchReplaceConfig {
  context: 'table' | 'column';
  tableId?: number;
  tableName?: string;
  columnId?: number;
  columnName?: string;
  columns?: MetadataColumn[];
}

@Component({
  selector: 'ccv-search-replace-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './search-replace-modal.html',
  styleUrl: './search-replace-modal.scss'
})
export class SearchReplaceModal {
  @Input() config!: SearchReplaceConfig;

  searchReplaceForm: FormGroup;
  isProcessing = signal(false);
  result = signal<{
    message: string;
    oldValue: string;
    newValue: string;
    columnsChecked?: number;
    columnsUpdated?: number;
    defaultValueUpdated?: boolean;
    modifiersMerged?: number;
    modifiersDeleted?: number;
  } | null>(null);

  constructor(
    private fb: FormBuilder,
    public activeModal: NgbActiveModal
  ) {
    this.searchReplaceForm = this.fb.group({
      oldValue: ['', [Validators.required, Validators.minLength(1)]],
      newValue: ['', [Validators.required]],
      columnId: [null],
      columnName: [''],
      updatePools: [false]
    });
  }

  get isTableContext(): boolean {
    return this.config?.context === 'table';
  }

  get isColumnContext(): boolean {
    return this.config?.context === 'column';
  }

  onSubmit() {
    if (this.searchReplaceForm.valid) {
      this.activeModal.close({
        action: 'replace',
        data: this.searchReplaceForm.value
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.searchReplaceForm.controls).forEach(key => {
      const control = this.searchReplaceForm.get(key);
      control?.markAsTouched();
    });
  }

  onCancel() {
    this.activeModal.dismiss();
  }

  getFieldError(fieldName: string): string {
    const control = this.searchReplaceForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) return `${fieldName} is required`;
      if (control.errors['minlength']) return `${fieldName} must be at least ${control.errors['minlength'].requiredLength} characters`;
    }
    return '';
  }
}
