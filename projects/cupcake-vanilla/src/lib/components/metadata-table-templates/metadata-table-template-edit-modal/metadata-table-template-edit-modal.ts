import { Component, Input, Output, EventEmitter, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal, NgbModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { LabGroup, ResourceVisibility } from '@noatgnu/cupcake-core';
import { MetadataTableTemplate, MetadataColumn } from '../../../models';
import { MetadataTableTemplateService } from '../../../services/metadata-table-template';
import { MetadataColumnService } from '../../../services/metadata-column';
import { ColumnEditModal } from '../column-edit-modal/column-edit-modal';
import { ToastService } from '@noatgnu/cupcake-core';

@Component({
  selector: 'ccv-metadata-table-template-edit-modal',
  imports: [CommonModule, ReactiveFormsModule, NgbModule, DragDropModule],
  templateUrl: './metadata-table-template-edit-modal.html',
  styleUrl: './metadata-table-template-edit-modal.scss'
})
export class MetadataTableTemplateEditModal implements OnInit {
  @Input() template: MetadataTableTemplate | null = null;
  @Input() labGroups: LabGroup[] = [];
  @Input() isEdit = false;
  @Output() templateSaved = new EventEmitter<Partial<MetadataTableTemplate>>();

  editForm: FormGroup;
  isLoading = signal(false);

  // Column management
  _templateColumns = signal<MetadataColumn[]>([]);
  selectedColumnIds = signal<Set<number>>(new Set());
  recentlyModifiedColumnId = signal<number | null>(null);

  templateColumns = computed(() => {
    // Sort columns by position, then by name+type for grouping same columns together
    return this._templateColumns().sort((a, b) => {
      if (a.columnPosition !== b.columnPosition) {
        return (a.columnPosition || 0) - (b.columnPosition || 0);
      }
      // Secondary sort: group columns with same name and type together
      const aKey = `${a.name}_${a.type}`;
      const bKey = `${b.name}_${b.type}`;
      return aKey.localeCompare(bKey);
    });
  });

  allColumnsSelected = computed(() => {
    const columns = this._templateColumns();
    const selected = this.selectedColumnIds();
    return columns.length > 0 && columns.every(col => col.id && selected.has(col.id));
  });

  someColumnsSelected = computed(() => {
    const columns = this._templateColumns();
    const selected = this.selectedColumnIds();
    return columns.some(col => col.id && selected.has(col.id)) && !this.allColumnsSelected();
  });

  // Available options for dropdowns
  visibilityOptions = [
    { value: ResourceVisibility.PRIVATE, label: 'Private' },
    { value: ResourceVisibility.GROUP, label: 'Lab Group' },
    { value: ResourceVisibility.PUBLIC, label: 'Public' }
  ];

  constructor(
    private fb: FormBuilder,
    private activeModal: NgbActiveModal,
    private modalService: NgbModal,
    private metadataTableTemplateService: MetadataTableTemplateService,
    private metadataColumnService: MetadataColumnService,
    private toastService: ToastService
  ) {
    this.editForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      visibility: [ResourceVisibility.PRIVATE],
      isDefault: [false],
      labGroupId: [null]
    });
  }

  ngOnInit() {
    if (this.template && this.isEdit) {
      this.populateForm();
    }
  }

  private populateForm() {
    if (this.template) {
      const labGroupId = this.template.labGroup;
      
      this.editForm.patchValue({
        name: this.template.name,
        description: this.template.description || '',
        visibility: this.template.visibility || ResourceVisibility.PRIVATE,
        isDefault: this.template.isDefault || false,
        labGroupId: labGroupId || null
      });
      
      // Load existing columns if editing
      if (this.template.userColumns) {
        this._templateColumns.set([...this.template.userColumns]);
      }
    }
  }

  onSubmit() {
    if (this.editForm.valid) {
      this.isLoading.set(true);
      const formValue = this.editForm.value;
      
      // Clean up form data
      const templateData: Partial<MetadataTableTemplate> = {
        name: formValue.name,
        description: formValue.description || '',
        visibility: formValue.visibility || ResourceVisibility.PRIVATE,
        isDefault: formValue.isDefault || false,
        labGroup: formValue.labGroupId || null,
        // Include updated columns
        userColumns: this._templateColumns(),
        // Keep existing field mapping if editing
        ...(this.template && {
          fieldMaskMapping: this.template.fieldMaskMapping
        })
      };

      this.templateSaved.emit(templateData);
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.editForm.controls).forEach(key => {
      const control = this.editForm.get(key);
      control?.markAsTouched();
    });
  }

  onCancel() {
    this.activeModal.dismiss();
  }

  onClose() {
    this.isLoading.set(false);
    this.activeModal.close();
  }

  getFieldError(fieldName: string): string {
    const control = this.editForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) return `${fieldName} is required`;
      if (control.errors['minlength']) return `${fieldName} must be at least ${control.errors['minlength'].requiredLength} characters`;
    }
    return '';
  }

  get title(): string {
    return this.isEdit ? 'Edit Table Template' : 'Create Table Template';
  }

  // Column Management Methods

  addColumn() {
    this.openColumnModal(null, false);
  }

  addColumnWithAutoReorder() {
    // Only available for existing templates
    if (!this.isEdit || !this.template?.id) {
      this.toastService.error('Auto-reorder is only available for existing templates');
      return;
    }
    this.openColumnModal(null, false, true);
  }

  editColumn(column: MetadataColumn) {
    this.openColumnModal(column, true);
  }

  duplicateColumn(column: MetadataColumn) {
    const currentColumns = this._templateColumns();
    const newColumn: MetadataColumn = {
      ...column,
      id: this.generateTempId(), // Generate temporary ID for tracking
      name: `${column.name} (Copy)`,
      columnPosition: this.getNextPositionForSameType(column)
    };

    // Add the duplicated column right after columns with same name/type
    const updatedColumns = [...currentColumns, newColumn];
    this.normalizeColumnPositions(updatedColumns);
    this._templateColumns.set(updatedColumns);
  }

  removeColumn(column: MetadataColumn) {
    const confirmMessage = `Are you sure you want to remove the column "${column.name}"?`;

    if (confirm(confirmMessage)) {
      const currentColumns = this._templateColumns();
      const updatedColumns = currentColumns.filter(col => col.id !== column.id);
      this.normalizeColumnPositions(updatedColumns);
      this._templateColumns.set(updatedColumns);
    }
  }

  toggleColumnSelection(columnId: number): void {
    const selected = new Set(this.selectedColumnIds());
    if (selected.has(columnId)) {
      selected.delete(columnId);
    } else {
      selected.add(columnId);
    }
    this.selectedColumnIds.set(selected);
  }

  toggleAllColumns(): void {
    const columns = this._templateColumns();
    if (this.allColumnsSelected()) {
      this.selectedColumnIds.set(new Set());
    } else {
      const allIds = new Set(columns.filter(col => col.id).map(col => col.id!));
      this.selectedColumnIds.set(allIds);
    }
  }

  bulkToggleStaffOnly(staffOnly: boolean): void {
    const selected = this.selectedColumnIds();
    if (selected.size === 0) {
      this.toastService.error('Please select columns first');
      return;
    }

    if (!this.template?.id) {
      this.toastService.error('Template ID not found');
      return;
    }

    const columnIds = Array.from(selected);

    this.isLoading.set(true);
    this.metadataTableTemplateService.bulkUpdateStaffOnly(this.template.id, {
      columnIds,
      staffOnly
    }).subscribe({
      next: (result) => {
        this.isLoading.set(false);
        this.toastService.success(`Updated ${result.updatedCount} column(s)`);
        this.selectedColumnIds.set(new Set());
        this.reloadTemplateColumns();
      },
      error: (error) => {
        this.isLoading.set(false);
        console.error('Error bulk updating columns:', error);
        this.toastService.error('Failed to update columns');
      }
    });
  }

  bulkDeleteColumns(): void {
    const selected = this.selectedColumnIds();
    if (selected.size === 0) {
      this.toastService.error('Please select columns first');
      return;
    }

    if (!this.template?.id) {
      this.toastService.error('Template ID not found');
      return;
    }

    const columnIds = Array.from(selected);
    const columnNames = this._templateColumns()
      .filter(col => col.id && selected.has(col.id))
      .map(col => col.name)
      .join(', ');

    if (!confirm(`Are you sure you want to delete ${columnIds.length} column(s)?\n\n${columnNames}`)) {
      return;
    }

    this.isLoading.set(true);
    this.metadataTableTemplateService.bulkDeleteColumns(this.template.id, {
      columnIds
    }).subscribe({
      next: (result) => {
        this.isLoading.set(false);
        this.toastService.success(`Deleted ${result.deletedCount} column(s)`);
        this.selectedColumnIds.set(new Set());
        this.reloadTemplateColumns();
      },
      error: (error) => {
        this.isLoading.set(false);
        console.error('Error bulk deleting columns:', error);
        this.toastService.error('Failed to delete columns');
      }
    });
  }

  onColumnDrop(event: CdkDragDrop<MetadataColumn[]>) {
    // If dropped in the same position, no action needed
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    const currentColumns = [...this._templateColumns()];
    
    // Move the item in the array
    moveItemInArray(currentColumns, event.previousIndex, event.currentIndex);
    
    // Normalize positions and ensure same name/type grouping
    this.normalizeColumnPositions(currentColumns);
    this.enforceGrouping(currentColumns);
    
    this._templateColumns.set(currentColumns);
  }

  private openColumnModal(column: MetadataColumn | null, isEdit: boolean, useAutoReorder: boolean = false) {
    const modalRef = this.modalService.open(ColumnEditModal, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.componentInstance.column = column;
    modalRef.componentInstance.templateId = this.template?.id || null;
    modalRef.componentInstance.isEdit = isEdit;

    modalRef.componentInstance.columnSaved.subscribe((columnData: Partial<MetadataColumn>) => {
      if (useAutoReorder && this.template?.id) {
        this.handleColumnSaveWithAutoReorder(columnData);
      } else {
        this.handleColumnSave(columnData, column, isEdit);
      }
      modalRef.componentInstance.onClose();
    });
  }

  private handleColumnSave(columnData: Partial<MetadataColumn>, originalColumn: MetadataColumn | null, isEdit: boolean) {
    const currentColumns = this._templateColumns();

    if (isEdit && originalColumn && originalColumn.id) {
      this.isLoading.set(true);
      this.metadataColumnService.patchMetadataColumn(originalColumn.id, columnData).subscribe({
        next: (updatedColumn) => {
          this.isLoading.set(false);
          const updatedColumns = currentColumns.map(col =>
            col.id === originalColumn.id
              ? updatedColumn
              : col
          );

          if (columnData.name !== originalColumn.name || columnData.type !== originalColumn.type) {
            this.enforceGrouping(updatedColumns);
          }

          this.normalizeColumnPositions(updatedColumns);
          this._templateColumns.set(updatedColumns);
          this.toastService.success('Column updated successfully');

          this.recentlyModifiedColumnId.set(updatedColumn.id);
          setTimeout(() => {
            this.recentlyModifiedColumnId.set(null);
          }, 3000);
        },
        error: (error) => {
          this.isLoading.set(false);
          console.error('Error updating column:', error);
          this.toastService.error('Failed to update column');
        }
      });
    } else {
      const newColumn: MetadataColumn = {
        ...columnData as MetadataColumn,
        id: this.generateTempId(),
        columnPosition: this.getNextPositionForNameType(columnData.name!, columnData.type!)
      };

      const updatedColumns = [...currentColumns, newColumn];
      this.enforceGrouping(updatedColumns);
      this.normalizeColumnPositions(updatedColumns);
      this._templateColumns.set(updatedColumns);
    }
  }

  private handleColumnSaveWithAutoReorder(columnData: Partial<MetadataColumn>): void {
    if (!this.template?.id) {
      this.toastService.error('Template ID not found');
      return;
    }

    this.isLoading.set(true);
    
    this.metadataTableTemplateService.addColumnWithAutoReorder(this.template.id, {
      columnData: columnData
    }).subscribe({
      next: (response: { message: string; column: any; reordered: boolean; schemaIdsUsed: number[] }) => {
        this.isLoading.set(false);
        
        // Refresh the template data by reloading it
        this.reloadTemplateColumns();
        
        // Show success message with reordering info
        let message = `Column "${response.column.name}" added successfully!`;
        if (response.reordered) {
          message += ` Columns reordered using ${response.schemaIdsUsed.length} schema(s).`;
        }
        
        this.toastService.success(message);
      },
      error: (error) => {
        this.isLoading.set(false);
        console.error('Error adding column with auto-reorder:', error);
        this.toastService.error('Failed to add column with auto-reorder');
      }
    });
  }

  private reloadTemplateColumns(): void {
    if (this.template?.id) {
      this.metadataTableTemplateService.getMetadataTableTemplate(this.template.id).subscribe({
        next: (updatedTemplate) => {
          this._templateColumns.set([...updatedTemplate.userColumns || []]);
        },
        error: (error) => {
          console.error('Error reloading template columns:', error);
        }
      });
    }
  }

  private generateTempId(): number {
    // Generate a temporary negative ID for new columns
    const currentColumns = this._templateColumns();
    const minId = Math.min(0, ...currentColumns.map(col => col.id || 0));
    return minId - 1;
  }

  private getNextPositionForSameType(column: MetadataColumn): number {
    const currentColumns = this._templateColumns();
    const sameNameTypeColumns = currentColumns.filter(col => 
      col.name === column.name && col.type === column.type
    );
    
    if (sameNameTypeColumns.length === 0) {
      return currentColumns.length;
    }
    
    const maxPosition = Math.max(...sameNameTypeColumns.map(col => col.columnPosition || 0));
    return maxPosition + 1;
  }

  private getNextPositionForNameType(name: string, type: string): number {
    const currentColumns = this._templateColumns();
    const sameNameTypeColumns = currentColumns.filter(col => 
      col.name === name && col.type === type
    );
    
    if (sameNameTypeColumns.length === 0) {
      return currentColumns.length;
    }
    
    const maxPosition = Math.max(...sameNameTypeColumns.map(col => col.columnPosition || 0));
    return maxPosition + 1;
  }

  private normalizeColumnPositions(columns: MetadataColumn[]) {
    columns.forEach((col, index) => {
      col.columnPosition = index;
    });
  }

  private enforceGrouping(columns: MetadataColumn[]) {
    // Group columns by name+type and ensure they are together
    const groups = new Map<string, MetadataColumn[]>();
    
    columns.forEach(col => {
      const key = `${col.name}_${col.type}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(col);
    });
    
    // Rebuild array with proper grouping
    let position = 0;
    const regroupedColumns: MetadataColumn[] = [];
    
    for (const [key, groupColumns] of groups) {
      // Sort within group by original position to maintain relative order
      groupColumns.sort((a, b) => (a.columnPosition || 0) - (b.columnPosition || 0));
      
      groupColumns.forEach(col => {
        col.columnPosition = position++;
        regroupedColumns.push(col);
      });
    }
    
    // Replace original array contents
    columns.length = 0;
    columns.push(...regroupedColumns);
  }
}
