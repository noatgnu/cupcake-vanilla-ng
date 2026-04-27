import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MetadataTableService, MetadataTable, MetadataTableQueryParams } from '@noatgnu/cupcake-vanilla';
import { LabGroupService, LabGroup } from '@noatgnu/cupcake-core';
import { ExcelService } from '../../core/services/excel.service';
import { SyncPanel } from '../sync-panel/sync-panel';

const STORAGE_KEY_LAB_GROUP = 'cupcake-excel-selected-lab-group';
const STORAGE_KEY_TABLE = 'cupcake-excel-selected-table';

@Component({
  selector: 'app-table-browser',
  imports: [FormsModule, SyncPanel],
  templateUrl: './table-browser.html',
  styleUrl: './table-browser.scss',
})
export class TableBrowser implements OnInit {
  private tableService = inject(MetadataTableService);
  private labGroupService = inject(LabGroupService);
  private excelService = inject(ExcelService);

  readonly tables = signal<MetadataTable[]>([]);
  readonly selectedTable = signal<MetadataTable | null>(null);
  readonly isLoading = signal(false);
  readonly searchQuery = signal('');
  readonly errorMessage = signal<string | null>(null);

  readonly labGroups = signal<LabGroup[]>([]);
  readonly selectedLabGroupId = signal<number | null>(null);
  readonly isLoadingLabGroups = signal(false);
  readonly isLoadingSavedTable = signal(false);

  readonly showColumnSearch = signal(false);
  readonly columnName = signal('');
  readonly columnValue = signal('');
  readonly columnMatchExact = signal(false);

  ngOnInit(): void {
    this.loadSavedLabGroup();
    this.loadLabGroups();
    this.loadSavedTable();
    this.search();
  }

  private loadSavedLabGroup(): void {
    const saved = localStorage.getItem(STORAGE_KEY_LAB_GROUP);
    if (saved) {
      const id = parseInt(saved, 10);
      if (!isNaN(id)) {
        this.selectedLabGroupId.set(id);
      }
    }
  }

  private loadSavedTable(): void {
    const saved = localStorage.getItem(STORAGE_KEY_TABLE);
    if (saved) {
      try {
        const tableId = parseInt(saved, 10);
        if (!isNaN(tableId)) {
          this.isLoadingSavedTable.set(true);
          this.tableService.getMetadataTable(tableId).subscribe({
            next: (table) => {
              this.selectedTable.set(table);
              this.isLoadingSavedTable.set(false);
            },
            error: () => {
              localStorage.removeItem(STORAGE_KEY_TABLE);
              this.isLoadingSavedTable.set(false);
            }
          });
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY_TABLE);
      }
    }
  }

  loadLabGroups(): void {
    this.isLoadingLabGroups.set(true);
    this.labGroupService.getMyLabGroups({ limit: 10 }).subscribe({
      next: (response) => {
        this.labGroups.set(response.results);
        this.isLoadingLabGroups.set(false);
      },
      error: () => {
        this.labGroups.set([]);
        this.isLoadingLabGroups.set(false);
      }
    });
  }

  onLabGroupChange(labGroupId: string): void {
    const id = labGroupId ? parseInt(labGroupId, 10) : null;
    this.selectedLabGroupId.set(id);
    if (id) {
      localStorage.setItem(STORAGE_KEY_LAB_GROUP, id.toString());
    } else {
      localStorage.removeItem(STORAGE_KEY_LAB_GROUP);
    }
    this.search();
  }

  search(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const params: MetadataTableQueryParams = { limit: 10 };

    const labGroupId = this.selectedLabGroupId();
    if (labGroupId) params.labGroupId = labGroupId;

    const q = this.searchQuery().trim();
    if (q) params.search = q;

    const colName = this.columnName().trim();
    const colValue = this.columnValue().trim();
    if (colName) params.columnName = colName;
    if (colValue) params.columnValue = colValue;
    if (colName || colValue) params.columnMatch = this.columnMatchExact() ? 'exact' : 'contains';

    this.tableService.getMetadataTables(params).subscribe({
      next: (response) => {
        this.tables.set(response.results);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Search failed');
        this.isLoading.set(false);
      }
    });
  }

  clearColumnSearch(): void {
    this.columnName.set('');
    this.columnValue.set('');
    this.columnMatchExact.set(false);
    this.search();
  }

  selectTable(table: MetadataTable): void {
    this.selectedTable.set(table);
    if (table.id) {
      localStorage.setItem(STORAGE_KEY_TABLE, table.id.toString());
    }
  }

  clearSelection(): void {
    this.selectedTable.set(null);
    localStorage.removeItem(STORAGE_KEY_TABLE);
    this.excelService.clearSheetTableId();
  }
}
