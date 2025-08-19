import { Component, Input, Output, EventEmitter, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal, NgbModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MetadataTableTemplate, LabGroup, MetadataColumn } from '../../../shared/models';
import { ColumnEditModal } from '../column-edit-modal/column-edit-modal';

@Component({
  selector: 'app-metadata-table-template-edit-modal',
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
  private _templateColumns = signal<MetadataColumn[]>([]);
  templateColumns = computed(() => {
    // Sort columns by position, then by name+type for grouping same columns together
    return this._templateColumns().sort((a, b) => {
      if (a.column_position !== b.column_position) {
        return (a.column_position || 0) - (b.column_position || 0);
      }
      // Secondary sort: group columns with same name and type together
      const aKey = `${a.name}_${a.type}`;
      const bKey = `${b.name}_${b.type}`;
      return aKey.localeCompare(bKey);
    });
  });

  // Available options for dropdowns
  visibilityOptions = [
    { value: false, label: 'Private' },
    { value: true, label: 'Public' }
  ];

  constructor(
    private fb: FormBuilder,
    private activeModal: NgbActiveModal,
    private modalService: NgbModal
  ) {
    this.editForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      is_public: [false],
      is_default: [false],
      lab_group: [null]
    });
  }

  ngOnInit() {
    if (this.template && this.isEdit) {
      this.populateForm();
    }
  }

  private populateForm() {
    if (this.template) {
      const labGroupId = typeof this.template.lab_group === 'object' 
        ? this.template.lab_group?.id 
        : this.template.lab_group;
      
      this.editForm.patchValue({
        name: this.template.name,
        description: this.template.description || '',
        is_public: this.template.is_public || false,
        is_default: this.template.is_default || false,
        lab_group: labGroupId || null
      });
      
      // Load existing columns if editing
      if (this.template.user_columns) {
        this._templateColumns.set([...this.template.user_columns]);
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
        is_public: formValue.is_public || false,
        is_default: formValue.is_default || false,
        lab_group: formValue.lab_group || null,
        // Include updated columns
        user_columns: this._templateColumns(),
        // Keep existing field mapping if editing
        ...(this.template && {
          field_mask_mapping: this.template.field_mask_mapping
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

  editColumn(column: MetadataColumn) {
    this.openColumnModal(column, true);
  }

  duplicateColumn(column: MetadataColumn) {
    const currentColumns = this._templateColumns();
    const newColumn: MetadataColumn = {
      ...column,
      id: this.generateTempId(), // Generate temporary ID for tracking
      name: `${column.name} (Copy)`,
      column_position: this.getNextPositionForSameType(column)
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

  onColumnDrop(event: CdkDragDrop<MetadataColumn[]>) {
    const currentColumns = [...this._templateColumns()];
    
    // Move the item in the array
    moveItemInArray(currentColumns, event.previousIndex, event.currentIndex);
    
    // Normalize positions and ensure same name/type grouping
    this.normalizeColumnPositions(currentColumns);
    this.enforceGrouping(currentColumns);
    
    this._templateColumns.set(currentColumns);
  }

  private openColumnModal(column: MetadataColumn | null, isEdit: boolean) {
    const modalRef = this.modalService.open(ColumnEditModal, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.componentInstance.column = column;
    modalRef.componentInstance.isEdit = isEdit;

    modalRef.componentInstance.columnSaved.subscribe((columnData: Partial<MetadataColumn>) => {
      this.handleColumnSave(columnData, column, isEdit);
      modalRef.componentInstance.onClose();
    });
  }

  private handleColumnSave(columnData: Partial<MetadataColumn>, originalColumn: MetadataColumn | null, isEdit: boolean) {
    const currentColumns = this._templateColumns();
    
    if (isEdit && originalColumn) {
      // Update existing column
      const updatedColumns = currentColumns.map(col => 
        col.id === originalColumn.id 
          ? { ...col, ...columnData }
          : col
      );
      
      // Check if name/type changed and needs regrouping
      if (columnData.name !== originalColumn.name || columnData.type !== originalColumn.type) {
        this.enforceGrouping(updatedColumns);
      }
      
      this.normalizeColumnPositions(updatedColumns);
      this._templateColumns.set(updatedColumns);
    } else {
      // Add new column
      const newColumn: MetadataColumn = {
        id: this.generateTempId(),
        column_position: this.getNextPositionForNameType(columnData.name!, columnData.type!),
        ...columnData as MetadataColumn
      };
      
      const updatedColumns = [...currentColumns, newColumn];
      this.enforceGrouping(updatedColumns);
      this.normalizeColumnPositions(updatedColumns);
      this._templateColumns.set(updatedColumns);
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
    
    const maxPosition = Math.max(...sameNameTypeColumns.map(col => col.column_position || 0));
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
    
    const maxPosition = Math.max(...sameNameTypeColumns.map(col => col.column_position || 0));
    return maxPosition + 1;
  }

  private normalizeColumnPositions(columns: MetadataColumn[]) {
    columns.forEach((col, index) => {
      col.column_position = index;
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
      groupColumns.sort((a, b) => (a.column_position || 0) - (b.column_position || 0));
      
      groupColumns.forEach(col => {
        col.column_position = position++;
        regroupedColumns.push(col);
      });
    }
    
    // Replace original array contents
    columns.length = 0;
    columns.push(...regroupedColumns);
  }
}
