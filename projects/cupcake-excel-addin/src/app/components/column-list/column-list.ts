import { Component, inject, signal, input, output, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MetadataTable, MetadataColumn, MetadataTableService, MetadataColumnService, SdrfSyntaxService } from '@noatgnu/cupcake-vanilla';
import { ToastService } from '../../core/services/toast.service';
import { ColumnEditor } from '../column-editor/column-editor';
import { CellEditor } from '../cell-editor/cell-editor';
import { ExcelService } from '../../core/services/excel.service';

type ViewMode = 'list' | 'column-editor' | 'cell-editor';

@Component({
  selector: 'app-column-list',
  imports: [FormsModule, ColumnEditor, CellEditor],
  templateUrl: './column-list.html',
  styleUrl: './column-list.scss',
})
export class ColumnList implements OnInit, OnChanges {
  private tableService = inject(MetadataTableService);
  private columnService = inject(MetadataColumnService);
  private toastService = inject(ToastService);
  private sdrfSyntax = inject(SdrfSyntaxService);
  private excelService = inject(ExcelService);

  readonly table = input.required<MetadataTable>();
  readonly back = output<void>();
  readonly refresh = output<void>();

  readonly columns = signal<MetadataColumn[]>([]);
  readonly isLoading = signal(false);
  readonly selectedColumn = signal<MetadataColumn | null>(null);
  readonly viewMode = signal<ViewMode>('list');
  readonly isCreating = signal(false);
  readonly searchQuery = signal('');
  readonly currentCellValue = signal('');

  ngOnInit(): void {
    this.loadColumns();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['table']) {
      this.loadColumns();
    }
  }

  loadColumns(): void {
    const table = this.table();
    if (table.columns && table.columns.length > 0) {
      this.columns.set([...table.columns].sort((a, b) => a.columnPosition - b.columnPosition));
    } else {
      this.fetchColumns();
    }
  }

  private fetchColumns(): void {
    this.isLoading.set(true);
    this.tableService.getMetadataTable(this.table().id).subscribe({
      next: (tableData) => {
        if (tableData.columns) {
          this.columns.set([...tableData.columns].sort((a, b) => a.columnPosition - b.columnPosition));
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Failed to load columns');
        this.isLoading.set(false);
      }
    });
  }

  filteredColumns(): MetadataColumn[] {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.columns();
    return this.columns().filter(col =>
      col.name.toLowerCase().includes(query) ||
      (col.type && col.type.toLowerCase().includes(query))
    );
  }

  editColumn(column: MetadataColumn): void {
    this.selectedColumn.set(column);
    this.isCreating.set(false);
    this.viewMode.set('column-editor');
  }

  createColumn(): void {
    this.selectedColumn.set(null);
    this.isCreating.set(true);
    this.viewMode.set('column-editor');
  }

  async openValueHelper(column: MetadataColumn): Promise<void> {
    this.selectedColumn.set(column);
    try {
      const selected = await this.excelService.getSelectedRange();
      if (selected.values.length > 0 && selected.values[0].length > 0) {
        this.currentCellValue.set(String(selected.values[0][0] || ''));
      } else {
        this.currentCellValue.set('');
      }
    } catch {
      this.currentCellValue.set('');
    }
    this.viewMode.set('cell-editor');
  }

  hasSpecialInput(column: MetadataColumn): boolean {
    const syntax = this.sdrfSyntax.detectSpecialSyntax(column.name, column.type || '');
    return !!syntax || !!column.ontologyType;
  }

  deleteColumn(column: MetadataColumn): void {
    if (column.mandatory) {
      this.toastService.warning('Cannot delete mandatory column');
      return;
    }

    this.tableService.removeColumn(this.table().id, column.id).subscribe({
      next: () => {
        this.toastService.success(`Column "${column.name}" deleted`);
        this.columns.update(cols => cols.filter(c => c.id !== column.id));
        this.refresh.emit();
      },
      error: () => {
        this.toastService.error('Failed to delete column');
      }
    });
  }

  onColumnSaved(): void {
    this.viewMode.set('list');
    this.selectedColumn.set(null);
    this.fetchColumns();
    this.refresh.emit();
  }

  onEditorCancel(): void {
    this.viewMode.set('list');
    this.selectedColumn.set(null);
  }

  onCellEditorClose(): void {
    this.viewMode.set('list');
    this.selectedColumn.set(null);
  }

  onCellValueSaved(value: string): void {
    this.viewMode.set('list');
    this.selectedColumn.set(null);
  }

  moveColumn(column: MetadataColumn, direction: 'up' | 'down'): void {
    const currentIndex = this.columns().findIndex(c => c.id === column.id);
    const newPosition = direction === 'up' ? column.columnPosition - 1 : column.columnPosition + 1;

    if (newPosition < 0 || newPosition >= this.columns().length) return;

    this.tableService.reorderColumn(this.table().id, column.id, newPosition).subscribe({
      next: () => {
        this.fetchColumns();
        this.toastService.success('Column reordered');
      },
      error: () => {
        this.toastService.error('Failed to reorder column');
      }
    });
  }

  goBack(): void {
    this.back.emit();
  }
}
