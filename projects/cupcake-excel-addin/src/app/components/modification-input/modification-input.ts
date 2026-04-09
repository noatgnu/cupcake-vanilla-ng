import { Component, signal, input, output, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  SdrfSyntaxService,
  ModificationParameters,
  OntologySuggestion,
  OntologySearchService,
  OntologyType,
  isUnimodFullData,
  UnimodFullData
} from '@noatgnu/cupcake-vanilla';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';

@Component({
  selector: 'app-modification-input',
  imports: [FormsModule],
  templateUrl: './modification-input.html',
  styleUrl: './modification-input.scss',
})
export class ModificationInput implements OnInit {
  private sdrfSyntax = inject(SdrfSyntaxService);
  private ontologyService = inject(OntologySearchService);

  readonly value = input<string>('');
  readonly valueChange = output<string>();

  readonly NT = signal('');
  readonly AC = signal('');
  readonly CF = signal('');
  readonly MT = signal('');
  readonly PP = signal('');
  readonly TA = signal('');
  readonly MM = signal('');

  readonly suggestions = signal<OntologySuggestion[]>([]);
  readonly isSearching = signal(false);
  readonly showSuggestions = signal(false);

  readonly modificationTypes = ['Fixed', 'Variable', 'Annotated'];
  readonly positions = ['Anywhere', 'Protein N-term', 'Protein C-term', 'Any N-term', 'Any C-term'];

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
        return this.ontologyService.searchType(query, OntologyType.UNIMOD, 10);
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
      const parsed = this.sdrfSyntax.parseValue('modification', value) as ModificationParameters;
      if (parsed.NT) this.NT.set(parsed.NT);
      if (parsed.AC) this.AC.set(parsed.AC);
      if (parsed.CF) this.CF.set(parsed.CF);
      if (parsed.MT) this.MT.set(parsed.MT);
      if (parsed.PP) this.PP.set(parsed.PP);
      if (parsed.TA) this.TA.set(parsed.TA);
      if (parsed.MM) this.MM.set(parsed.MM);
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
    const name = isUnimodFullData(suggestion) && suggestion.fullData?.name
      ? suggestion.fullData.name
      : (suggestion.displayName || suggestion.value);

    this.NT.set(name);

    if (isUnimodFullData(suggestion)) {
      const data = suggestion.fullData as UnimodFullData;
      if (data.accession) this.AC.set(data.accession);
      if (data.deltaComposition) this.CF.set(data.deltaComposition);
      if (data.deltaMonoMass) this.MM.set(String(data.deltaMonoMass));
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
    const ta = this.TA();

    if (nt && ta) {
      const params: ModificationParameters = { NT: nt, TA: ta };
      const ac = this.AC();
      const cf = this.CF();
      const mt = this.MT();
      const pp = this.PP();
      const mm = this.MM();

      if (ac) params.AC = ac;
      if (cf) params.CF = cf;
      if (mt) params.MT = mt;
      if (pp) params.PP = pp;
      if (mm) params.MM = mm;

      const formatted = this.sdrfSyntax.formatValue('modification', params);
      this.valueChange.emit(formatted);
    } else if (!nt && !ta) {
      this.valueChange.emit('');
    }
  }
}
