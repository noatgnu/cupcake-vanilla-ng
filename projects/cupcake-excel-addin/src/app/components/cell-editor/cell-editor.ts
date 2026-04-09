import { Component, signal, input, output, OnInit, inject, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MetadataColumn,
  SdrfSyntaxService,
  SyntaxType,
  OntologySearchService,
  OntologySuggestion,
  OntologyType,
  OntologyTypeLabels,
  ONTOLOGY_TYPE_CONFIGS
} from '@noatgnu/cupcake-vanilla';
import { AgeInput } from '../age-input/age-input';
import { ModificationInput } from '../modification-input/modification-input';
import { CleavageInput } from '../cleavage-input/cleavage-input';
import { ExcelService } from '../../core/services/excel.service';
import { ToastService } from '../../core/services/toast.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, catchError } from 'rxjs';

@Component({
  selector: 'app-cell-editor',
  imports: [FormsModule, AgeInput, ModificationInput, CleavageInput],
  templateUrl: './cell-editor.html',
  styleUrl: './cell-editor.scss',
})
export class CellEditor implements OnInit {
  private sdrfSyntax = inject(SdrfSyntaxService);
  private ontologyService = inject(OntologySearchService);
  private excelService = inject(ExcelService);
  private toastService = inject(ToastService);

  readonly column = input.required<MetadataColumn>();
  readonly currentValue = input<string>('');
  readonly close = output<void>();
  readonly saved = output<string>();

  readonly syntaxType = signal<SyntaxType | null>(null);
  readonly editValue = signal('');
  readonly isSaving = signal(false);

  readonly suggestions = signal<OntologySuggestion[]>([]);
  readonly isSearching = signal(false);
  readonly showSuggestions = signal(false);

  private searchSubject = new Subject<string>();

  readonly hasOntology = computed(() => {
    const col = this.column();
    return !!col.ontologyType;
  });

  readonly ontologyLabel = computed(() => {
    const col = this.column();
    if (col.ontologyType) {
      const config = ONTOLOGY_TYPE_CONFIGS.find(c => c.value === col.ontologyType);
      if (config) return config.label;
      return OntologyTypeLabels[col.ontologyType as OntologyType] || col.ontologyType;
    }
    return '';
  });

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (query.length < 2) {
          return of({ suggestions: [] });
        }
        this.isSearching.set(true);
        const col = this.column();
        if (col.ontologyType) {
          return this.ontologyService.searchType(query, col.ontologyType as OntologyType, 10).pipe(
            catchError(() => of({ suggestions: [] }))
          );
        }
        return this.ontologyService.searchAll(query, 10).pipe(
          catchError(() => of({ suggestions: [] }))
        );
      })
    ).subscribe({
      next: (response) => {
        this.suggestions.set(response.suggestions || []);
        this.isSearching.set(false);
        this.showSuggestions.set(true);
      },
      error: () => {
        this.suggestions.set([]);
        this.isSearching.set(false);
      }
    });
  }

  ngOnInit(): void {
    this.editValue.set(this.currentValue());
    this.detectSyntaxType();
  }

  private detectSyntaxType(): void {
    const col = this.column();
    const syntax = this.sdrfSyntax.detectSpecialSyntax(col.name, col.type || '');
    this.syntaxType.set(syntax);
  }

  onValueInput(value: string): void {
    this.editValue.set(value);
    if (this.hasOntology() && !this.syntaxType()) {
      this.searchSubject.next(value);
    }
  }

  onSpecialValueChange(value: string): void {
    this.editValue.set(value);
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
    this.editValue.set(value);
    this.showSuggestions.set(false);
  }

  hideSuggestions(): void {
    setTimeout(() => this.showSuggestions.set(false), 200);
  }

  async save(): Promise<void> {
    this.isSaving.set(true);
    try {
      const value = this.editValue();
      this.saved.emit(value);
      this.toastService.success('Value saved');
    } catch {
      this.toastService.error('Failed to save value');
    } finally {
      this.isSaving.set(false);
    }
  }

  async insertToCell(): Promise<void> {
    this.isSaving.set(true);
    try {
      const selected = await this.excelService.getSelectedRange();
      if (selected.values.length === 1 && selected.values[0].length === 1) {
        const match = selected.address.match(/([A-Z]+)(\d+)/);
        if (match) {
          const col = match[1].charCodeAt(0) - 65;
          const row = parseInt(match[2], 10) - 1;
          await this.excelService.updateCell(row, col, this.editValue());
          this.toastService.success('Inserted into cell');
        }
      }
    } catch {
      this.toastService.error('Failed to insert into cell');
    } finally {
      this.isSaving.set(false);
    }
  }

  cancel(): void {
    this.close.emit();
  }

  getOntologyTypeLabel(type: string): string {
    return OntologyTypeLabels[type as OntologyType] || type;
  }
}
