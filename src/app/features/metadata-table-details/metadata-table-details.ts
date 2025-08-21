import { Component, OnInit, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { NgbModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MetadataTable, MetadataColumn, SamplePool } from '../../shared/models';
import { ApiService } from '../../shared/services/api';
import { ToastService } from '../../shared/services/toast';
import { MetadataValueEditModal, MetadataValueEditConfig } from '../../shared/components/metadata-value-edit-modal/metadata-value-edit-modal';
import { MetadataTableEditModal } from '../../shared/components/metadata-table-edit-modal/metadata-table-edit-modal';
import { SamplePoolDetailsModal } from '../../shared/components/sample-pool-details-modal/sample-pool-details-modal';
import { SamplePoolEditModal } from '../../shared/components/sample-pool-edit-modal/sample-pool-edit-modal';

@Component({
  selector: 'app-metadata-table-details',
  standalone: true,
  imports: [CommonModule, RouterModule, NgbModule],
  templateUrl: './metadata-table-details.html',
  styleUrl: './metadata-table-details.scss'
})
export class MetadataTableDetailsComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // Expose Math to template
  Math = Math;

  // State signals
  isLoading = signal(false);
  table = signal<MetadataTable | null>(null);
  tableId = signal<number | null>(null);
  viewMode = signal<'list' | 'table'>('table');
  currentPage = signal(1);
  pageSize = signal(10);

  // Computed values
  hasColumns = computed(() => this.table()?.columns && this.table()!.columns.length > 0);
  hasPools = computed(() => {
    const table = this.table();
    return table?.sample_pools && table.sample_pools.length > 0;
  });
  sortedColumns = computed(() => {
    const columns = this.table()?.columns || [];
    return [...columns].sort((a, b) => (a.column_position || 0) - (b.column_position || 0));
  });
  sortedPools = computed(() => {
    const pools = this.table()?.sample_pools || [];
    return [...pools].sort((a, b) => a.pool_name.localeCompare(b.pool_name));
  });

  // Table data generation
  tableRows = computed(() => {
    const table = this.table();
    if (!table || !this.hasColumns()) return [];

    const rows: any[] = [];
    for (let i = 0; i < table.sample_count; i++) {
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
        _poolName: pool.pool_name,
        _poolId: pool.id,
        _poolData: pool
      };

      // For each column, get the value from the pool's metadata_columns
      this.sortedColumns().forEach(column => {
        let value = '';
        
        // Find the corresponding metadata column in this pool by matching column IDs if available
        // or fall back to name matching for compatibility
        const poolColumn = pool.metadata_columns.find(pc => 
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
    private apiService: ApiService,
    private toastService: ToastService,
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
      } else {
        this.toastService.error('Invalid table ID');
        this.navigateBack();
      }
    });
  }

  private loadTable(id: number): void {
    this.isLoading.set(true);

    this.apiService.getMetadataTable(id).subscribe({
      next: (table) => {
        this.isLoading.set(false);
        this.table.set(table);
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
    if (!table || !table.can_edit) return;

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
    this.fileInput.nativeElement.click();
  }

  importSdrf(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

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
      this.isLoading.set(true);

      this.apiService.importSdrfFile({
        file,
        metadata_table_id: table.id,
        import_type: 'user_metadata',
        create_pools: true,
        replace_existing: false
      }).subscribe({
        next: (response) => {
          this.isLoading.set(false);
          this.toastService.success('SDRF file imported successfully!');
          // Reload table data to show imported columns
          this.loadTable(table.id);
          input.value = ''; // Reset input
        },
        error: (error) => {
          this.isLoading.set(false);
          console.error('Error importing SDRF:', error);
          const errorMsg = error?.error?.detail || error?.error?.message || 'Failed to import SDRF file';
          this.toastService.error(errorMsg);
          input.value = ''; // Reset input
        }
      });
    } else {
      input.value = ''; // Reset input if cancelled
    }
  }

  exportToSdrf(format: 'sdrf' | 'excel' | 'csv' = 'sdrf'): void {
    const table = this.table();
    if (!table || !table.columns || table.columns.length === 0) {
      this.toastService.error('No columns available for export');
      return;
    }

    this.isLoading.set(true);

    const columnIds = table.columns.map(col => col.id!);

    this.apiService.exportSdrfFile({
      metadata_column_ids: columnIds,
      sample_number: table.sample_count,
      export_format: format,
      include_pools: false
    }).subscribe({
      next: (blob) => {
        this.isLoading.set(false);

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        const extension = format === 'excel' ? 'xlsx' : (format === 'csv' ? 'csv' : 'txt');
        link.download = `${table.name}_exported.${extension}`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.toastService.success(`Table exported as ${format.toUpperCase()} successfully!`);
      },
      error: (error) => {
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
      this.apiService.deleteMetadataTable(table.id).subscribe({
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
    if (table.is_published) return 'Published';
    if (table.is_locked) return 'Locked';
    return 'Draft';
  }

  getTableStatusClass(): string {
    const table = this.table();
    if (!table) return '';
    if (table.is_published) return 'bg-success';
    if (table.is_locked) return 'bg-warning';
    return 'bg-secondary';
  }

  getColumnTypeIcon(column: MetadataColumn): string {
    const type = column.type?.toLowerCase() || '';
    if (type.includes('characteristics')) return 'bi-tags';
    if (type.includes('factor')) return 'bi-sliders';
    if (type.includes('comment')) return 'bi-chat-left-text';
    if (type.includes('source')) return 'bi-diagram-3';
    if (type === 'special') return 'bi-star';
    return 'bi-circle';
  }

  getColumnTypeClass(column: MetadataColumn): string {
    const type = column.type?.toLowerCase() || '';
    if (type.includes('characteristics')) return 'text-primary';
    if (type.includes('factor')) return 'text-success';
    if (type.includes('comment')) return 'text-info';
    if (type.includes('source')) return 'text-warning';
    if (type === 'special') return 'text-danger';
    return 'text-muted';
  }

  getColumnHeaderClass(column: MetadataColumn): string {
    const type = column.type?.toLowerCase() || '';
    if (type.includes('characteristics')) return 'bg-primary-subtle text-primary-emphasis';
    if (type.includes('factor')) return 'bg-success-subtle text-success-emphasis';
    if (type.includes('comment')) return 'bg-info-subtle text-info-emphasis';
    if (type.includes('source')) return 'bg-warning-subtle text-warning-emphasis';
    if (type === 'special') return 'bg-danger-subtle text-danger-emphasis';
    return 'bg-body-secondary text-body';
  }

  getShortColumnName(column: MetadataColumn): string {
    let name = column.name;

    // Handle different column types
    const type = column.type?.toLowerCase() || '';

    if (type.includes('characteristics')) {
      name = name.replace(/^characteristics\s*\[/i, '').replace(/\]$/, '');
    } else if (type.includes('factor')) {
      name = name.replace(/^factor\s*value\s*\[/i, '').replace(/\]$/, '');
    } else if (type.includes('comment')) {
      name = name.replace(/^comment\s*\[/i, '').replace(/\]$/, '');
    } else if (type === 'special') {
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
    return pool.pooled_only_samples.length + pool.pooled_and_independent_samples.length;
  }

  getPoolSampleDisplay(pool: SamplePool): string {
    const pooledOnly = pool.pooled_only_samples.length;
    const pooledAndIndependent = pool.pooled_and_independent_samples.length;
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
    const allSamples = [...pool.pooled_only_samples, ...pool.pooled_and_independent_samples].sort((a, b) => a - b);
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
    return pool.is_reference ? 'bi-star-fill' : 'bi-layers';
  }

  getPoolTypeClass(pool: SamplePool): string {
    return pool.is_reference ? 'text-warning' : 'text-primary';
  }

  getPoolTypeLabel(pool: SamplePool): string {
    return pool.is_reference ? 'Reference Pool' : 'Sample Pool';
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
    if (!table || !table.can_edit) return;

    const modalRef = this.modalService.open(SamplePoolEditModal, {
      size: 'lg',
      centered: true
    });

    modalRef.componentInstance.pool = pool;
    modalRef.componentInstance.maxSampleCount = table.sample_count;

    modalRef.componentInstance.poolSaved.subscribe((updatedPool: SamplePool) => {
      // Update the pool in the table's sample_pools array
      const currentTable = this.table();
      if (currentTable && currentTable.sample_pools) {
        const poolIndex = currentTable.sample_pools.findIndex(p => p.id === updatedPool.id);
        if (poolIndex !== -1) {
          currentTable.sample_pools[poolIndex] = updatedPool;
          this.table.set({ ...currentTable }); // Trigger reactivity
        }
      }
      this.toastService.success(`Pool "${updatedPool.pool_name}" updated successfully!`);
    });

    modalRef.result.catch(() => {
      // Modal was dismissed - no action needed
    });
  }

  deletePool(pool: SamplePool): void {
    const table = this.table();
    if (!table || !pool.id) return;

    const confirmMessage = `Are you sure you want to delete the pool "${pool.pool_name}"?\n\nThis action cannot be undone.`;
    
    if (confirm(confirmMessage)) {
      this.apiService.deleteSamplePool(pool.id).subscribe({
        next: () => {
          // Remove the pool from the table's sample_pools array
          const currentTable = this.table();
          if (currentTable && currentTable.sample_pools) {
            currentTable.sample_pools = currentTable.sample_pools.filter(p => p.id !== pool.id);
            this.table.set({ ...currentTable }); // Trigger reactivity
          }
          this.toastService.success(`Pool "${pool.pool_name}" deleted successfully!`);
        },
        error: (error) => {
          console.error('Error deleting pool:', error);
          this.toastService.error(`Failed to delete pool "${pool.pool_name}"`);
        }
      });
    }
  }

  // Metadata value editing methods
  editColumnValue(column: MetadataColumn): void {
    const table = this.table();
    if (!table || !table.can_edit || !column.id) return;

    const config: MetadataValueEditConfig = {
      columnId: column.id,
      columnName: column.name,
      columnType: column.type,
      ontologyType: column.ontology_type,
      currentValue: column.value,
      context: 'table',
      tableId: table.id
    };

    const modalRef = this.modalService.open(MetadataValueEditModal, {
      size: 'lg',
      backdrop: 'static'
    });

    modalRef.componentInstance.config = config;
    modalRef.componentInstance.valueSaved.subscribe((newValue: string) => {
      // Use the API to update the default value
      this.apiService.updateMetadataColumnValue(column.id!, {
        value: newValue,
        value_type: 'default'
      }).subscribe({
        next: (updatedColumn) => {
          // Update the local column data
          const currentTable = this.table();
          if (currentTable) {
            const updatedColumns = currentTable.columns.map(col => 
              col.id === column.id ? updatedColumn : col
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

  // Pool metadata value editing method
  editPoolColumnValue(pool: SamplePool, column: any): void {
    const table = this.table();
    if (!table || !table.can_edit) return;

    // Find the pool's metadata column that corresponds to this table column
    const poolColumn = pool.metadata_columns.find(pc => pc.name === column.name);
    if (!poolColumn || !poolColumn.id) return;

    const config: MetadataValueEditConfig = {
      columnId: poolColumn.id,
      columnName: poolColumn.name,
      columnType: poolColumn.type,
      ontologyType: poolColumn.ontology_type,
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
      if (currentTable && currentTable.sample_pools) {
        const updatedPools = currentTable.sample_pools.map(p => {
          if (p.id === pool.id) {
            const updatedMetadataColumns = p.metadata_columns.map(mc =>
              mc.id === poolColumn.id ? { ...mc, value: newValue } : mc
            );
            return { ...p, metadata_columns: updatedMetadataColumns };
          }
          return p;
        });
        this.table.set({ ...currentTable, sample_pools: updatedPools });
      }
      
      this.toastService.success('Pool column value updated successfully!');
      modalRef.componentInstance.onClose();
    });
  }

  // Sample-specific metadata value editing method
  editSampleColumnValue(column: MetadataColumn, sampleIndex: number): void {
    const table = this.table();
    if (!table || !table.can_edit || !column.id) return;

    // Get current value for this sample (could be default or modified)
    const currentValue = this.getSampleColumnValue(column, sampleIndex);

    const config: MetadataValueEditConfig = {
      columnId: column.id,
      columnName: column.name,
      columnType: column.type,
      ontologyType: column.ontology_type,
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
      this.apiService.updateMetadataColumnValue(column.id!, {
        value: newValue,
        sample_indices: [sampleIndex],
        value_type: 'sample_specific'
      }).subscribe({
        next: (updatedColumn) => {
          // Update the local column data
          const currentTable = this.table();
          if (currentTable) {
            const updatedColumns = currentTable.columns.map(col => 
              col.id === column.id ? updatedColumn : col
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
          const sampleRanges = modifier.samples.split(',').map(s => s.trim()).filter(s => s.length > 0);
          for (const range of sampleRanges) {
            if (range.includes('-')) {
              const parts = range.split('-').map(n => n.trim());
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
    if (!table || !table.can_edit || !column.id) return;

    const confirmMessage = `Are you sure you want to remove the column "${column.name}"?\n\nThis action cannot be undone and will remove all data in this column.`;
    
    if (confirm(confirmMessage)) {
      this.apiService.deleteMetadataColumn(column.id).subscribe({
        next: () => {
          // Remove the column from the local table data
          const currentTable = this.table();
          if (currentTable) {
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
}
