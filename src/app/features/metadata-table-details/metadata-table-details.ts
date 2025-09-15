import { Component, OnInit, OnDestroy, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { NgbModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs';
import { MetadataTable, MetadataColumn, SamplePool, MetadataTableService, AsyncExportService, SamplePoolService, ChunkedUploadService, MetadataColumnService, MetadataExportRequest, ColumnType } from '@cupcake/vanilla';
import { ToastService } from '../../shared/services/toast';
import { AsyncTaskService } from '../../shared/services/async-task';
import { MetadataValueEditModal, MetadataValueEditConfig } from '../../shared/components/metadata-value-edit-modal/metadata-value-edit-modal';
import { MetadataTableEditModal } from '../../shared/components/metadata-table-edit-modal/metadata-table-edit-modal';
import { SamplePoolDetailsModal } from '../../shared/components/sample-pool-details-modal/sample-pool-details-modal';
import { SamplePoolEditModal } from '../../shared/components/sample-pool-edit-modal/sample-pool-edit-modal';
import { SamplePoolCreateModal } from '../../shared/components/sample-pool-create-modal/sample-pool-create-modal';
import { ExcelExportModalComponent, ExcelExportOptions } from '../../shared/components/excel-export-modal/excel-export-modal';
import { ColumnEditModal } from '../metadata-table-templates/column-edit-modal/column-edit-modal';
import { SchemaSelectionModal, SchemaSelectionResult } from '../../shared/components/schema-selection-modal/schema-selection-modal';

@Component({
  selector: 'app-metadata-table-details',
  standalone: true,
  imports: [CommonModule, RouterModule, NgbModule, DragDropModule],
  templateUrl: './metadata-table-details.html',
  styleUrl: './metadata-table-details.scss'
})
export class MetadataTableDetailsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('excelInput') excelInput!: ElementRef<HTMLInputElement>;

  // Expose Math to template
  Math = Math;

  // Column filter methods
  onColumnFilterChange(value: string): void {
    this.columnFilter.set(value);
  }

  clearColumnFilter(): void {
    this.columnFilter.set('');
  }

  get filteredColumnCount(): number {
    return this.sortedColumns().length;
  }

  get totalColumnCount(): number {
    const columns = this.table()?.columns || [];
    return columns.filter(col => col && col.name).length;
  }

  // Sorting methods
  sortBy(field: string): void {
    const currentField = this.sortField();
    const currentDirection = this.sortDirection();

    if (currentField === field) {
      // Toggle direction if same field
      this.sortDirection.set(currentDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to ascending
      this.sortField.set(field);
      this.sortDirection.set('asc');
    }
  }

  getSortIcon(field: string): string {
    const currentField = this.sortField();
    const currentDirection = this.sortDirection();

    if (currentField !== field) {
      return 'bi-arrow-down-up'; // Default unsorted icon
    }

    return currentDirection === 'asc' ? 'bi-sort-alpha-down' : 'bi-sort-alpha-up';
  }

  isSorted(field: string): boolean {
    return this.sortField() === field;
  }

  // State signals
  isLoading = signal(false);
  table = signal<MetadataTable | null>(null);
  tableId = signal<number | null>(null);
  viewMode = signal<'list' | 'table'>('table');
  currentPage = signal(1);
  pageSize = signal(10);
  columnFilter = signal('');

  // Sorting
  sortField = signal<string>('');
  sortDirection = signal<'asc' | 'desc'>('asc');

  // Computed values
  hasColumns = computed(() => {
    const table = this.table();
    return table?.columns && table.columns.length > 0;
  });
  hasPools = computed(() => {
    const table = this.table();
    return table?.samplePools && table.samplePools.length > 0;
  });
  sortedColumns = computed(() => {
    const columns = this.table()?.columns || [];
    const filter = this.columnFilter().toLowerCase();

    return [...columns]
      .filter(col => col && col.name) 
      .filter(col => !filter || col.name.toLowerCase().includes(filter))
      .sort((a, b) => (a.columnPosition || 0) - (b.columnPosition || 0));
  });
  
  dragColumnsForList = signal<MetadataColumn[]>([]);

  sortedPools = computed(() => {
    const pools = this.table()?.samplePools || [];
    return [...pools].sort((a, b) => a.poolName.localeCompare(b.poolName));
  });

  // Table data generation
  tableRows = computed(() => {
    const table = this.table();
    if (!table || !this.hasColumns()) return [];

    const rows: any[] = [];
    for (let i = 0; i < table.sampleCount; i++) {
      const sampleIndex = i + 1; // 1-based sample index
      const row: any = { _sampleIndex: sampleIndex };

      this.sortedColumns().forEach(column => {
        // Use column ID as key to avoid name collisions
        const value = this.getSampleColumnValue(column, sampleIndex);
        row[`col_${column.id}`] = value;
      });

      rows.push(row);
    }

    return rows;
  });

  // Pool table data - separate table for pools
  poolTableRows = computed(() => {
    const table = this.table();
    if (!table || !this.hasPools() || !this.hasColumns()) return [];

    const rows: any[] = [];
    this.sortedPools().forEach(pool => {
      const row: any = {
        _poolName: pool.poolName,
        _poolId: pool.id,
        _poolData: pool
      };

      // For each column, get the value from the pool's metadataColumns
      this.sortedColumns().forEach(column => {
        let value = '';

        // Find the corresponding metadata column in this pool by matching column IDs if available
        // or fall back to name matching for compatibility
        const poolColumn = pool.metadataColumns?.find((pc: any) =>
          (pc.id && column.id && pc.id === column.id) || pc.name === column.name
        );
        if (poolColumn) {
          value = poolColumn.value || '';
        }

        // Use column ID as key to avoid name collisions
        row[`col_${column.id}`] = value;
      });

      rows.push(row);
    });

    return rows;
  });

  // Paginated table data (only for samples, pools shown separately)
  paginatedRows = computed(() => {
    const rows = this.tableRows();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    const end = start + size;
    return rows.slice(start, end);
  });

  totalPages = computed(() => {
    const rows = this.tableRows();
    const size = this.pageSize();
    return Math.ceil(rows.length / size);
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private metadataTableService: MetadataTableService,
    private asyncExportService: AsyncExportService,
    private chunkedUploadService: ChunkedUploadService,
    private samplePoolService: SamplePoolService,
    private metadataColumnService: MetadataColumnService,
    private toastService: ToastService,
    private asyncTaskService: AsyncTaskService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = Number(params['id']);
      const mode = params['mode'] as 'list' | 'table' || 'list';

      if (id && !isNaN(id)) {
        this.tableId.set(id);
        this.viewMode.set(mode);
        this.loadTable(id);
        this.setupAsyncTaskRefreshListener(id);
      } else {
        this.toastService.error('Invalid table ID');
        this.navigateBack();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupAsyncTaskRefreshListener(tableId: number): void {
    // Listen for metadata table refresh events when import tasks complete for this specific table
    this.asyncTaskService.metadataTableRefresh$.pipe(
      takeUntil(this.destroy$)
    ).subscribe((refreshedTableId: number) => {
      if (refreshedTableId === tableId) {
        console.log(`Import task completed for table ${refreshedTableId}, refreshing table details`);
        this.toastService.info('Refreshing table data after successful import');
        this.loadTable(tableId);
      }
    });
  }

  private loadTable(id: number): void {
    this.isLoading.set(true);

    this.metadataTableService.getMetadataTable(id).subscribe({
      next: (table) => {
        this.isLoading.set(false);
        this.table.set(table);
        const naturalOrder = [...(table.columns || [])].sort((a, b) => (a.columnPosition || 0) - (b.columnPosition || 0));
        this.dragColumnsForList.set(naturalOrder);
      },
      error: (error) => {
        this.isLoading.set(false);
        console.error('Error loading metadata table:', error);
        const errorMsg = error?.error?.detail || 'Table not found';
        this.toastService.error(errorMsg);
        if (error.status === 404) {
          this.navigateBack();
        }
      }
    });
  }

  navigateBack(): void {
    this.router.navigate(['/metadata-tables']);
  }

  switchToListMode(): void {
    const tableId = this.tableId();
    if (tableId) {
      this.router.navigate(['/metadata-tables', tableId, 'list']);
    }
  }

  switchToTableMode(): void {
    const tableId = this.tableId();
    if (tableId) {
      this.router.navigate(['/metadata-tables', tableId, 'table']);
    }
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1); // Reset to first page when changing page size
  }

  editTable(): void {
    const table = this.table();
    if (!table || !table.canEdit) return;

    const modalRef = this.modalService.open(MetadataTableEditModal, {
      size: 'lg',
      centered: true
    });

    modalRef.componentInstance.table = table;

    modalRef.componentInstance.tableSaved.subscribe((updatedTable: MetadataTable) => {
      // Update the local table data
      this.table.set(updatedTable);
      this.toastService.success(`Table "${updatedTable.name}" updated successfully!`);
    });

    modalRef.result.catch(() => {
      // Modal was dismissed - no action needed
    });
  }

  triggerFileInput(): void {
    console.log('triggerFileInput called');
    this.fileInput.nativeElement.click();
  }

  triggerExcelInput(): void {
    console.log('triggerExcelInput called');
    this.excelInput.nativeElement.click();
  }

  importSdrf(event: Event): void {
    console.log('importSdrf called', event);
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      console.log('No files selected');
      return;
    }

    const file = input.files[0];
    const table = this.table();
    if (!table) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.txt') && !file.name.toLowerCase().endsWith('.tsv')) {
      this.toastService.error('Please select a valid SDRF file (.txt or .tsv)');
      input.value = ''; // Reset input
      return;
    }

    if (confirm(`Import SDRF data into table "${table.name}"?\n\nThis will add new columns and may modify existing data.`)) {
      input.value = ''; // Reset input early

      // Use chunked upload service for import with progress tracking
      this.isLoading.set(true);

      console.log('Starting SDRF import using chunked upload:', {
        fileName: file.name,
        fileSize: file.size,
        metadataTableId: table.id
      });

      // Use chunked upload - it now triggers async import task on completion
      this.chunkedUploadService.uploadFileInChunks(
        file,
        1024 * 1024, // 1MB chunks
        {
          metadataTableId: table.id,
          createPools: true,
          replaceExisting: false,
          onProgress: (progress) => {
            console.log(`SDRF upload progress: ${Math.round(progress)}%`);
          }
        }
      ).subscribe({
        next: (result) => {
          this.isLoading.set(false);
          console.log('SDRF chunked upload completed:', result);
          
          // If a taskId is returned, monitor the async import task
          if (result?.taskId) {
            console.log('Starting async task monitoring for taskId:', result.taskId);
            this.toastService.success(`SDRF import task queued successfully! Task ID: ${result.taskId}`);
            
            // Mark task for monitoring and start real-time updates (same pattern as export)
            this.asyncTaskService.monitorTask(result.taskId);
            this.asyncTaskService.startRealtimeUpdates();
          } else {
            // Fallback for immediate processing (backward compatibility)
            this.toastService.success('SDRF file imported successfully!');
            this.loadTable(table.id);
          }
        },
        error: (error) => {
          this.isLoading.set(false);
          console.error('Error importing SDRF:', error);
          const errorMsg = error?.error?.detail || error?.error?.message || 'Failed to import SDRF file';
          this.toastService.error(errorMsg);
        }
      });
    } else {
      input.value = ''; // Reset input if cancelled
    }
  }

  importExcel(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const table = this.table();
    if (!table) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls')) {
      this.toastService.error('Please select a valid Excel file (.xlsx or .xls)');
      input.value = ''; // Reset input
      return;
    }

    if (confirm(`Import Excel data into table "${table.name}"?\n\nThis will update existing columns and may modify data.`)) {
      input.value = ''; // Reset input early

      // Use chunked upload service for import with progress tracking
      this.isLoading.set(true);

      console.log('Starting Excel import using chunked upload:', {
        fileName: file.name,
        fileSize: file.size,
        metadataTableId: table.id
      });

      // Use chunked upload - it now triggers async import task on completion
      this.chunkedUploadService.uploadFileInChunks(
        file,
        1024 * 1024, // 1MB chunks
        {
          metadataTableId: table.id,
          createPools: true,
          replaceExisting: false,
          onProgress: (progress) => {
            console.log(`Excel upload progress: ${Math.round(progress)}%`);
          }
        }
      ).subscribe({
        next: (result) => {
          this.isLoading.set(false);
          console.log('Excel chunked upload completed:', result);
          
          // If a taskId is returned, monitor the async import task
          if (result?.taskId) {
            console.log('Starting async task monitoring for taskId:', result.taskId);
            this.toastService.success(`Excel import task queued successfully! Task ID: ${result.taskId}`);
            
            // Mark task for monitoring and start real-time updates (same pattern as export)
            this.asyncTaskService.monitorTask(result.taskId);
            this.asyncTaskService.startRealtimeUpdates();
          } else {
            // Fallback for immediate processing (backward compatibility)
            this.toastService.success('Excel file imported successfully!');
            this.loadTable(table.id);
          }
        },
        error: (error) => {
          this.isLoading.set(false);
          console.error('Error importing Excel:', error);
          const errorMsg = error?.error?.detail || error?.error?.message || 'Failed to import Excel file';
          this.toastService.error(errorMsg);
        }
      });
    } else {
      input.value = ''; // Reset input if cancelled
    }
  }

  exportToSdrf(format: 'sdrf' | 'excel' = 'sdrf'): void {
    const table = this.table();
    if (!table || !table.columns || table.columns.length === 0) {
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
    const columnIds = table.columns!.map(col => col.id!);

    // Prepare lab group IDs based on options
    let labGroupIds: number[] | undefined = undefined;
    if (options.includeLabGroups === 'selected') {
      labGroupIds = options.selectedLabGroupIds;
    } else if (options.includeLabGroups === 'all') {
      // Pass empty array to signal "include all lab groups"
      labGroupIds = [];
    }
    // For 'none', labGroupIds stays undefined

    // Use async export only
    this.asyncExportService.excelTemplate({
      metadataTableId: table.id,
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
  }

  private performSdrfExport(table: MetadataTable): void {
    const columnIds = table.columns!.map(col => col.id!);

    // Use async export only
    this.asyncExportService.sdrfFile({
      metadataTableId: table.id,
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
  }

  private handleExportRequest(exportRequest: any, format: 'excel' | 'sdrf'): void {
    exportRequest.subscribe({
      next: (response: { taskId: string; message: string }) => {
        this.isLoading.set(false);
        this.toastService.success(`${format.toUpperCase()} export task queued successfully! Task ID: ${response.taskId}`);

        // Start monitoring tasks if not already started
        this.asyncTaskService.startRealtimeUpdates();
      },
      error: (error: any) => {
        this.isLoading.set(false);
        console.error('Error exporting table:', error);
        const errorMsg = error?.error?.detail || 'Failed to export table';
        this.toastService.error(errorMsg);
      }
    });
  }

  deleteTable(): void {
    const table = this.table();
    if (!table) return;

    const confirmMessage = `Are you sure you want to delete the table "${table.name}"?\n\nThis action cannot be undone.`;

    if (confirm(confirmMessage)) {
      this.isLoading.set(true);
      this.metadataTableService.deleteMetadataTable(table.id).subscribe({
        next: () => {
          this.toastService.success(`Table "${table.name}" deleted successfully!`);
          this.navigateBack();
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

  getTableStatusBadge(): string {
    const table = this.table();
    if (!table) return '';
    if (table.isPublished) return 'Published';
    if (table.isLocked) return 'Locked';
    return 'Draft';
  }

  getTableStatusClass(): string {
    const table = this.table();
    if (!table) return '';
    if (table.isPublished) return 'bg-success';
    if (table.isLocked) return 'bg-warning';
    return 'bg-secondary';
  }

  getColumnTypeIcon(column: MetadataColumn): string {
    const type = column.type?.toLowerCase() || '';
    if (type.includes(ColumnType.CHARACTERISTICS)) return 'bi-tags';
    if (type.includes(ColumnType.FACTOR_VALUE.replace('_', ' '))) return 'bi-sliders';
    if (type.includes(ColumnType.COMMENT)) return 'bi-chat-left-text';
    if (type.includes(ColumnType.SOURCE_NAME.replace('_', ' '))) return 'bi-diagram-3';
    if (type === ColumnType.SPECIAL) return 'bi-star';
    return 'bi-circle';
  }

  getColumnTypeClass(column: MetadataColumn): string {
    const type = column.type?.toLowerCase() || '';
    if (type.includes(ColumnType.CHARACTERISTICS)) return 'text-primary';
    if (type.includes(ColumnType.FACTOR_VALUE.replace('_', ' '))) return 'text-success';
    if (type.includes(ColumnType.COMMENT)) return 'text-info';
    if (type.includes(ColumnType.SOURCE_NAME.replace('_', ' '))) return 'text-warning';
    if (type === ColumnType.SPECIAL) return 'text-danger';
    return 'text-muted';
  }

  getColumnHeaderClass(column: MetadataColumn): string {
    let baseClass = '';
    const type = column.type?.toLowerCase() || '';
    if (type.includes(ColumnType.CHARACTERISTICS)) baseClass = 'bg-primary-subtle text-primary-emphasis';
    else if (type.includes(ColumnType.FACTOR_VALUE.replace('_', ' '))) baseClass = 'bg-success-subtle text-success-emphasis';
    else if (type.includes(ColumnType.COMMENT)) baseClass = 'bg-info-subtle text-info-emphasis';
    else if (type.includes(ColumnType.SOURCE_NAME.replace('_', ' '))) baseClass = 'bg-warning-subtle text-warning-emphasis';
    else if (type === ColumnType.SPECIAL) baseClass = 'bg-danger-subtle text-danger-emphasis';
    else baseClass = 'bg-body-secondary text-body';

    // Add hidden column styling
    if (column.hidden) {
      baseClass += ' opacity-50 text-decoration-line-through';
    }

    return baseClass;
  }

  getShortColumnName(column: MetadataColumn): string {
    let name = column.name;

    // Handle different column types
    const type = column.type?.toLowerCase() || '';

    if (type.includes(ColumnType.CHARACTERISTICS)) {
      name = name.replace(/^characteristics\s*\[/i, '').replace(/\]$/, '');
    } else if (type.includes(ColumnType.FACTOR_VALUE.replace('_', ' '))) {
      name = name.replace(/^factor\s*value\s*\[/i, '').replace(/\]$/, '');
    } else if (type.includes(ColumnType.COMMENT)) {
      name = name.replace(/^comment\s*\[/i, '').replace(/\]$/, '');
    } else if (type === ColumnType.SPECIAL) {
      // Special columns have no prefix or brackets - use name as is
      return name;
    }

    // Remove any remaining square brackets for other types
    name = name.replace(/[\[\]]/g, '');

    // Clean up extra spaces
    name = name.trim();

    return name || column.name; // Fallback to original name if cleaning results in empty string
  }

  hasModifiers(column: MetadataColumn): boolean {
    return !!(column.modifiers && Array.isArray(column.modifiers) && column.modifiers.length > 0);
  }

  getColumnValueDisplay(column: MetadataColumn): string {
    const defaultValue = column.value || '';
    if (!this.hasModifiers(column)) {
      return defaultValue || 'No default value';
    }
    return defaultValue ? `Default: ${defaultValue}` : 'Default: (empty)';
  }

  getModifiersDisplay(column: MetadataColumn): string[] {
    if (!this.hasModifiers(column)) {
      return [];
    }
    return column.modifiers!.map(modifier =>
      `Samples ${modifier.samples}: "${modifier.value}"`
    );
  }

  // Sample Pool Methods
  getPoolSampleCount(pool: SamplePool): number {
    return pool.pooledOnlySamples.length + pool.pooledAndIndependentSamples.length;
  }

  getPoolSampleDisplay(pool: SamplePool): string {
    const pooledOnly = pool.pooledOnlySamples.length;
    const pooledAndIndependent = pool.pooledAndIndependentSamples.length;
    const total = pooledOnly + pooledAndIndependent;

    if (pooledOnly > 0 && pooledAndIndependent > 0) {
      return `${total} samples (${pooledOnly} pool-only, ${pooledAndIndependent} shared)`;
    } else if (pooledOnly > 0) {
      return `${pooledOnly} pool-only samples`;
    } else if (pooledAndIndependent > 0) {
      return `${pooledAndIndependent} shared samples`;
    } else {
      return '0 samples';
    }
  }

  getPoolSamples(pool: SamplePool): string {
    const allSamples = [...pool.pooledOnlySamples, ...pool.pooledAndIndependentSamples].sort((a, b) => a - b);
    if (allSamples.length === 0) return 'None';

    // Group consecutive numbers into ranges
    const ranges: string[] = [];
    let start = allSamples[0];
    let end = allSamples[0];

    for (let i = 1; i < allSamples.length; i++) {
      if (allSamples[i] === end + 1) {
        end = allSamples[i];
      } else {
        ranges.push(start === end ? start.toString() : `${start}-${end}`);
        start = end = allSamples[i];
      }
    }
    ranges.push(start === end ? start.toString() : `${start}-${end}`);

    return ranges.join(', ');
  }

  getPoolTypeIcon(pool: SamplePool): string {
    return pool.isReference ? 'bi-star-fill' : 'bi-layers';
  }

  getPoolTypeClass(pool: SamplePool): string {
    return pool.isReference ? 'text-warning' : 'text-primary';
  }

  getPoolTypeLabel(pool: SamplePool): string {
    return pool.isReference ? 'Reference Pool' : 'Sample Pool';
  }

  viewPoolDetails(pool: SamplePool): void {
    const modalRef = this.modalService.open(SamplePoolDetailsModal, {
      size: 'lg',
      centered: true
    });

    modalRef.componentInstance.pool = pool;
  }

  editPool(pool: SamplePool): void {
    const table = this.table();
    if (!table || !table.canEdit) return;

    const modalRef = this.modalService.open(SamplePoolEditModal, {
      size: 'lg',
      centered: true
    });

    modalRef.componentInstance.pool = pool;
    modalRef.componentInstance.maxSampleCount = table.sampleCount;

    modalRef.componentInstance.poolSaved.subscribe((updatedPool: SamplePool) => {
      // Reload the entire table to sync all pool-related changes
      this.loadTable(table.id);
      this.toastService.success(`Pool "${updatedPool.poolName}" updated successfully!`);
    });
  }

  createPool(): void {
    const table = this.table();
    if (!table || !table.canEdit) return;

    const modalRef = this.modalService.open(SamplePoolCreateModal, {
      size: 'xl',
      centered: true,
      backdrop: 'static'
    });

    modalRef.componentInstance.metadataTable = table;

    modalRef.componentInstance.poolCreated.subscribe((createdPool: SamplePool) => {
      // Reload the entire table to sync all pool-related changes
      this.loadTable(table.id);
      this.toastService.success(`Pool "${createdPool.poolName}" created successfully!`);
    });

    modalRef.result.catch(() => {
      // Modal was dismissed - no action needed
    });
  }

  deletePool(pool: SamplePool): void {
    const table = this.table();
    if (!table || !pool.id) return;

    const confirmMessage = `Are you sure you want to delete the pool "${pool.poolName}"?\n\nThis action cannot be undone.`;

    if (confirm(confirmMessage)) {
      this.samplePoolService.deleteSamplePool(pool.id).subscribe({
        next: () => {
          // Reload the entire table to sync all pool-related changes
          this.loadTable(table.id);
          this.toastService.success(`Pool "${pool.poolName}" deleted successfully!`);
        },
        error: (error) => {
          console.error('Error deleting pool:', error);
          this.toastService.error(`Failed to delete pool "${pool.poolName}"`);
        }
      });
    }
  }

  // Metadata value editing methods
  editColumnValue(column: MetadataColumn): void {
    const table = this.table();
    if (!table || !table.canEdit || !column.id) return;

    // Prepare sample data for multi-sample editing
    const sampleData = this.tableRows().map(row => ({
      index: row._sampleIndex,
      value: row[`col_${column.id}`] || column.value || '',
      sourceName: row.sourceName || `Sample ${row._sampleIndex}`
    }));

    const config: MetadataValueEditConfig = {
      columnId: column.id,
      columnName: column.name,
      columnType: column.type,
      ontologyType: column.ontologyType,
      enableTypeahead: true,
      currentValue: column.value,
      context: 'table',
      tableId: table.id,
      enableMultiSampleEdit: true,
      sampleData: sampleData,
      maxSampleCount: table.sampleCount
    };

    const modalRef = this.modalService.open(MetadataValueEditModal, {
      size: 'xl',
      backdrop: 'static'
    });

    modalRef.componentInstance.config = config;

    // Debug log to check if multi-sample editing is enabled
    console.log('Multi-sample editing config:', {
      enableMultiSampleEdit: config.enableMultiSampleEdit,
      sampleDataLength: config.sampleData?.length,
      hasMultiSampleEdit: config.enableMultiSampleEdit && config.sampleData && config.sampleData.length > 0
    });

    modalRef.componentInstance.valueSaved.subscribe((result: string | { value: string; sampleIndices: number[] }) => {
      let apiData: any;

      if (typeof result === 'string') {
        // Simple string value - update default
        apiData = {
          value: result,
          value_type: 'default'
        };
      } else {
        // Multi-sample edit - update specific samples
        apiData = {
          value: result.value,
          sample_indices: result.sampleIndices,
          value_type: 'sample_specific'
        };
      }

      // Use the API to update the column value
      const requestData = {
        value: typeof result === 'string' ? result : result.value,
        sampleIndices: typeof result === 'string' ? undefined : result.sampleIndices,
        valueType: typeof result === 'string' ? 'default' as const : 'sample_specific' as const
      };

      this.metadataColumnService.updateColumnValue(column.id!, requestData).subscribe({
        next: (response) => {
          // Update the local column data with the returned column
          const currentTable = this.table();
          if (currentTable && currentTable.columns && response.column) {
            const updatedColumns = currentTable.columns.map(col =>
              col.id === column.id ? response.column : col
            );
            this.table.set({ ...currentTable, columns: updatedColumns });
          }
          this.toastService.success('Column value updated successfully!');
          modalRef.componentInstance.onClose();
        },
        error: (error) => {
          console.error('Error updating column value:', error);
          this.toastService.error('Failed to update column value');
        }
      });
    });
  }

  // Toggle column hidden property
  toggleColumnHidden(column: MetadataColumn): void {
    const table = this.table();
    if (!table || !table.canEdit || !column.id) return;

    const newHiddenValue = !column.hidden;

    this.metadataColumnService.patchMetadataColumn(column.id, { hidden: newHiddenValue }).subscribe({
      next: (updatedColumn) => {
        // Update the local column data
        const currentTable = this.table();
        if (currentTable && currentTable.columns) {
          const updatedColumns = currentTable.columns.map(col =>
            col.id === column.id ? updatedColumn : col
          );
          this.table.set({ ...currentTable, columns: updatedColumns });

          // Reload the table data to sync pool columns
          this.loadTable(table.id);
        }
        this.toastService.success(`Column "${column.name}" visibility updated successfully!`);
      },
      error: (error) => {
        console.error('Error updating column hidden property:', error);
        this.toastService.error('Failed to update column visibility');
      }
    });
  }

  // Pool metadata value editing method
  editPoolColumnValue(pool: SamplePool, column: any): void {
    const table = this.table();
    if (!table || !table.canEdit) return;

    // Find the pool's metadata column that corresponds to this table column
    const poolColumn = pool.metadataColumns?.find(pc => pc.name === column.name);
    if (!poolColumn || !poolColumn.id) return;

    const config: MetadataValueEditConfig = {
      columnId: poolColumn.id,
      columnName: poolColumn.name,
      columnType: poolColumn.type,
      ontologyType: poolColumn.ontologyType,
      enableTypeahead: true,
      currentValue: poolColumn.value,
      context: 'pool',
      tableId: table.id,
      poolId: pool.id
    };

    const modalRef = this.modalService.open(MetadataValueEditModal, {
      size: 'lg',
      backdrop: 'static'
    });

    modalRef.componentInstance.config = config;
    modalRef.componentInstance.valueSaved.subscribe((newValue: string) => {
      // Update the pool's metadata column value locally
      const currentTable = this.table();
      if (currentTable && currentTable.samplePools) {
        const updatedPools = currentTable.samplePools.map(p => {
          if (p.id === pool.id) {
            const updatedMetadataColumns = p.metadataColumns.map((mc: MetadataColumn) =>
              mc.id === poolColumn.id ? { ...mc, value: newValue } : mc
            );
            return { ...p, metadataColumns: updatedMetadataColumns };
          }
          return p;
        });
        this.table.set({ ...currentTable, samplePools: updatedPools });
      }

      this.toastService.success('Pool column value updated successfully!');
      modalRef.componentInstance.onClose();
    });
  }

  // Sample-specific metadata value editing method
  editSampleColumnValue(column: MetadataColumn, sampleIndex: number): void {
    const table = this.table();
    if (!table || !table.canEdit || !column.id) return;

    // Get current value for this sample (could be default or modified)
    const currentValue = this.getSampleColumnValue(column, sampleIndex);

    const config: MetadataValueEditConfig = {
      columnId: column.id,
      columnName: column.name,
      columnType: column.type,
      ontologyType: column.ontologyType,
      enableTypeahead: true,
      currentValue: currentValue,
      context: 'table',
      tableId: table.id
    };

    const modalRef = this.modalService.open(MetadataValueEditModal, {
      size: 'lg',
      backdrop: 'static'
    });

    modalRef.componentInstance.config = config;
    modalRef.componentInstance.valueSaved.subscribe((newValue: string) => {
      // Use the API to update the sample-specific value
      this.metadataColumnService.updateColumnValue(column.id!, {
        value: newValue,
        sampleIndices: [sampleIndex],
        valueType: 'sample_specific'
      }).subscribe({
        next: (response) => {
          // Update the local column data with the returned column
          const currentTable = this.table();
          if (currentTable && currentTable.columns && response.column) {
            const updatedColumns = currentTable.columns.map(col =>
              col.id === column.id ? response.column : col
            );
            this.table.set({ ...currentTable, columns: updatedColumns });
          }
          this.toastService.success(`Sample ${sampleIndex} value updated successfully!`);
          modalRef.componentInstance.onClose();
        },
        error: (error) => {
          console.error('Error updating sample value:', error);
          this.toastService.error(`Failed to update sample ${sampleIndex} value`);
        }
      });
    });
  }

  // Helper method to get current value for a specific sample
  private getSampleColumnValue(column: MetadataColumn, sampleIndex: number): string {
    // Check if this sample has a specific modifier
    if (column.modifiers && column.modifiers.length > 0) {
      for (const modifier of column.modifiers) {
        if (modifier?.samples) {
          const sampleRanges = modifier.samples.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
          for (const range of sampleRanges) {
            if (range.includes('-')) {
              const parts = range.split('-').map((n: string) => n.trim());
              if (parts.length === 2) {
                const start = parseInt(parts[0]);
                const end = parseInt(parts[1]);
                if (!isNaN(start) && !isNaN(end) && sampleIndex >= start && sampleIndex <= end) {
                  return modifier.value || '';
                }
              }
            } else {
              const sampleNum = parseInt(range);
              if (!isNaN(sampleNum) && sampleNum === sampleIndex) {
                return modifier.value || '';
              }
            }
          }
        }
      }
    }
    // Return default value if no modifier found
    return column.value || '';
  }


  // Remove column method
  removeColumn(column: MetadataColumn): void {
    const table = this.table();
    if (!table || !table.canEdit || !column.id) return;

    const confirmMessage = `Are you sure you want to remove the column "${column.name}"?\n\nThis action cannot be undone and will remove all data in this column.`;

    if (confirm(confirmMessage)) {
      this.metadataColumnService.deleteMetadataColumn(column.id).subscribe({
        next: () => {
          // Remove the column from the local table data
          const currentTable = this.table();
          if (currentTable && currentTable.columns) {
            const updatedColumns = currentTable.columns.filter(col => col.id !== column.id);
            this.table.set({ ...currentTable, columns: updatedColumns });
          }
          this.toastService.success(`Column "${column.name}" removed successfully!`);
        },
        error: (error) => {
          console.error('Error removing column:', error);
          this.toastService.error(`Failed to remove column "${column.name}"`);
        }
      });
    }
  }

  /**
   * Open modal to add a new column with automatic reordering
   */
  openAddColumnModal(): void {
    const modalRef = this.modalService.open(ColumnEditModal, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false
    });

    // Configure modal for adding new column
    modalRef.componentInstance.column = null;
    modalRef.componentInstance.templateId = null;
    modalRef.componentInstance.isEdit = false;

    // Handle column save
    modalRef.componentInstance.columnSaved.subscribe((columnData: Partial<MetadataColumn>) => {
      this.addColumnWithAutoReorder(columnData);
      modalRef.componentInstance.onClose();
    });
  }

  /**
   * Add a new column using the new API with automatic reordering
   */
  private addColumnWithAutoReorder(columnData: Partial<MetadataColumn>): void {
    const currentTable = this.table();
    if (!currentTable) {
      this.toastService.error('No table selected');
      return;
    }

    this.isLoading.set(true);

    this.metadataTableService.addColumnWithAutoReorder(currentTable.id, {
      columnData: columnData
    }).subscribe({
      next: (response: { message: string; column: MetadataColumn; reordered: boolean; schemaIdsUsed: number[] }) => {
        // Update the local table data with the new column
        const updatedColumns = [...(currentTable.columns || []), response.column];
        this.table.set({ ...currentTable, columns: updatedColumns });

        // Show success message with reordering info
        let message = `Column "${response.column.name}" added successfully!`;
        if (response.reordered) {
          message += ` Columns reordered using ${response.schemaIdsUsed.length} schema(s).`;
        }

        this.toastService.success(message);

        // Refresh the table to get the latest column positions
        this.loadTable(currentTable.id);
      },
      error: (error: any) => {
        console.error('Error adding column:', error);
        this.toastService.error('Failed to add column');
      },
      complete: () => {
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Reorder columns by schema selection
   */
  reorderColumns(): void {
    const currentTable = this.table();
    if (!currentTable) {
      this.toastService.error('No table selected');
      return;
    }

    const modalRef = this.modalService.open(SchemaSelectionModal, {
      size: 'lg',
      backdrop: 'static'
    });

    modalRef.componentInstance.title = 'Reorder Columns by Schema';
    modalRef.componentInstance.description = `Select schemas to reorder columns in "${currentTable.name}". Columns will be arranged based on the selected schema order.`;

    modalRef.result.then((result: SchemaSelectionResult) => {
      if (result && result.selectedSchemaIds) {
        this.performColumnReorder(currentTable.id, result.selectedSchemaIds);
      }
    }).catch(() => {
      // Modal was dismissed - no action needed
    });
  }

  /**
   * Perform the actual column reordering with async task monitoring
   */
  private performColumnReorder(tableId: number, schemaIds: number[]): void {
    this.isLoading.set(true);

    this.metadataTableService.reorderColumnsBySchemaAsync(tableId, schemaIds).subscribe({
      next: (response) => {
        console.log('Column reorder task started:', response);
        this.toastService.success(`Column reorder task queued successfully! Task ID: ${response.taskId}`);
        
        // Mark task for monitoring and start real-time updates (same pattern as imports)
        this.asyncTaskService.monitorTask(response.taskId);
        this.asyncTaskService.startRealtimeUpdates();
        
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error starting column reorder:', error);
        this.toastService.error('Failed to start column reordering');
        this.isLoading.set(false);
      }
    });
  }

  onColumnDrop(event: CdkDragDrop<MetadataColumn[]>): void {
    if (event.previousIndex === event.currentIndex) return;

    const currentTable = this.table();
    if (!currentTable?.canEdit) return;

    const dragColumns = [...this.dragColumnsForList()];
    moveItemInArray(dragColumns, event.previousIndex, event.currentIndex);
    
    // Update columnPosition for all columns in the new order
    dragColumns.forEach((col, index) => {
      col.columnPosition = index;
    });
    
    this.dragColumnsForList.set(dragColumns);

    // Update the main table data too
    const updatedTableColumns = [...(currentTable.columns || [])];
    dragColumns.forEach((dragCol, index) => {
      const tableColIndex = updatedTableColumns.findIndex(col => col.id === dragCol.id);
      if (tableColIndex !== -1) {
        updatedTableColumns[tableColIndex] = { ...updatedTableColumns[tableColIndex], columnPosition: index };
      }
    });
    
    this.table.update(table => table ? { ...table, columns: updatedTableColumns } : null);

    const draggedColumn = dragColumns[event.currentIndex];
    const newPosition = event.currentIndex;
    
    console.log(`Moving column "${draggedColumn.name}" to position ${newPosition}`);

    this.metadataTableService.reorderColumn(currentTable.id, draggedColumn.id, newPosition).subscribe({
      next: () => {
        this.toastService.success('Column reordered successfully');
        this.loadTable(currentTable.id);
      },
      error: () => {
        this.toastService.error('Failed to reorder column');
        this.loadTable(currentTable.id);
      }
    });
  }
}
