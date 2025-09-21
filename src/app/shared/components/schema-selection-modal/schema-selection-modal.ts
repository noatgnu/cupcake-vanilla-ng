import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Schema, SchemaService } from '@cupcake/vanilla';
import { ToastService } from '@cupcake/core';

export interface SchemaSelectionResult {
  selectedSchemaIds: number[];
}

@Component({
  selector: 'app-schema-selection-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbModule],
  templateUrl: './schema-selection-modal.html',
  styleUrl: './schema-selection-modal.scss'
})
export class SchemaSelectionModal implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Modal configuration - set from parent
  title = 'Select Schemas for Column Reordering';
  description = 'Choose which schemas to use for reordering columns. Columns will be ordered based on the selected schemas.';

  // State signals
  isLoading = signal(false);
  availableSchemas = signal<Schema[]>([]);
  selectedSchemaIds = signal<Set<number>>(new Set());
  searchTerm = signal('');

  constructor(
    public activeModal: NgbActiveModal,
    private schemaService: SchemaService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadAvailableSchemas();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAvailableSchemas(): void {
    this.isLoading.set(true);
    
    this.schemaService.getAvailableSchemas().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (schemas) => {
        this.availableSchemas.set(schemas.filter(schema => schema.isActive));
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading schemas:', error);
        this.toastService.error('Failed to load available schemas');
        this.isLoading.set(false);
      }
    });
  }

  get filteredSchemas(): Schema[] {
    const schemas = this.availableSchemas();
    const search = this.searchTerm().toLowerCase();
    
    if (!search) {
      return schemas;
    }
    
    return schemas.filter(schema => 
      schema.name.toLowerCase().includes(search) ||
      schema.description?.toLowerCase().includes(search) ||
      schema.category?.toLowerCase().includes(search)
    );
  }

  toggleSchemaSelection(schemaId: number): void {
    const selected = new Set(this.selectedSchemaIds());
    
    if (selected.has(schemaId)) {
      selected.delete(schemaId);
    } else {
      selected.add(schemaId);
    }
    
    this.selectedSchemaIds.set(selected);
  }

  isSchemaSelected(schemaId: number): boolean {
    return this.selectedSchemaIds().has(schemaId);
  }

  selectAll(): void {
    const allIds = new Set(this.filteredSchemas.map(schema => schema.id));
    this.selectedSchemaIds.set(allIds);
  }

  clearSelection(): void {
    this.selectedSchemaIds.set(new Set());
  }

  onCancel(): void {
    this.activeModal.dismiss();
  }

  onConfirm(): void {
    const selectedIds = Array.from(this.selectedSchemaIds());
    
    if (selectedIds.length === 0) {
      this.toastService.warning('Please select at least one schema');
      return;
    }
    
    const result: SchemaSelectionResult = {
      selectedSchemaIds: selectedIds
    };
    
    this.activeModal.close(result);
  }

  getBadgeClass(category?: string): string {
    if (!category) return 'bg-secondary';
    
    const categoryMap: Record<string, string> = {
      'proteomics': 'bg-primary',
      'genomics': 'bg-success', 
      'metabolomics': 'bg-info',
      'general': 'bg-secondary',
      'custom': 'bg-warning'
    };
    
    return categoryMap[category.toLowerCase()] || 'bg-secondary';
  }
}
