import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { NgbModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ColumnTemplateEditModal } from './column-template-edit-modal/column-template-edit-modal';
import { 
  MetadataColumnTemplate, 
  LabGroup, 
  LabGroupQueryResponse,
  ResourceVisibility
} from '../../shared/models';
import { ApiService } from '../../shared/services/api';

@Component({
  selector: 'app-column-templates',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbModule],
  templateUrl: './column-templates.html',
  styleUrl: './column-templates.scss'
})
export class ColumnTemplatesComponent implements OnInit {
  searchForm: FormGroup;
  
  // Signals for reactive state management
  private searchParams = signal({
    search: '',
    lab_group_id: null as number | null,
    is_global: false,
    limit: 10,
    offset: 0
  });
  
  private labGroupParams = signal({
    limit: 10,
    offset: 0
  });

  // Computed signals for better performance
  isLoading = signal(false);
  selectedLabGroup = signal<LabGroup | null>(null);
  currentPage = signal(1);
  pageSize = signal(10);
  totalItems = signal(0);
  
  labGroupsCurrentPage = signal(1);
  labGroupsPageSize = signal(10);
  labGroupsTotalItems = signal(0);

  // Direct signal-based data management
  templatesData = signal<{count: number, results: MetadataColumnTemplate[]}>({ count: 0, results: [] });
  labGroupsData = signal<LabGroupQueryResponse>({ count: 0, results: [] });

