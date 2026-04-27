import { Component, inject, signal, computed, OnInit, OnDestroy, effect, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LowerCasePipe } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '@noatgnu/cupcake-core';
import {
  MetadataColumn, SdrfSyntaxService, SyntaxType,
  MetadataColumnTemplateService, MetadataColumnTemplate, ColumnInputType,
  createSyntheticColumnFromTemplate
} from '@noatgnu/cupcake-vanilla';
import { ExcelService } from '../../core/services/excel.service';
import { SyncService } from '../../core/services/sync.service';
import { ToastService } from '../../core/services/toast.service';
import { SchemaContext } from '../../core/services/schema-context';
import { OntologySearch } from '../ontology-search/ontology-search';
import { ValidationPanel } from '../validation-panel/validation-panel';
import { ColumnInfo } from '../column-info/column-info';
import { AgeInput } from '../age-input/age-input';
import { ModificationInput } from '../modification-input/modification-input';
import { CleavageInput } from '../cleavage-input/cleavage-input';
import { FavoritesPanel } from '../favorites-panel/favorites-panel';
import { NumberWithUnitInput } from '../number-with-unit-input/number-with-unit-input';

type TabType = 'ontology' | 'validate' | 'info';

@Component({
  selector: 'app-non-imported-panel',
  imports: [
    FormsModule,
    LowerCasePipe,
    OntologySearch,
    ValidationPanel,
    ColumnInfo,
    AgeInput,
    ModificationInput,
    CleavageInput,
    FavoritesPanel,
    NumberWithUnitInput
  ],
  templateUrl: './non-imported-panel.html',
  styleUrl: './non-imported-panel.scss',
})
export class NonImportedPanel implements OnInit, OnDestroy {
  private excelService = inject(ExcelService);
  private syncService = inject(SyncService);
  private toastService = inject(ToastService);
  private sdrfSyntax = inject(SdrfSyntaxService);
  private columnTemplateService = inject(MetadataColumnTemplateService);
  private sheetModeTemplateCache = new Map<string, MetadataColumnTemplate | null>();
  private router = inject(Router);
  private authService = inject(AuthService);
  readonly schemaContext = inject(SchemaContext);

  readonly currentUser = this.authService.currentUser;

  readonly activeTab = signal<TabType>('ontology');
  readonly selectedColumn = signal<MetadataColumn | null>(null);
  readonly selectedTemplate = signal<MetadataColumnTemplate | null>(null);
  readonly specialSyntaxType = signal<SyntaxType | null>(null);
  readonly currentCellValue = signal('');
  readonly specialInputValue = signal('');

  readonly columnInputType = computed<ColumnInputType | null>(() => this.selectedTemplate()?.inputType ?? null);
  readonly columnUnits = computed<string[]>(() => this.selectedTemplate()?.units ?? []);

  private selectionInterval: ReturnType<typeof setInterval> | null = null;
  private readonly selectionChangedHandler = () => this.updateSelectedColumn();

  get displayName(): string {
    const user = this.currentUser();
    return user?.firstName || user?.username || '';
  }

  constructor() {
    effect(() => {
      this.schemaContext.selectedSchema();
      this.schemaContext.selectedTableTemplate();
      untracked(() => {
        this.sheetModeTemplateCache.clear();
        this.updateSelectedColumn();
      });
    });
  }

  ngOnInit(): void {
    this.excelService.onSelectionChanged(this.selectionChangedHandler);
    this.selectionInterval = setInterval(() => this.updateSelectedColumn(), 3000);
    this.schemaContext.loadTableTemplates();
    this.updateSelectedColumn();
  }

  ngOnDestroy(): void {
    this.excelService.removeSelectionChangedHandler(this.selectionChangedHandler);
    if (this.selectionInterval) {
      clearInterval(this.selectionInterval);
      this.selectionInterval = null;
    }
  }

