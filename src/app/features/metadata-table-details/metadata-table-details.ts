import { Component, OnInit, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MetadataTable, MetadataColumn } from '../../shared/models';
import { ApiService } from '../../shared/services/api';
import { ToastService } from '../../shared/services/toast';

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
  viewMode = signal<'list' | 'table'>('list');
  currentPage = signal(1);
  pageSize = signal(50);

  // Computed values
  hasColumns = computed(() => this.table()?.columns && this.table()!.columns.length > 0);
  sortedColumns = computed(() => {
    const columns = this.table()?.columns || [];
    return [...columns].sort((a, b) => (a.column_position || 0) - (b.column_position || 0));
  });

  // Table data generation
  tableRows = computed(() => {
    const table = this.table();
    if (!table || !this.hasColumns()) return [];

    const rows: any[] = [];
    for (let i = 0; i < table.sample_count; i++) {
      const row: any = { _sampleIndex: i + 1 };

      this.sortedColumns().forEach(column => {
        // Use default value or modifier value for this sample
        let value = column.value || '';

        // Check if this sample has a specific modifier
        if (column.modifiers && column.modifiers.length > 0) {
          for (const modifier of column.modifiers) {
            if (modifier?.samples) {
              const sampleRanges = modifier.samples.split(',').map(s => s.trim());
              for (const range of sampleRanges) {
                if (range.includes('-')) {
                  const [start, end] = range.split('-').map(n => parseInt(n.trim()));
                  if (i + 1 >= start && i + 1 <= end) {
                    value = modifier.value || '';
                    break;
                  }
                } else if (parseInt(range) === i + 1) {
                  value = modifier.value || '';
                  break;
                }
              }
            }
          }
        }

        row[column.name] = value;
      });

      rows.push(row);
    }

    return rows;
  });

  // Paginated table data
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
    private toastService: ToastService
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
    if (!table) return;

    // TODO: Implement edit functionality
    this.toastService.info('Edit functionality will be implemented soon');
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
}