  // Computed values for better performance
  hasTemplates = computed(() => this.templatesData().results.length > 0);
  hasLabGroups = computed(() => this.labGroupsData().results.length > 0);
  showTemplatesPagination = computed(() => this.templatesData().count > this.pageSize());
  showLabGroupsPagination = computed(() => this.labGroupsData().count > this.labGroupsPageSize());

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private modalService: NgbModal
  ) {
    this.searchForm = this.fb.group({
      search: [''],
      lab_group_id: [null],
      is_global: [false]
    });

    // Effect to automatically reload templates when search params change
    effect(() => {
      const params = this.searchParams();
      this.loadTemplatesWithParams(params);
    });

    // Effect to automatically reload lab groups when params change
    effect(() => {
      const params = this.labGroupParams();
      this.loadLabGroupsWithParams(params);
    });
  }

  ngOnInit() {
    this.setupSearch();
    this.loadInitialData();
  }

  private loadInitialData() {
    // Initial load - signals will handle subsequent updates via effects
    this.labGroupParams.set({
      limit: this.labGroupsPageSize(),
      offset: 0
    });
    
    this.searchParams.set({
      search: '',
      lab_group_id: null,
      is_global: false,
      limit: this.pageSize(),
      offset: 0
    });
  }

  private loadLabGroupsWithParams(params: { limit: number; offset: number }) {
    this.apiService.getMyLabGroups(params).subscribe({
      next: (response) => {
        this.labGroupsTotalItems.set(response.count);
        this.labGroupsData.set(response);
      },
      error: (error) => {
        console.error('Error loading lab groups:', error);
        this.labGroupsData.set({ count: 0, results: [] });
      }
    });
  }

  private setupSearch() {
    // Subscribe to form changes and update search params signal
    this.searchForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(formValue => {
      // Reset to first page when searching
      this.currentPage.set(1);
      
      // Update search params signal - this will trigger the effect
      this.searchParams.set({
        search: formValue.search || '',
        lab_group_id: formValue.lab_group_id || null,
        is_global: formValue.is_global || false,
        limit: this.pageSize(),
        offset: 0 // Always start from first page when searching
      });
    });
  }

  private loadTemplatesWithParams(params: any) {
    this.isLoading.set(true);
    
    this.apiService.getColumnTemplates({
      search: params.search || undefined,
      lab_group_id: params.lab_group_id || undefined,
      is_global: params.is_global || undefined,
      limit: params.limit,
      offset: params.offset
    }).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.totalItems.set(response.count);
        this.templatesData.set(response);
      },
      error: (error) => {
        this.isLoading.set(false);
        console.error('Error loading column templates:', error);
        this.templatesData.set({ count: 0, results: [] });
      }
    });
  }

  onLabGroupChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const value = target.value;
    const id = value === 'null' ? null : Number(value);
    const labGroup = id ? this.findLabGroupById(id) : null;
    this.selectedLabGroup.set(labGroup);
    this.currentPage.set(1);
    
    // Update search params - effect will trigger reload
    this.searchParams.update(params => ({
      ...params,
      lab_group_id: id,
      offset: 0
    }));
  }

  private findLabGroupById(id: number): LabGroup | null {
    const labGroups = this.labGroupsData();
    return labGroups.results.find((group: LabGroup) => group.id === id) || null;
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.searchParams.update(params => ({
      ...params,
      offset: (page - 1) * this.pageSize()
    }));
  }

  onLabGroupsPageChange(page: number) {
    this.labGroupsCurrentPage.set(page);
    this.labGroupParams.set({
      limit: this.labGroupsPageSize(),
      offset: (page - 1) * this.labGroupsPageSize()
    });
  }

  createTemplate() {
    this.openTemplateModal(null, false);
  }

  editTemplate(template: MetadataColumnTemplate) {
    this.openTemplateModal(template, true);
  }

  private openTemplateModal(template: MetadataColumnTemplate | null, isEdit: boolean) {
    const modalRef = this.modalService.open(ColumnTemplateEditModal, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.componentInstance.template = template;
    modalRef.componentInstance.labGroups = this.labGroupsData().results;
    modalRef.componentInstance.isEdit = isEdit;

    modalRef.componentInstance.templateSaved.subscribe((templateData: Partial<MetadataColumnTemplate>) => {
      this.handleTemplateSave(templateData, template?.id || null, isEdit);
      modalRef.componentInstance.onClose();
    });
  }

  private handleTemplateSave(templateData: Partial<MetadataColumnTemplate>, templateId: number | null, isEdit: boolean) {
    this.isLoading.set(true);
    
    const apiCall = isEdit && templateId
      ? this.apiService.updateColumnTemplate(templateId, templateData)
      : this.apiService.createColumnTemplate(templateData);

    apiCall.subscribe({
      next: (template) => {
        this.isLoading.set(false);
        console.log(`Column template ${isEdit ? 'updated' : 'created'}:`, template);
        this.refreshTemplates();
      },
      error: (error) => {
        this.isLoading.set(false);
        console.error(`Error ${isEdit ? 'updating' : 'creating'} column template:`, error);
        alert(`Failed to ${isEdit ? 'update' : 'create'} template. Please try again.`);
      }
    });
  }

  deleteTemplate(template: MetadataColumnTemplate) {
    // Enhanced delete confirmation with better UX
    const confirmMessage = `Are you sure you want to delete the column template "${template.name}"?\n\nThis action cannot be undone.`;
    
    if (confirm(confirmMessage)) {
      this.isLoading.set(true);
      this.apiService.deleteColumnTemplate(template.id!).subscribe({
        next: () => {
          this.isLoading.set(false);
          console.log('Column template deleted successfully');
          this.refreshTemplates();
        },
        error: (error) => {
          this.isLoading.set(false);
          console.error('Error deleting column template:', error);
          alert('Failed to delete template. Please try again.');
        }
      });
    }
  }

  duplicateTemplate(template: MetadataColumnTemplate) {
    const duplicatedTemplate: Partial<MetadataColumnTemplate> = {
      name: `${template.name} (Copy)`,
      description: template.description,
      column_name: `${template.column_name}_copy`,
      column_type: template.column_type,
      default_value: template.default_value,
      ontology_type: template.ontology_type,
      visibility: ResourceVisibility.PRIVATE, // Always create as private
      lab_group: template.lab_group || this.selectedLabGroup()?.id || undefined,
      is_active: true
    };
    
    this.isLoading.set(true);
    this.apiService.createColumnTemplate(duplicatedTemplate).subscribe({
      next: (newTemplate) => {
        this.isLoading.set(false);
        console.log('Column template duplicated:', newTemplate);
        this.refreshTemplates();
      },
      error: (error) => {
        this.isLoading.set(false);
        console.error('Error duplicating column template:', error);
        alert('Failed to duplicate template. Please try again.');
      }
    });
  }

  private refreshTemplates() {
    // Trigger a refresh by updating the search params
    this.searchParams.update(params => ({ ...params }));
  }
}
