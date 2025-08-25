import { Component, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MetadataTable, LabGroup } from '../../models';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-metadata-table-edit-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbModule],
  templateUrl: './metadata-table-edit-modal.html',
  styleUrl: './metadata-table-edit-modal.scss'
})
export class MetadataTableEditModal implements OnInit {
  @Input() table!: MetadataTable;
  @Output() tableSaved = new EventEmitter<MetadataTable>();

  editForm: FormGroup;
  isLoading = signal(false);
  availableLabGroups = signal<LabGroup[]>([]);
  isLoadingLabGroups = signal(false);

  constructor(
    private fb: FormBuilder,
    private activeModal: NgbActiveModal,
    private apiService: ApiService
  ) {
    this.editForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      description: [''],
      sample_count: [1, [Validators.required, Validators.min(1), Validators.max(10000)]],
      version: ['', [Validators.maxLength(50)]],
      lab_group: [null]
    });
  }

  ngOnInit() {
    if (this.table) {
      this.editForm.patchValue({
        name: this.table.name,
        description: this.table.description || '',
        sample_count: this.table.sample_count,
        version: this.table.version,
        lab_group: this.table.lab_group || null
      });
    }
    
    this.loadLabGroups();
  }

  loadLabGroups(): void {
    this.isLoadingLabGroups.set(true);
    
    this.apiService.getMyLabGroups({ limit: 10 }).subscribe({
      next: (response) => {
        this.availableLabGroups.set(response.results);
        this.isLoadingLabGroups.set(false);
      },
      error: (error) => {
        console.error('Error loading lab groups:', error);
        this.availableLabGroups.set([]);
        this.isLoadingLabGroups.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.editForm.valid && this.table.id) {
      this.isLoading.set(true);
      
      const formValue = this.editForm.value;
      const updateData: Partial<MetadataTable> = {
        name: formValue.name.trim(),
        description: formValue.description?.trim() || undefined,
        sample_count: formValue.sample_count,
        version: formValue.version?.trim() || undefined,
        lab_group: formValue.lab_group || undefined
      };

      this.apiService.updateMetadataTable(this.table.id, updateData).subscribe({
        next: (updatedTable) => {
          this.tableSaved.emit(updatedTable);
          this.activeModal.close(updatedTable);
        },
        error: (error) => {
          console.error('Error updating metadata table:', error);
          this.isLoading.set(false);
        }
      });
    }
  }

  onCancel(): void {
    this.activeModal.dismiss();
  }

  get title(): string {
    return `Edit ${this.table?.name || 'Metadata Table'}`;
  }

  get hasChanges(): boolean {
    if (!this.table) return false;
    
    const formValue = this.editForm.value;
    return (
      formValue.name !== this.table.name ||
      formValue.description !== (this.table.description || '') ||
      formValue.sample_count !== this.table.sample_count ||
      formValue.version !== this.table.version ||
      formValue.lab_group !== this.table.lab_group
    );
  }

  // Form validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.editForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.editForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) {
      return `${this.getFieldDisplayName(fieldName)} is required`;
    }
    if (field.errors['maxlength']) {
      return `${this.getFieldDisplayName(fieldName)} must be less than ${field.errors['maxlength'].requiredLength} characters`;
    }
    if (field.errors['min']) {
      return `${this.getFieldDisplayName(fieldName)} must be at least ${field.errors['min'].min}`;
    }
    if (field.errors['max']) {
      return `${this.getFieldDisplayName(fieldName)} must be no more than ${field.errors['max'].max}`;
    }

    return 'Invalid value';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      'name': 'Table name',
      'description': 'Description',
      'sample_count': 'Sample count',
      'version': 'Version',
      'lab_group': 'Lab group'
    };
    return displayNames[fieldName] || fieldName;
  }
}