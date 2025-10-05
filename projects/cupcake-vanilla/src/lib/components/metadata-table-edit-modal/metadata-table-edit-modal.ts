import { Component, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal, NgbModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MetadataTable, MetadataTableUpdateRequest, MetadataTableCreateRequest, SampleCountConfirmationError } from '../../models/metadata-table';
import { MetadataTableService } from '../../services/metadata-table';
import { LabGroupService, LabGroup } from '@noatgnu/cupcake-core';

@Component({
  selector: 'ccv-metadata-table-edit-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbModule],
  templateUrl: './metadata-table-edit-modal.html',
  styleUrl: './metadata-table-edit-modal.scss'
})
export class MetadataTableEditModal implements OnInit {
  @Input() table?: MetadataTable; // Make optional for creation mode
  @Input() isCreateMode: boolean = false; // Add flag to determine mode
  @Output() tableSaved = new EventEmitter<MetadataTable>();

  editForm: FormGroup;
  isLoading = signal(false);
  availableLabGroups = signal<LabGroup[]>([]);
  isLoadingLabGroups = signal(false);

  constructor(
    private fb: FormBuilder,
    private activeModal: NgbActiveModal,
    private modalService: NgbModal,
    private metadataTableService: MetadataTableService,
    private labGroupService: LabGroupService
  ) {
    this.editForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      description: [''],
      sampleCount: [1, [Validators.required, Validators.min(1), Validators.max(10000)]],
      version: ['', [Validators.maxLength(50)]],
      labGroup: [null]
    });
  }

  ngOnInit() {
    if (this.table) {
      this.editForm.patchValue({
        name: this.table.name,
        description: this.table.description || '',
        sampleCount: this.table.sampleCount,
        version: this.table.version,
        labGroup: this.table.labGroup || null
      });
    }
    
    this.loadLabGroups();
  }

  loadLabGroups(): void {
    this.isLoadingLabGroups.set(true);
    
    this.labGroupService.getMyLabGroups({ limit: 10 }).subscribe({
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
    if (this.editForm.valid) {
      this.isLoading.set(true);

      const formValue = this.editForm.value;

      if (this.isCreateMode) {
        const createData: MetadataTableCreateRequest = {
          name: formValue.name.trim(),
          description: formValue.description?.trim() || undefined,
          sampleCount: formValue.sampleCount,
          version: formValue.version?.trim() || undefined,
          labGroup: formValue.labGroup || undefined,
          sourceApp: 'cupcake-vanilla'
        };

        this.performCreate(createData);
      } else if (this.table?.id) {
        const updateData: MetadataTableUpdateRequest = {
          name: formValue.name.trim(),
          description: formValue.description?.trim() || undefined,
          sampleCount: formValue.sampleCount,
          version: formValue.version?.trim() || undefined,
          labGroup: formValue.labGroup || undefined
        };

        this.performUpdate(updateData);
      }
    }
  }

  private performCreate(createData: MetadataTableCreateRequest): void {
    this.metadataTableService.createMetadataTable(createData).subscribe({
      next: (newTable) => {
        this.tableSaved.emit(newTable);
        this.activeModal.close(newTable);
      },
      error: (error) => {
        console.error('Error creating metadata table:', error);
        this.isLoading.set(false);
      }
    });
  }

  private performUpdate(updateData: MetadataTableUpdateRequest, confirmed: boolean = false): void {
    if (!this.table?.id) return;

    if (confirmed) {
      updateData.sampleCountConfirmed = true;
    }

    this.metadataTableService.updateMetadataTable(this.table.id, updateData).subscribe({
      next: (updatedTable) => {
        this.tableSaved.emit(updatedTable);
        this.activeModal.close(updatedTable);
      },
      error: (error) => {
        if (this.isSampleCountConfirmationError(error)) {
          this.handleSampleCountConfirmation(error.error, updateData);
        } else {
          console.error('Error updating metadata table:', error);
          this.isLoading.set(false);
        }
      }
    });
  }

  private handleSampleCountConfirmation(errorData: SampleCountConfirmationError, updateData: MetadataTableUpdateRequest): void {
    this.isLoading.set(false);
    const details = errorData.sampleCountConfirmationDetails;

    const message = `Reducing sample count from ${details.currentSampleCount} to ${details.newSampleCount} will remove data:

${details.validationResult.warnings.join('\n')}

${this.formatAffectedData(details.validationResult)}

Do you want to continue?`;

    if (confirm(message)) {
      this.isLoading.set(true);
      this.performUpdate(updateData, true);
    }
  }

  private formatAffectedData(validationResult: any): string {
    let message = '';

    if (validationResult.affectedModifiers?.length > 0) {
      message += `\nAffected column modifiers (${validationResult.affectedModifiers.length}):`;
      validationResult.affectedModifiers.slice(0, 5).forEach((modifier: any) => {
        message += `\n- ${modifier.columnName} (samples: ${modifier.samples})`;
      });
      if (validationResult.affectedModifiers.length > 5) {
        message += `\n- ... and ${validationResult.affectedModifiers.length - 5} more`;
      }
    }

    if (validationResult.affectedPools?.length > 0) {
      message += `\nAffected sample pools (${validationResult.affectedPools.length}):`;
      validationResult.affectedPools.slice(0, 5).forEach((pool: any) => {
        message += `\n- ${pool.poolName}`;
      });
      if (validationResult.affectedPools.length > 5) {
        message += `\n- ... and ${validationResult.affectedPools.length - 5} more`;
      }
    }

    return message;
  }

  private isSampleCountConfirmationError(error: any): error is { error: SampleCountConfirmationError } {
    return error?.error?.sampleCountConfirmationDetails &&
           error?.error?.sampleCountConfirmationDetails?.requiresConfirmation === true;
  }

  onCancel(): void {
    this.activeModal.dismiss();
  }

  get title(): string {
    if (this.isCreateMode) {
      return 'Create New Metadata Table';
    }
    return `Edit ${this.table?.name || 'Metadata Table'}`;
  }

  get hasChanges(): boolean {
    if (this.isCreateMode) {
      return this.editForm.dirty; // For creation mode, any change is valid
    }

    if (!this.table) return false;

    const formValue = this.editForm.value;
    return (
      formValue.name !== this.table.name ||
      formValue.description !== (this.table.description || '') ||
      formValue.sampleCount !== this.table.sampleCount ||
      formValue.version !== this.table.version ||
      formValue.labGroup !== this.table.labGroup
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
    
    const displayName = this.getFieldDisplayName(fieldName);
    
    if (field.errors['required']) {
      return `${displayName} is required`;
    }
    if (field.errors['maxlength']) {
      return `${displayName} must be less than ${field.errors['maxlength'].requiredLength} characters`;
    }
    if (field.errors['min']) {
      return `${displayName} must be at least ${field.errors['min'].min}`;
    }
    if (field.errors['max']) {
      return `${displayName} must be no more than ${field.errors['max'].max}`;
    }
    
    return 'Invalid value';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: Record<string, string> = {
      'name': 'Table name',
      'description': 'Description', 
      'sampleCount': 'Sample count',
      'version': 'Version',
      'labGroup': 'Lab group'
    };
    return displayNames[fieldName] || fieldName;
  }
}