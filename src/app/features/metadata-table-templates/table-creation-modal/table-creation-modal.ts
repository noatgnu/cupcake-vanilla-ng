import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { MetadataTableTemplate, LabGroup } from '../../../shared/models';

export interface TableCreationData {
  name: string;
  template_id: number;
  sample_count?: number;
  description?: string;
  lab_group_id?: number;
}

@Component({
  selector: 'app-table-creation-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './table-creation-modal.html',
  styleUrl: './table-creation-modal.scss'
})
export class TableCreationModalComponent implements OnInit {
  @Input() template!: MetadataTableTemplate;
  @Input() labGroups: LabGroup[] = [];
  @Input() selectedLabGroupId?: number;
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
      sample_count: [1, [Validators.required, Validators.min(1), Validators.max(10000)]],
      description: [''],
      lab_group_id: [null]
    });
  }

  ngOnInit() {
    // Set default values
    if (this.template) {
      this.tableForm.patchValue({
        name: `${this.template.name} - Table`,
        lab_group_id: this.selectedLabGroupId
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
        template_id: this.template.id!,
        sample_count: formValue.sample_count || 1,
        description: formValue.description || undefined,
        lab_group_id: formValue.lab_group_id || undefined
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
      sample_count: 'Sample count',
      description: 'Description',
      lab_group_id: 'Lab group'
    };
    return labels[fieldName] || fieldName;
  }
}
