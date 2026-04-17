import { Component, inject, signal, output, input, effect, DestroyRef } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import {
  OntologySearchService,
  MetadataColumnService,
  OntologySuggestion,
  OntologyType,
  OntologyTypeLabels,
  MetadataColumn,
  ONTOLOGY_TYPE_CONFIGS,
  OntologyTypeConfig
} from '@noatgnu/cupcake-vanilla';
import { ExcelService } from '../../core/services/excel.service';
import { combineLatest, debounceTime, switchMap, of } from 'rxjs';

type SearchMatchType = 'contains' | 'startswith';

@Component({
  selector: 'app-ontology-search',
  imports: [FormsModule],
  templateUrl: './ontology-search.html',
  styleUrl: './ontology-search.scss',
})
export class OntologySearch {
  private ontologyService = inject(OntologySearchService);
  private columnService = inject(MetadataColumnService);
  private excelService = inject(ExcelService);
  private destroyRef = inject(DestroyRef);

  readonly column = input<MetadataColumn | null>(null);
  readonly termSelected = output<string>();

  readonly searchQuery = signal('');
  readonly suggestions = signal<OntologySuggestion[]>([]);
  readonly isSearching = signal(false);
  readonly searchMatch = signal<SearchMatchType>('contains');
  readonly showResults = signal(false);
  readonly contextLabel = signal('');
  readonly showAdvanced = signal(false);
  readonly selectedConfigLabel = signal<string>('');
  readonly selectedConfig = signal<OntologyTypeConfig | null>(null);

  readonly ontologyConfigs = ONTOLOGY_TYPE_CONFIGS.filter(c => c.value !== OntologyType.NONE);

  constructor() {
    effect(() => {
      const col = this.column();
      if (col?.ontologyType) {
        const config = this.resolveConfigForColumn(col.ontologyType, col.customOntologyFilters);
        this.selectedConfig.set(config);
        this.selectedConfigLabel.set(config?.label ?? '');
        this.contextLabel.set(config?.label ?? OntologyTypeLabels[col.ontologyType as OntologyType] ?? '');
      } else {
        this.selectedConfig.set(null);
        this.selectedConfigLabel.set('');
        this.contextLabel.set('');
      }
    });

    combineLatest([
      toObservable(this.searchQuery),
      toObservable(this.searchMatch),
      toObservable(this.selectedConfig),
      toObservable(this.column),
    ]).pipe(
      debounceTime(300),
      switchMap(([query, match, config, column]) => {
        if (query.length < 2) {
          this.suggestions.set([]);
          this.showResults.set(false);
          return of(null);
        }
        this.isSearching.set(true);
        const searchType = match === 'startswith' ? 'istartswith' : 'icontains';

        if (column?.id) {
          return this.columnService.getOntologySuggestions({
            columnId: column.id,
            search: query,
            limit: 10,
            searchType
          });
        }

        return this.ontologyService.suggest({
          q: query,
          type: config?.value || undefined,
          match,
          limit: 10,
          customFilters: config?.customFilters ?? undefined
        });
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        if (!response) return;
        this.suggestions.set(response.suggestions || []);
        this.isSearching.set(false);
        this.showResults.set(true);
      },
      error: () => {
        this.suggestions.set([]);
        this.isSearching.set(false);
      }
    });
  }

  private resolveConfigForColumn(ontologyType: string, customOntologyFilters?: any): OntologyTypeConfig | null {
    const hasCustomFilters = customOntologyFilters && Object.keys(customOntologyFilters).length > 0;

    if (!hasCustomFilters) {
      return ONTOLOGY_TYPE_CONFIGS.find(
        c => c.value === ontologyType && (!c.customFilters || Object.keys(c.customFilters).length === 0)
      ) ?? null;
    }

    const camelType = ontologyType.replace(/_([a-z])/g, (_, g) => g.toUpperCase());
    const actualFilters = customOntologyFilters[ontologyType] ?? customOntologyFilters[camelType] ?? customOntologyFilters;
    const filterTermType: string | undefined = actualFilters?.['term_type'] ?? actualFilters?.['termType'];

    return ONTOLOGY_TYPE_CONFIGS.find(c => {
      if (c.value !== ontologyType || !c.customFilters) return false;
      const configFilters = c.customFilters[ontologyType];
      return configFilters?.['term_type'] === filterTermType;
    }) ?? null;
  }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
  }

  onConfigLabelChange(label: string): void {
    this.selectedConfigLabel.set(label);
    const config = label
      ? (ONTOLOGY_TYPE_CONFIGS.find(c => c.label === label) ?? null)
      : null;
    this.selectedConfig.set(config);
    this.contextLabel.set(config?.label ?? '');
  }

  onMatchChange(match: SearchMatchType): void {
    this.searchMatch.set(match);
  }

  toggleAdvanced(): void {
    this.showAdvanced.update(v => !v);
  }

  formatSuggestionValue(suggestion: OntologySuggestion): string {
    if (suggestion.ontologyType === OntologyType.MS_UNIQUE_VOCABULARIES && suggestion.fullData) {
      if (suggestion.fullData.accession) {
        return `NT=${suggestion.fullData.name || suggestion.displayName};AC=${suggestion.fullData.accession}`;
      }
      return suggestion.fullData.name || suggestion.displayName;
    }
    return suggestion.displayName || suggestion.value;
  }

  selectSuggestion(suggestion: OntologySuggestion): void {
    const value = this.formatSuggestionValue(suggestion);
    this.termSelected.emit(value);
    this.searchQuery.set('');
    this.suggestions.set([]);
    this.showResults.set(false);
  }

  async insertIntoCell(suggestion: OntologySuggestion): Promise<void> {
    const value = this.formatSuggestionValue(suggestion);
    try {
      const selected = await this.excelService.getSelectedRange();
      if (selected.values.length === 1 && selected.values[0].length === 1) {
        const match = selected.address.match(/([A-Z]+)(\d+)/);
        if (match) {
          const row = parseInt(match[2], 10) - 1;
          if (row === 0) return;
          const col = match[1].charCodeAt(0) - 65;
          await this.excelService.updateCell(row, col, value);
        }
      }
    } catch {
      this.termSelected.emit(value);
    }
    this.searchQuery.set('');
    this.suggestions.set([]);
    this.showResults.set(false);
  }

  hideResults(): void {
    setTimeout(() => this.showResults.set(false), 200);
  }

  getOntologyTypeLabel(type: string): string {
    return OntologyTypeLabels[type as OntologyType] || type;
  }
}
