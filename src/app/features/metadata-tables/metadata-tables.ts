import { Component, OnInit, OnDestroy, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { NgbModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import {
  MetadataTable,
  MetadataTableQueryResponse,
  LabGroup,
  LabGroupQueryResponse
} from '../../shared/models';
import { User, LabGroupService } from '@cupcake/core';
import { MetadataTableService, MetadataValidationConfig } from '@cupcake/vanilla';
import { NavigationState } from '../../shared/services/navigation-state';
import { AsyncTaskService } from '../../shared/services/async-task';
import { ToastService } from '../../shared/services/toast';
import { MetadataValidationModal } from '../../shared/components/metadata-validation-modal/metadata-validation-modal';
import { ExcelExportModalComponent, ExcelExportOptions } from '../../shared/components/excel-export-modal/excel-export-modal';
import { environment } from '../../../environments/environment';
import { AuthService } from '@cupcake/core';

@Component({
  selector: 'app-metadata-tables',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, NgbModule],
  templateUrl: './metadata-tables.html',
  styleUrl: './metadata-tables.scss'
})
export class MetadataTablesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  searchForm: FormGroup;

  // Signals for reactive state management
  private searchParams = signal({
    search: '',
    labGroupId: null as number | null,
    isLocked: null as boolean | null,
    isPublished: null as boolean | null,
    showShared: false,
    adminView: false,
    limit: 12,
    offset: 0
  });

  private labGroupParams = signal({
    limit: 10,
    offset: 0
  });

  // State signals
  isLoading = signal(false);
  selectedLabGroup = signal<LabGroup | null>(null);
  currentPage = signal(1);
  pageSize = signal(12);
  totalItems = signal(0);

  labGroupsCurrentPage = signal(1);
  labGroupsPageSize = signal(10);
  labGroupsTotalItems = signal(0);

  // Data signals
  tablesData = signal<MetadataTableQueryResponse>({ count: 0, results: [] });
  labGroupsData = signal<LabGroupQueryResponse>({ count: 0, results: [] });

  // Bulk selection signals
  selectedTables = signal<Set<number>>(new Set());
  selectAllChecked = signal<boolean>(false);
  selectAllIndeterminate = signal<boolean>(false);

  // User and permission state
  currentUser = signal<User | null>(null);
  isStaff = computed(() => this.currentUser()?.isStaff === true);
  showSharedTables = signal(false);
  showAdminView = signal(false);

  // Computed values
  hasTables = computed(() => this.tablesData().results.length > 0);
  hasLabGroups = computed(() => this.labGroupsData().results.length > 0);
  showTablesPagination = computed(() => this.tablesData().count > this.pageSize());
  showLabGroupsPagination = computed(() => this.labGroupsData().count > this.labGroupsPageSize());
  hasSelectedTables = computed(() => this.selectedTables().size > 0);
  selectedTablesCount = computed(() => this.selectedTables().size);

  constructor(
    private fb: FormBuilder,
    private labGroupService: LabGroupService,
    private metadataTableService: MetadataTableService,
    private navigationState: NavigationState,
    private asyncTaskService: AsyncTaskService,
    private toastService: ToastService,
    private modalService: NgbModal,
    private authService: AuthService
  ) {
    this.searchForm = this.fb.group({
      search: [''],
      labGroupId: [null],
      isLocked: [null],
      isPublished: [null],
      showShared: [false],
      adminView: [false]
    });

    // Effect to automatically reload tables when search params change
    effect(() => {
      const params = this.searchParams();
      this.loadTablesWithParams(params);
    });

    // Effect to update search params when permission toggles change
    effect(() => {
      const showShared = this.showSharedTables();
      const adminView = this.showAdminView();

      this.searchParams.update(params => ({
        ...params,
        showShared: showShared,
        adminView: adminView,
        offset: 0
      }));
    });

    // Effect to automatically reload lab groups when params change
    effect(() => {
      const params = this.labGroupParams();
      this.loadLabGroupsWithParams(params);
    });

    // Effect to update select all state when tables change
    effect(() => {
      this.tablesData(); // React to changes
      this.updateSelectAllState();
    });
  }

  ngOnInit(): void {
    this.initializeUser();
    this.setupSearch();
    this.loadInitialData();
    this.setupAsyncTaskRefreshListener();
  }

  private initializeUser(): void {
    // Get current user and set up user state
    const user = this.authService.getCurrentUser();
    this.currentUser.set(user);

    // Subscribe to user changes
    this.authService.currentUser$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(user => {
      this.currentUser.set(user);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupAsyncTaskRefreshListener(): void {
    // Listen for metadata table refresh events when import tasks complete
    this.asyncTaskService.metadataTableRefresh$.pipe(
      takeUntil(this.destroy$)
    ).subscribe((tableId: number) => {
      console.log(`Import task completed for table ${tableId}, refreshing tables list`);
      this.toastService.info('Refreshing table data after successful import');
      this.refreshTables();
    });
  }

  private loadInitialData() {
    // Load lab groups first
    this.labGroupParams.set({
      limit: this.labGroupsPageSize(),
      offset: 0
    });

    // Load tables
    this.searchParams.set({
      search: '',
      labGroupId: null,
      isLocked: null,
      isPublished: null,
      showShared: this.showSharedTables(),
      adminView: this.showAdminView(),
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
    this.searchForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(formValue => {
      this.currentPage.set(1);

      this.searchParams.set({
        search: formValue.search || '',
        labGroupId: formValue.labGroupId || null,
        isLocked: formValue.isLocked,
        isPublished: formValue.isPublished,
        showShared: this.showSharedTables(),
        adminView: this.showAdminView(),
        limit: this.pageSize(),
        offset: 0
      });
    });
  }

  private loadTablesWithParams(params: any): void {
    this.isLoading.set(true);

    const requestParams = {
      search: params.search || undefined,
      labGroupId: params.labGroupId || undefined,
      isLocked: params.isLocked,
      isPublished: params.isPublished,
      showShared: params.showShared || false,
      adminView: params.adminView || false,
      limit: params.limit,
      offset: params.offset
    };

    this.metadataTableService.getMetadataTables(requestParams).subscribe({
      next: (response: MetadataTableQueryResponse) => {
        this.isLoading.set(false);
        this.totalItems.set(response.count);
        this.tablesData.set(response);
      },
      error: (error: any) => {
        this.isLoading.set(false);
        console.error('Error loading metadata tables:', error);
        this.tablesData.set({ count: 0, results: [] });
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

  deleteTable(table: MetadataTable) {
    const confirmMessage = `Are you sure you want to delete the table "${table.name}"?\n\nThis action cannot be undone.`;

    if (confirm(confirmMessage)) {
      this.isLoading.set(true);
      this.metadataTableService.deleteMetadataTable(table.id!).subscribe({
        next: () => {
          console.log('Metadata table deleted successfully');
          this.toastService.success(`Table "${table.name}" deleted successfully!`);
          this.refreshTables();
        },
        error: (error) => {
          this.isLoading.set(false);
          console.error('Error deleting metadata table:', error);
          const errorMsg = error?.error?.detail || error?.message || 'Failed to delete table. Please try again.';
          this.toastService.error(errorMsg);
        }
      });
    }
  }

  private refreshTables() {
    this.searchParams.update(params => ({ ...params }));
  }

  navigateToTemplates(): void {
    this.navigationState.setNavigationType('template');
  }

  getTableStatusBadge(table: MetadataTable): string {
    if (table.isPublished) return 'Published';
    if (table.isLocked) return 'Locked';
    return 'Draft';
  }

  getTableStatusClass(table: MetadataTable): string {
    if (table.isPublished) return 'bg-success';
    if (table.isLocked) return 'bg-warning';
    return 'bg-secondary';
  }

  /**
   * Toggle selection of all visible tables
   */
  toggleSelectAll(event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    const currentSelected = this.selectedTables();
    const visibleTables = this.tablesData().results;

    if (isChecked) {
      // Select all visible tables
      const newSelection = new Set(currentSelected);
      visibleTables.forEach(table => {
        if (table.id) newSelection.add(table.id);
      });
      this.selectedTables.set(newSelection);
    } else {
      // Deselect all visible tables
      const newSelection = new Set(currentSelected);
      visibleTables.forEach(table => {
        if (table.id) newSelection.delete(table.id);
      });
      this.selectedTables.set(newSelection);
    }

    this.updateSelectAllState();
  }

  /**
   * Toggle selection of a specific table
   */
  toggleTableSelection(table: MetadataTable, event: Event): void {
    event.stopPropagation();
    const isChecked = (event.target as HTMLInputElement).checked;
    const currentSelected = this.selectedTables();
    const newSelection = new Set(currentSelected);

    if (table.id) {
      if (isChecked) {
        newSelection.add(table.id);
      } else {
        newSelection.delete(table.id);
      }
    }

    this.selectedTables.set(newSelection);
    this.updateSelectAllState();
  }

  /**
   * Check if a table is selected
   */
  isTableSelected(table: MetadataTable): boolean {
    return table.id ? this.selectedTables().has(table.id) : false;
  }

  /**
   * Update select all checkbox state
   */
  private updateSelectAllState(): void {
    const visibleTables = this.tablesData().results;
    const visibleTableIds = visibleTables.map(t => t.id).filter(id => id !== undefined) as number[];
    const selectedCount = visibleTableIds.filter(id => this.selectedTables().has(id)).length;

    this.selectAllChecked.set(selectedCount === visibleTableIds.length && visibleTableIds.length > 0);
    this.selectAllIndeterminate.set(selectedCount > 0 && selectedCount < visibleTableIds.length);
  }

  /**
   * Clear all selections
   */
  clearSelection(): void {
    this.selectedTables.set(new Set());
    this.updateSelectAllState();
  }

  /**
   * Bulk export SDRF files for selected tables
   */
  bulkExportSdrf(): void {
    const selectedIds = Array.from(this.selectedTables());

    if (selectedIds.length === 0) {
      this.toastService.warning('Please select at least one table to export');
      return;
    }

    const request = {
      metadataTableIds: selectedIds,
      include_pools: true,
      validate_sdrf: false
    };

    this.asyncTaskService.queueBulkSdrfExport(request).subscribe({
      next: (response) => {
        this.toastService.success(`Bulk SDRF export started! Task ID: ${response.taskId}`);
        this.clearSelection();
      },
      error: (error) => {
        console.error('Error starting bulk export:', error);
        const errorMsg = error?.error?.detail || 'Failed to start bulk export';
        this.toastService.error(errorMsg);
      }
    });
  }

  /**
   * Bulk export Excel templates for selected tables
   */
  bulkExportExcel(): void {
    const selectedIds = Array.from(this.selectedTables());

    if (selectedIds.length === 0) {
      this.toastService.warning('Please select at least one table to export');
      return;
    }

    const request = {
      metadataTableIds: selectedIds,
      include_pools: true
    };

    this.asyncTaskService.queueBulkExcelExport(request).subscribe({
      next: (response) => {
        this.toastService.success(`Bulk Excel export started! Task ID: ${response.taskId}`);
        this.clearSelection();
      },
      error: (error) => {
        console.error('Error starting bulk export:', error);
        const errorMsg = error?.error?.detail || 'Failed to start bulk export';
        this.toastService.error(errorMsg);
      }
    });
  }

  /**
   * Open validation modal for a specific table
   */
  validateTable(table: MetadataTable): void {
    if (!table.id) {
      this.toastService.error('Cannot validate table: table ID is missing');
      return;
    }

    const config: MetadataValidationConfig = {
      metadataTableId: table.id,
      metadataTableName: table.name
    };

    const modalRef = this.modalService.open(MetadataValidationModal, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.componentInstance.config = config;

    modalRef.result.then(
      (result) => {
        if (result && result.success) {
          console.log('Validation started:', result);
        }
      },
      (dismissed) => {
        // Modal was dismissed
        console.log('Validation modal dismissed');
      }
    );
  }

  /**
   * Export a single table in the specified format
   */
  exportTable(table: MetadataTable, format: 'sdrf' | 'excel' = 'sdrf'): void {
    if (!table.id) {
      this.toastService.error('Cannot export table: table ID is missing');
      return;
    }

    if (!table.columns || table.columns.length === 0) {
      this.toastService.error('No columns available for export');
      return;
    }

    if (format === 'excel') {
      // Show Excel export options modal
      const modalRef = this.modalService.open(ExcelExportModalComponent, {
        size: 'lg',
        backdrop: 'static'
      });

      modalRef.result.then((options: ExcelExportOptions) => {
        this.performExcelExport(table, options);
      }).catch(() => {
        // Modal was dismissed - no action needed
      });
    } else {
      // Direct SDRF export
      this.performSdrfExport(table);
    }
  }

  private performExcelExport(table: MetadataTable, options: ExcelExportOptions): void {
    // Filter out columns without IDs and extract valid column IDs
    const columnIds = table.columns!
      .filter(col => col && col.id != null)
      .map(col => col.id!);

    if (columnIds.length === 0) {
      this.toastService.error('No valid columns available for export');
      return;
    }

    // Prepare lab group IDs based on options
    let labGroupIds: number[] | undefined = undefined;
    if (options.includeLabGroups === 'selected') {
      labGroupIds = options.selectedLabGroupIds;
    } else if (options.includeLabGroups === 'all') {
      // Pass empty array to signal "include all lab groups"
      labGroupIds = [];
    }
    // For 'none', labGroupIds stays undefined

    // Use async export if enabled
    if (environment.features?.asyncTasks) {
      this.asyncTaskService.queueExcelExport({
        metadataTableId: table.id!,
        metadataColumnIds: columnIds,
        sampleNumber: table.sampleCount,
        exportFormat: 'excel',
        includePools: options.includePools,
        labGroupIds: labGroupIds
      }).subscribe({
        next: (response) => {
          this.toastService.success(`Excel export queued successfully! Task ID: ${response.taskId}`);
          // Start monitoring tasks if not already started
          this.asyncTaskService.startRealtimeUpdates();
        },
        error: (error) => {
          console.error('Error queuing Excel export:', error);
          const errorMsg = error?.error?.detail || error?.error?.message || 'Failed to queue Excel export';
          this.toastService.error(errorMsg);
        }
      });
    } else {
      // Use synchronous export (fallback)
      this.toastService.info('Synchronous Excel export not implemented');
    }
  }

  private performSdrfExport(table: MetadataTable): void {
    // Filter out columns without IDs and extract valid column IDs
    const columnIds = table.columns!
      .filter(col => col && col.id != null)
      .map(col => col.id!);

    if (columnIds.length === 0) {
      this.toastService.error('No valid columns available for export');
      return;
    }

    // Use async export if enabled
    if (environment.features?.asyncTasks) {
      this.asyncTaskService.queueSdrfExport({
        metadataTableId: table.id!,
        metadataColumnIds: columnIds,
        sampleNumber: table.sampleCount,
        exportFormat: 'sdrf',
        includePools: true
      }).subscribe({
        next: (response) => {
          this.toastService.success(`SDRF export queued successfully! Task ID: ${response.taskId}`);
          // Start monitoring tasks if not already started
          this.asyncTaskService.startRealtimeUpdates();
        },
        error: (error) => {
          console.error('Error queuing SDRF export:', error);
          const errorMsg = error?.error?.detail || error?.error?.message || 'Failed to queue SDRF export';
          this.toastService.error(errorMsg);
        }
      });
    } else {
      // Use synchronous export (fallback)
      this.toastService.info('Synchronous SDRF export not implemented');
    }
  }

  /**
   * Toggle showing shared tables that the user has access to
   */
  toggleSharedTables(): void {
    const newValue = !this.showSharedTables();
    this.showSharedTables.set(newValue);
    this.currentPage.set(1);
  }

  toggleAdminView(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.toastService.error('User not authenticated');
      return;
    }
    if (!currentUser.isStaff) {
      this.toastService.error('Admin access required');
      return;
    }
    const newValue = !this.showAdminView();
    this.showAdminView.set(newValue);
    this.currentPage.set(1);
    if (newValue) {
      this.showSharedTables.set(false);
    }
  }

  getCurrentViewDescription(): string {
    if (this.showAdminView()) {
      return 'Showing all tables (admin view)';
    } else if (this.showSharedTables()) {
      return 'Showing your tables and shared tables';
    } else {
      return 'Showing only your tables';
    }
  }
}
