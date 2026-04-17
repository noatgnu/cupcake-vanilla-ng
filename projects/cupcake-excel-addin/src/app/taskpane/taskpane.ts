import { Component, inject, signal, computed, OnInit, OnDestroy, ViewChild, effect, untracked } from '@angular/core';
import { AuthService, AsyncTaskMonitorService } from '@noatgnu/cupcake-core';
import { MetadataColumn, SdrfSyntaxService, SyntaxType, MetadataTableService, MetadataColumnTemplateService, MetadataColumnTemplate, ColumnInputType } from '@noatgnu/cupcake-vanilla';
import { ConnectionPanel } from '../components/connection-panel/connection-panel';
import { TableBrowser } from '../components/table-browser/table-browser';
import { OntologySearch } from '../components/ontology-search/ontology-search';
import { ValidationPanel } from '../components/validation-panel/validation-panel';
import { CompactLogin } from '../components/compact-login/compact-login';
import { ToastContainer } from '../components/toast/toast';
import { AgeInput } from '../components/age-input/age-input';
import { ModificationInput } from '../components/modification-input/modification-input';
import { CleavageInput } from '../components/cleavage-input/cleavage-input';
import { FavoritesPanel } from '../components/favorites-panel/favorites-panel';
import { NumberWithUnitInput } from '../components/number-with-unit-input/number-with-unit-input';
import { ConnectionService } from '../core/services/connection.service';
import { ToastService } from '../core/services/toast.service';
import { SyncService } from '../core/services/sync.service';
import { ExcelService } from '../core/services/excel.service';
import { ThemeService } from '../core/services/theme.service';
import { SettingsService } from '../core/services/settings';
import { ColumnInfo } from '../components/column-info/column-info';

type TabType = 'tables' | 'ontology' | 'validate' | 'info';