  setTab(tab: TabType): void {
    this.activeTab.set(tab);
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

  logout(): void {
    this.authService.logout().subscribe();
    this.router.navigate(['/login']);
  }

  private async updateSelectedColumn(): Promise<void> {
    try {
      const sheetKey = await this.excelService.getSheetId();
      const state = this.syncService.getSheetState(sheetKey ?? '');
      const selection = await this.excelService.getSelectedRange();
      const colMatch = selection.address.match(/\$?([A-Z]+)\$?\d+/);
      if (!colMatch) return;

      const colLetter = colMatch[1];
      const colIndex = this.columnLetterToIndex(colLetter);

      if (state.columns.length) {
        const column = state.columns[colIndex] || null;
        if (column?.id !== this.selectedColumn()?.id) {
          this.selectedColumn.set(column);
          this.fetchColumnTemplate(column);
          this.specialSyntaxType.set(
            column ? this.sdrfSyntax.detectSpecialSyntax(column.name, column.type || '') : null
          );
        }
      } else {
        await this.updateSheetModeColumn(colIndex);
      }

      if (selection.values.length > 0 && selection.values[0].length > 0) {
        const cellValue = String(selection.values[0][0] || '');
        if (cellValue !== this.currentCellValue()) {
          this.currentCellValue.set(cellValue);
          this.specialInputValue.set(cellValue);
        }
      }
    } catch {
      this.selectedColumn.set(null);
      this.selectedTemplate.set(null);
      this.specialSyntaxType.set(null);
    }
  }

  private async updateSheetModeColumn(colIndex: number): Promise<void> {
    const header = await this.excelService.getHeaderAtColumn(colIndex);
    if (!header) {
      this.selectedColumn.set(null);
      this.selectedTemplate.set(null);
      this.specialSyntaxType.set(null);
      return;
    }

    const tableTemplate = this.schemaContext.selectedTableTemplate();
    if (tableTemplate?.userColumns) {
      const col = (tableTemplate.userColumns as any[]).find(c => c.name === header) ?? null;
      if (col) {
        this.selectedColumn.set(col);
        this.selectedTemplate.set(null);
        this.specialSyntaxType.set(this.sdrfSyntax.detectSpecialSyntax(header, col.type || ''));
        return;
      }
    }

    const cacheKey = `${this.schemaContext.selectedSchema()}:${header}`;
    if (this.sheetModeTemplateCache.has(cacheKey)) {
      this.applySheetModeTemplate(header, this.sheetModeTemplateCache.get(cacheKey) ?? null);
      return;
    }

    this.columnTemplateService.getMetadataColumnTemplates({
      search: header,
      sourceSchema: this.schemaContext.selectedSchema(),
      isSystemTemplate: true,
      limit: 10
    }).subscribe({
      next: response => {
        const match = response.results.find(t => t.columnName === header) ?? null;
        this.sheetModeTemplateCache.set(cacheKey, match);
        this.applySheetModeTemplate(header, match);
      },
      error: () => {
        this.sheetModeTemplateCache.set(cacheKey, null);
        this.applySheetModeTemplate(header, null);
      }
    });
  }

  private applySheetModeTemplate(header: string, template: MetadataColumnTemplate | null): void {
    if (!template) {
      this.selectedColumn.set(null);
      this.selectedTemplate.set(null);
      this.specialSyntaxType.set(null);
      return;
    }
    this.selectedColumn.set(createSyntheticColumnFromTemplate(header, template));
    this.selectedTemplate.set(template);
    this.specialSyntaxType.set(
      this.sdrfSyntax.detectSpecialSyntax(header, template.columnType ?? '')
    );
  }

  private fetchColumnTemplate(column: MetadataColumn | null): void {
    if (!column?.template) {
      this.selectedTemplate.set(null);
      return;
    }
    this.columnTemplateService.getMetadataColumnTemplate(column.template).subscribe({
      next: tpl => this.selectedTemplate.set(tpl),
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
}
