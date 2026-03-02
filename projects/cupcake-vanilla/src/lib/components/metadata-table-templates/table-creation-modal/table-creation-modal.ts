import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { LabGroup } from '@noatgnu/cupcake-core';
import { MetadataTableTemplate } from '../../../models';

export interface TableCreationData {
  name: string;
  templateId: number;
  sampleCount?: number;
  description?: string;
  labGroup?: number;
}

@Component({
  selector: 'ccv-table-creation-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './table-creation-modal.html',
  styleUrl: './table-creation-modal.scss'
})
export class TableCreationModalComponent implements OnInit {
  @Input() template!: MetadataTableTemplate;
  @Input() labGroups: LabGroup[] = [];
  @Input() selectedLabGroup?: number;
  @Output() tableCreated = new EventEmitter<TableCreationData>();

  tableForm: FormGroup;
  isCreating = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    public activeModal: NgbActiveModal
  ) {
    this.tableForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      sampleCount: [1, [Validators.required, Validators.min(1), Validators.max(10000)]],
      description: [''],
      labGroup: [null]
    });
  }

  ngOnInit() {
    // Set default values
    if (this.template) {
      this.tableForm.patchValue({
        name: `${this.template.name} - Table`,
        labGroup: this.selectedLabGroup
      });
    }
  }

  onSubmit() {
    if (this.tableForm.valid && this.template) {
      this.isCreating = true;
      this.errorMessage = null;
      
      const formValue = this.tableForm.value;
      const tableData: TableCreationData = {
        name: formValue.name,
        templateId: this.template.id!,
        sampleCount: formValue.sampleCount || 1,
        description: formValue.description || undefined,
        labGroup: formValue.labGroup || undefined
      };

      this.tableCreated.emit(tableData);
    }
  }

  onClose() {
    this.activeModal.dismiss();
  }

  setCreatingState(isCreating: boolean) {
    this.isCreating = isCreating;
  }

  setErrorMessage(message: string | null) {
    this.errorMessage = message;
  }

  getFieldError(fieldName: string): string | null {
    const field = this.tableForm.get(fieldName);
    if (field?.invalid && field?.touched) {
      if (field.errors?.['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (field.errors?.['minlength']) {
        return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
      if (field.errors?.['min']) {
        return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['min'].min}`;
      }
      if (field.errors?.['max']) {
        return `${this.getFieldLabel(fieldName)} must be at most ${field.errors['max'].max}`;
      }
    }
    return null;
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      name: 'Table name',
      sampleCount: 'Sample count',
      description: 'Description',
      labGroup: 'Lab group'
    };
    return labels[fieldName] || fieldName;
  }
}