@Component({
  selector: 'app-taskpane',
  imports: [
    CompactLogin,
    ConnectionPanel,
    TableBrowser,
    OntologySearch,
    ValidationPanel,
    ToastContainer,
    AgeInput,
    ModificationInput,
    CleavageInput,
    FavoritesPanel,
    ColumnInfo,
    NumberWithUnitInput
  ],
  templateUrl: './taskpane.html',
  styleUrl: './taskpane.scss',
})
export class Taskpane implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private connectionService = inject(ConnectionService);
  private toastService = inject(ToastService);
  private syncService = inject(SyncService);
  private excelService = inject(ExcelService);
  private sdrfSyntax = inject(SdrfSyntaxService);
  private themeService = inject(ThemeService);
  readonly settingsService = inject(SettingsService);
  private tableService = inject(MetadataTableService);
  private columnTemplateService = inject(MetadataColumnTemplateService);
  private asyncTaskMonitor = inject(AsyncTaskMonitorService);

  @ViewChild(TableBrowser) tableBrowser?: TableBrowser;

  readonly isAuthenticated = this.authService.authenticated;
  readonly currentUser = this.authService.currentUser;
  readonly isConnected = this.connectionService.isConnected;
  readonly connectionMode = this.connectionService.mode;

  readonly showSettings = signal(false);
  readonly activeTab = signal<TabType>('tables');
  readonly selectedColumn = signal<MetadataColumn | null>(null);
  readonly selectedTemplate = signal<MetadataColumnTemplate | null>(null);
  readonly specialSyntaxType = signal<SyntaxType | null>(null);
  readonly currentCellValue = signal('');
  readonly specialInputValue = signal('');
  readonly pendingTableId = signal<number | null>(null);

  private selectionInterval: ReturnType<typeof setInterval> | null = null;
  private readonly selectionChangedHandler = () => this.updateSelectedColumn();

  constructor() {
    effect(() => {
      const isAuthenticated = this.authService.authenticated();
      untracked(() => {
        if (isAuthenticated) {
          this.asyncTaskMonitor.startRealtimeUpdates();
        } else {
          this.asyncTaskMonitor.stopRealtimeUpdates();
        }
      });
    });
  }

  readonly displayName = computed(() => {
    const user = this.currentUser();
    if (!user) return '';
    return user.firstName || user.username;
  });

  readonly columnInputType = computed<ColumnInputType | null>(() => {
    return this.selectedTemplate()?.inputType ?? null;
  });

  readonly columnUnits = computed<string[]>(() => {
    return this.selectedTemplate()?.units ?? [];
  });

  ngOnInit(): void {
    this.startSelectionTracking();
  }

  ngOnDestroy(): void {
    this.stopSelectionTracking();
  }

  private startSelectionTracking(): void {
    this.excelService.onSelectionChanged(this.selectionChangedHandler);
    this.selectionInterval = setInterval(() => this.updateSelectedColumn(), 3000);
    this.updateSelectedColumn();
  }

  private stopSelectionTracking(): void {
    this.excelService.removeSelectionChangedHandler(this.selectionChangedHandler);
    if (this.selectionInterval) {
      clearInterval(this.selectionInterval);
      this.selectionInterval = null;
    }
  }

  private async updateSelectedColumn(): Promise<void> {
    try {
      const sheetName = await this.excelService.getActiveWorksheetName();
      const state = this.syncService.getSheetState(sheetName);
      if (!state.columns.length) {
        this.selectedColumn.set(null);
        this.selectedTemplate.set(null);
        this.specialSyntaxType.set(null);
        return;
      }

      const selection = await this.excelService.getSelectedRange();
      const colMatch = selection.address.match(/\$?([A-Z]+)\$?\d+/);
      if (colMatch) {
        const colLetter = colMatch[1];
        const colIndex = this.columnLetterToIndex(colLetter);
        const column = state.columns[colIndex] || null;

        if (column?.id !== this.selectedColumn()?.id) {
          this.selectedColumn.set(column);
          this.fetchColumnTemplate(column);

          if (column) {
            const syntax = this.sdrfSyntax.detectSpecialSyntax(column.name, column.type || '');
            this.specialSyntaxType.set(syntax);
          } else {
            this.specialSyntaxType.set(null);
          }
        }

        if (selection.values.length > 0 && selection.values[0].length > 0) {
          const cellValue = String(selection.values[0][0] || '');
          if (cellValue !== this.currentCellValue()) {
            this.currentCellValue.set(cellValue);
            this.specialInputValue.set(cellValue);
          }
        }
      }
    } catch {
      this.selectedColumn.set(null);
      this.selectedTemplate.set(null);
      this.specialSyntaxType.set(null);
    }
  }

  private fetchColumnTemplate(column: MetadataColumn | null): void {
    if (!column?.template) {
      this.selectedTemplate.set(null);
      return;
    }
    this.columnTemplateService.getMetadataColumnTemplate(column.template).subscribe({
      next: (tpl) => this.selectedTemplate.set(tpl),
      error: () => this.selectedTemplate.set(null)
    });
  }

  private columnLetterToIndex(letter: string): number {
    let index = 0;
    for (let i = 0; i < letter.length; i++) {
      index = index * 26 + (letter.charCodeAt(i) - 64);
    }
    return index - 1;
  }

  toggleSettings(): void {
    this.showSettings.update(v => !v);
  }

  setTab(tab: TabType): void {
    this.activeTab.set(tab);
  }

  logout(): void {
    this.authService.logout().subscribe();
  }

  onTableReady(tableId: number): void {
    this.pendingTableId.set(tableId);
    this.tableService.getMetadataTable(tableId).subscribe({
      next: (table) => {
        this.pendingTableId.set(null);
        if (this.tableBrowser) {
          this.tableBrowser.selectTable(table);
        }
        this.toastService.success(`Table "${table.name}" loaded`);
      },
      error: () => {
        this.pendingTableId.set(null);
        this.toastService.error('Failed to load table');
      }
    });
  }

  onSpecialInputChange(value: string): void {
    this.specialInputValue.set(value);
  }

  async insertSpecialValue(): Promise<void> {
    const value = this.specialInputValue();
    if (!value) return;

    try {
      const selection = await this.excelService.getSelectedRange();
      const match = selection.address.match(/([A-Z]+)(\d+)/);
      if (match) {
        const row = parseInt(match[2], 10) - 1;
        if (row === 0) return;
        const col = this.columnLetterToIndex(match[1]);
        await this.excelService.updateCell(row, col, value);
        this.toastService.success('Value inserted');
      }
    } catch {
      this.toastService.error('Failed to insert value');
    }
  }
}
