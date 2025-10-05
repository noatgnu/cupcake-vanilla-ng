import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { NgbModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { MetadataTableTemplateEditModal } from './metadata-table-template-edit-modal/metadata-table-template-edit-modal';
import { TemplateSchemaSelectionModal, TemplateSchemaSelectionResult } from './schema-selection-modal/schema-selection-modal';
import { SchemaSelectionModal as ReorderSchemaSelectionModal, SchemaSelectionResult as ReorderSchemaSelectionResult } from '../schema-selection-modal/schema-selection-modal';
import { TableCreationModalComponent, TableCreationData } from './table-creation-modal/table-creation-modal';
import { LabGroupService } from '@noatgnu/cupcake-core';
import { AsyncTaskUIService } from '../async-task-ui';
import { LabGroup, LabGroupQueryResponse, ResourceVisibility } from '@noatgnu/cupcake-core';
import {
  MetadataTableTemplate,
  MetadataTableTemplateQueryResponse,
  MetadataTable,
  MetadataTableTemplateCreateRequest
} from '../../models';
import { MetadataTableTemplateService } from '../../services/metadata-table-template';
import { ToastService } from '@noatgnu/cupcake-core';

@Component({
  selector: 'ccv-metadata-table-templates',
  imports: [CommonModule, ReactiveFormsModule, NgbModule],
  templateUrl: './metadata-table-templates.html',
  styleUrl: './metadata-table-templates.scss'
})
export class MetadataTableTemplates implements OnInit {
  searchForm: FormGroup;

  // Signals for reactive state management
  private searchParams = signal({
    search: '',
    labGroupId: null as number | null,
    visibility: ResourceVisibility.PRIVATE,
    isDefault: false,
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
  templatesData = signal<MetadataTableTemplateQueryResponse>({ count: 0, results: [] });
  labGroupsData = signal<LabGroupQueryResponse>({ count: 0, results: [] });


  // Computed values for better performance
  hasTemplates = computed(() => this.templatesData().results.length > 0);
  hasLabGroups = computed(() => this.labGroupsData().results.length > 0);
  showTemplatesPagination = computed(() => this.templatesData().count > this.pageSize());
  showLabGroupsPagination = computed(() => this.labGroupsData().count > this.labGroupsPageSize());

  // Schema-related properties
  availableSchemas = signal<any[]>([]);
  isLoadingSchemas = signal(false);

  constructor(
    private fb: FormBuilder,
    private metadataTableTemplateService: MetadataTableTemplateService,
    private labGroupService: LabGroupService,
    private modalService: NgbModal,
    private toastService: ToastService,
    private asyncTaskService: AsyncTaskUIService
  ) {
    this.searchForm = this.fb.group({
      search: [''],
      labGroupId: [null],
      visibility: [ResourceVisibility.PRIVATE],
      isDefault: [false]
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
    this.loadAvailableSchemas();
  }

  private loadInitialData() {
    // Initial load - signals will handle subsequent updates via effects
    this.labGroupParams.set({
      limit: this.labGroupsPageSize(),
      offset: 0
    });

    this.searchParams.set({
      search: '',
      labGroupId: null,
      visibility: ResourceVisibility.PRIVATE,
      isDefault: false,
      limit: this.pageSize(),
      offset: 0
    });
  }

  private loadLabGroupsWithParams(params: { limit: number; offset: number }) {
    this.labGroupService.getMyLabGroups(params).subscribe({
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
        labGroupId: formValue.labGroupId || null,
        visibility: formValue.visibility || ResourceVisibility.PRIVATE,
        isDefault: formValue.isDefault || false,
        limit: this.pageSize(),
        offset: 0 // Always start from first page when searching
      });
    });
  }

  private loadTemplatesWithParams(params: any) {
    this.isLoading.set(true);

    this.metadataTableTemplateService.getMetadataTableTemplates({
      search: params.search || undefined,
      labGroupId: params.labGroupId || undefined,
      visibility: params.visibility || undefined,
      isDefault: params.isDefault || undefined,
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
        console.error('Error loading metadata table templates:', error);
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
      labGroupId: id,
      offset: 0
    }));
  }

  private findLabGroupById(id: number): LabGroup | null {
    const labGroups = this.labGroupsData();
    return labGroups.results.find((group: LabGroup) => group.id === id) || null;
  }

  getLabGroupName(labGroupId: number | undefined): string {
    if (!labGroupId) return '-';
    const labGroup = this.findLabGroupById(labGroupId);
    return labGroup?.name || labGroupId.toString();
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

  editTemplate(template: MetadataTableTemplate) {
    this.openTemplateModal(template, true);
  }

  deleteTemplate(template: MetadataTableTemplate) {
    // Enhanced delete confirmation with better UX
    const confirmMessage = `Are you sure you want to delete the template "${template.name}"?\n\nThis action cannot be undone.`;

    if (confirm(confirmMessage)) {
      this.isLoading.set(true);
      this.metadataTableTemplateService.deleteMetadataTableTemplate(template.id!).subscribe({
        next: () => {
          this.isLoading.set(false);
          console.log('Template deleted successfully');
          this.refreshTemplates();
        },
        error: (error) => {
          this.isLoading.set(false);
          console.error('Error deleting template:', error);
          alert('Failed to delete template. Please try again.');
        }
      });
    }
  }

  duplicateTemplate(template: MetadataTableTemplate) {
    const duplicatedTemplate: MetadataTableTemplateCreateRequest = {
      name: `${template.name} (Copy)`,
      description: template.description,
      userColumnIds: [...(template.userColumnIds || [])],
      fieldMaskMapping: { ...template.fieldMaskMapping },
      visibility: ResourceVisibility.PRIVATE, // Always create as private
      isDefault: false, // Never default
      labGroup: template.labGroup || this.selectedLabGroup()?.id || undefined
    };

    this.isLoading.set(true);
    this.metadataTableTemplateService.createMetadataTableTemplate(duplicatedTemplate).subscribe({
      next: (newTemplate) => {
        this.isLoading.set(false);
        console.log('Template duplicated:', newTemplate);
        this.refreshTemplates();
      },
      error: (error) => {
        this.isLoading.set(false);
        console.error('Error duplicating template:', error);
        alert('Failed to duplicate template. Please try again.');
      }
    });
  }

  private openTemplateModal(template: MetadataTableTemplate | null, isEdit: boolean) {
    const modalRef = this.modalService.open(MetadataTableTemplateEditModal, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.componentInstance.template = template;
    modalRef.componentInstance.labGroups = this.labGroupsData().results;
    modalRef.componentInstance.isEdit = isEdit;

    modalRef.componentInstance.templateSaved.subscribe((templateData: Partial<MetadataTableTemplate>) => {
      this.handleTemplateSave(templateData, template?.id || null, isEdit);
      modalRef.componentInstance.onClose();
    });
  }

  private handleTemplateSave(templateData: Partial<MetadataTableTemplate>, templateId: number | null, isEdit: boolean) {
    this.isLoading.set(true);

    const apiCall = isEdit && templateId
      ? this.metadataTableTemplateService.updateMetadataTableTemplate(templateId, templateData)
      : this.metadataTableTemplateService.createMetadataTableTemplate(templateData as MetadataTableTemplateCreateRequest);

    apiCall.subscribe({
      next: (template) => {
        this.isLoading.set(false);
        console.log(`Metadata table template ${isEdit ? 'updated' : 'created'}:`, template);
        this.refreshTemplates();
      },
      error: (error) => {
        this.isLoading.set(false);
        console.error(`Error ${isEdit ? 'updating' : 'creating'} metadata table template:`, error);
        alert(`Failed to ${isEdit ? 'update' : 'create'} template. Please try again.`);
      }
    });
  }

  private refreshTemplates() {
    // Trigger a refresh by updating the search params
    this.searchParams.update(params => ({ ...params }));
  }

  private loadAvailableSchemas() {
    this.isLoadingSchemas.set(true);

    this.metadataTableTemplateService.getAvailableSchemas().subscribe({
      next: (schemas) => {
        this.availableSchemas.set(schemas);
        this.isLoadingSchemas.set(false);
      },
      error: (error) => {
        console.error('Error loading schemas:', error);
        this.isLoadingSchemas.set(false);
      }
    });
  }


  createTemplateWithCustomSchemas() {
    this.openSchemaSelectionModal();
  }

  private openSchemaSelectionModal() {
    const modalRef = this.modalService.open(TemplateSchemaSelectionModal, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    });

    // Pass data to the modal
    modalRef.componentInstance.availableSchemas = this.availableSchemas();
    modalRef.componentInstance.labGroups = this.labGroupsData().results;

    // Handle modal result
    modalRef.componentInstance.templateCreated.subscribe((result: TemplateSchemaSelectionResult) => {
      this.handleSchemaTemplateCreation(result);
      modalRef.close();
    });
  }

  private handleSchemaTemplateCreation(result: TemplateSchemaSelectionResult) {
    this.isLoading.set(true);

    const templateData = {
      name: result.name,
      schemaIds: result.schemaIds,
      description: result.description,
      labGroupId: result.labGroupId,
      visibility: result.visibility,
      isDefault: result.isDefault
    };

    this.metadataTableTemplateService.createFromSchema({
      schemaIds: result.schemaIds,
      name: result.name,
      description: result.description
    }).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        console.log('Template created from schemas:', response);
        this.refreshTemplates();
      },
      error: (error) => {
        this.isLoading.set(false);
        console.error('Error creating template from schemas:', error);
        alert('Failed to create template from schemas. Please try again.');
      }
    });
  }

  createTableFromTemplate(template: MetadataTableTemplate) {
    this.openTableCreationModal(template);
  }

  private openTableCreationModal(template: MetadataTableTemplate) {
    const modalRef = this.modalService.open(TableCreationModalComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.componentInstance.template = template;
    modalRef.componentInstance.labGroups = this.labGroupsData().results;
    modalRef.componentInstance.selectedLabGroupId = this.selectedLabGroup()?.id;

    modalRef.componentInstance.tableCreated.subscribe((tableData: TableCreationData) => {
      this.handleTableCreation(tableData, modalRef);
    });
  }

  private handleTableCreation = (data: TableCreationData, modalRef?: any): void => {
    this.isLoading.set(true);

    // Set creating state on modal if provided
    if (modalRef?.componentInstance) {
      modalRef.componentInstance.setCreatingState(true);
    }

    this.metadataTableTemplateService.createTableFromTemplate({
      templateId: data.templateId,
      name: data.name,
      description: data.description,
      sampleCount: data.sampleCount || 1
    }).subscribe({
      next: (response: MetadataTable) => {
        this.isLoading.set(false);
        console.log('Metadata table created from template:', response);

        // Close modal and show success message
        if (modalRef) {
          modalRef.close();
        }

        this.toastService.success(`Table "${response.name}" created successfully!`);
      },
      error: (error: { error?: { detail?: string; message?: string }; message?: string }) => {
        this.isLoading.set(false);
        console.error('Error creating table from template:', error);

        // Reset creating state on modal if provided and show error
        if (modalRef?.componentInstance) {
          modalRef.componentInstance.setCreatingState(false);
          const errorMsg = error?.error?.detail || error?.error?.message || error?.message || 'Failed to create table from template. Please try again.';
          modalRef.componentInstance.setErrorMessage(errorMsg);
        } else {
          const errorMsg = error?.error?.detail || error?.error?.message || error?.message || 'Failed to create table from template. Please try again.';
          this.toastService.error(errorMsg);
        }
      }
    });
  }

  /**
   * Reorder template columns by schema selection
   */
  reorderTemplateColumns(template: MetadataTableTemplate): void {
    if (!template.columnCount || template.columnCount === 0) {
      this.toastService.warning('Template has no columns to reorder');
      return;
    }

    const modalRef = this.modalService.open(ReorderSchemaSelectionModal, {
      size: 'lg',
      backdrop: 'static'
    });

    modalRef.componentInstance.title = 'Reorder Template Columns by Schema';
    modalRef.componentInstance.description = `Select schemas to reorder columns in template "${template.name}". Columns will be arranged based on the selected schema order.`;

    modalRef.result.then((result: ReorderSchemaSelectionResult) => {
      if (result && result.selectedSchemaIds) {
        this.performTemplateColumnReorder(template.id, result.selectedSchemaIds);
      }
    }).catch(() => {
      // Modal was dismissed - no action needed
    });
  }

  /**
   * Perform the actual template column reordering with async task monitoring
   */
  private performTemplateColumnReorder(templateId: number, schemaIds: number[]): void {
    this.isLoading.set(true);

    this.metadataTableTemplateService.reorderColumnsBySchemaAsync(templateId, schemaIds).subscribe({
      next: (response) => {
        console.log('Template column reorder task started:', response);
        this.toastService.success(`Template column reorder task queued successfully! Task ID: ${response.taskId}`);
        
        // Mark task for monitoring and start real-time updates (same pattern as other async operations)
        this.asyncTaskService.monitorTask(response.taskId);
        this.asyncTaskService.startRealtimeUpdates();
        
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error starting template column reorder:', error);
        this.toastService.error('Failed to start template column reordering');
        this.isLoading.set(false);
      }
    });
  }
}
