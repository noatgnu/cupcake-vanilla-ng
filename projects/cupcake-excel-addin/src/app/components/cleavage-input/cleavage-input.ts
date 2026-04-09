import { Component, signal, input, output, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  SdrfSyntaxService,
  CleavageAgentDetails,
  OntologySuggestion,
  OntologySearchService,
  OntologyType
} from '@noatgnu/cupcake-vanilla';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, catchError } from 'rxjs';

@Component({
  selector: 'app-cleavage-input',
  imports: [FormsModule],
  templateUrl: './cleavage-input.html',
  styleUrl: './cleavage-input.scss',
})
export class CleavageInput implements OnInit {
  private sdrfSyntax = inject(SdrfSyntaxService);
  private ontologyService = inject(OntologySearchService);

  readonly value = input<string>('');
  readonly valueChange = output<string>();

  readonly NT = signal('');
  readonly AC = signal('');
  readonly CS = signal('');

  readonly suggestions = signal<OntologySuggestion[]>([]);
  readonly isSearching = signal(false);
  readonly showSuggestions = signal(false);

  private searchSubject = new Subject<string>();

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (query.length < 2) {
          return of({ suggestions: [] });
        }
        this.isSearching.set(true);
        return this.ontologyService.suggestWithFilters(
          query,
          OntologyType.MS_UNIQUE_VOCABULARIES,
          { term_type: 'cleavage agent' },
          10
        ).pipe(
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
    const v = this.value();
    if (v) {
      this.parseValue(v);
    }
  }

  private parseValue(value: string): void {
    try {
      const parsed = this.sdrfSyntax.parseValue('cleavage', value) as CleavageAgentDetails;
      if (parsed.NT) this.NT.set(parsed.NT);
      if (parsed.AC) this.AC.set(parsed.AC);
      if (parsed.CS) this.CS.set(parsed.CS);
    } catch {
      // Unable to parse
    }
  }

  onNTInput(value: string): void {
    this.NT.set(value);
    this.searchSubject.next(value);
    this.emitValue();
  }

  selectSuggestion(suggestion: OntologySuggestion): void {
    this.NT.set(suggestion.displayName || suggestion.value);
    if (suggestion.id) {
      this.AC.set(suggestion.id);
    }
    this.showSuggestions.set(false);
    this.emitValue();
  }

  hideSuggestions(): void {
    setTimeout(() => this.showSuggestions.set(false), 200);
  }

  onFieldChange(): void {
    this.emitValue();
  }

  private emitValue(): void {
    const nt = this.NT();
    if (nt) {
      const params: CleavageAgentDetails = { NT: nt };
      const ac = this.AC();
      const cs = this.CS();
      if (ac) params.AC = ac;
      if (cs) params.CS = cs;

      const formatted = this.sdrfSyntax.formatValue('cleavage', params);
      this.valueChange.emit(formatted);
    } else {
      this.valueChange.emit('');
    }
  }
}
