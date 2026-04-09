import { Component, inject, signal, output, input, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OntologySearchService, OntologySuggestion, OntologyType, OntologyTypeLabels, MetadataColumn, ONTOLOGY_TYPE_CONFIGS } from '@noatgnu/cupcake-vanilla';
import { ExcelService } from '../../core/services/excel.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';

type SearchMatchType = 'contains' | 'startswith';

@Component({
  selector: 'app-ontology-search',
  imports: [FormsModule],
  templateUrl: './ontology-search.html',
  styleUrl: './ontology-search.scss',
})
export class OntologySearch {
  private ontologyService = inject(OntologySearchService);
  private excelService = inject(ExcelService);

  readonly column = input<MetadataColumn | null>(null);
  readonly termSelected = output<string>();

  readonly searchQuery = signal('');
  readonly suggestions = signal<OntologySuggestion[]>([]);
  readonly isSearching = signal(false);
  readonly selectedType = signal<OntologyType>(OntologyType.NONE);
  readonly searchMatch = signal<SearchMatchType>('contains');
  readonly showResults = signal(false);
  readonly contextLabel = signal('');

  private searchSubject = new Subject<string>();

  readonly ontologyTypes = Object.values(OntologyType).map(type => ({
    value: type,
    label: type === OntologyType.NONE ? 'All Types' : OntologyTypeLabels[type]
  }));

  constructor() {
    effect(() => {
      const col = this.column();
      if (col?.ontologyType) {
        this.selectedType.set(col.ontologyType as OntologyType);
        const config = ONTOLOGY_TYPE_CONFIGS.find(c => c.value === col.ontologyType);
        this.contextLabel.set(config?.label || OntologyTypeLabels[col.ontologyType as OntologyType] || '');
      } else {
        this.contextLabel.set('');
      }
    });

    this.setupSearch();
  }

  private setupSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (query.length < 2) {
          return of({ suggestions: [] });
        }
        this.isSearching.set(true);
        const type = this.selectedType();
        const match = this.searchMatch();
        return this.ontologyService.suggest({
          q: query,
          type: type !== OntologyType.NONE ? type : undefined,
          match,
          limit: 10
        });
      })
    ).subscribe({
      next: (response) => {
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

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    this.searchSubject.next(value);
  }

  onTypeChange(type: OntologyType): void {
    this.selectedType.set(type);
    if (this.searchQuery().length >= 2) {
      this.searchSubject.next(this.searchQuery());
    }
  }

  onMatchChange(match: SearchMatchType): void {
    this.searchMatch.set(match);
    if (this.searchQuery().length >= 2) {
      this.searchSubject.next(this.searchQuery());
    }
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
          const col = match[1].charCodeAt(0) - 65;
          const row = parseInt(match[2], 10) - 1;
          await this.excelService.updateCell(row, col, value);
        }
      }
    } catch (err) {
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
