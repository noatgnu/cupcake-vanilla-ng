import { Component, signal, input, output, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  SdrfSyntaxService,
  ModificationParameters,
  OntologySuggestion,
  OntologySearchService,
  OntologyType,
  OntologyUtils,
  UnimodSpecification,
  UnimodFullData,
  isUnimodFullData
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
  readonly TS = signal('');

  readonly suggestions = signal<OntologySuggestion[]>([]);
  readonly isSearching = signal(false);
  readonly showSuggestions = signal(false);

  readonly selectedUnimodData = signal<UnimodFullData | null>(null);
  readonly availableSpecifications = signal<(UnimodSpecification & { specNumber: string })[]>([]);
  readonly selectedSpecification = signal<string | null>(null);
  readonly showSpecifications = signal(false);
  readonly showHiddenSpecifications = signal(false);
  readonly hiddenSpecificationCount = signal(0);

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
      if ((parsed as any).TS) this.TS.set((parsed as any).TS);
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
    this.showSuggestions.set(false);

    if (isUnimodFullData(suggestion)) {
      const data = suggestion.fullData as UnimodFullData;
      if (data.accession) this.AC.set(data.accession);
      if (data.deltaComposition) this.CF.set(data.deltaComposition);
      if (data.deltaMonoMass) this.MM.set(String(data.deltaMonoMass));

      this.selectedUnimodData.set(data);
      this.selectedSpecification.set(null);
      this.updateAvailableSpecifications(suggestion);
      this.showSpecifications.set(this.availableSpecifications().length > 0);
    } else {
      this.selectedUnimodData.set(null);
      this.availableSpecifications.set([]);
      this.showSpecifications.set(false);
      this.selectedSpecification.set(null);
    }

    this.emitValue();
  }

  selectSpecification(specNumber: string): void {
    this.selectedSpecification.set(specNumber);
    const unimodData = this.selectedUnimodData();
    if (!unimodData?.specifications[specNumber]) return;

    const spec = unimodData.specifications[specNumber];
    if (spec['site']) this.TA.set(spec['site']);
    if (spec['position']) this.PP.set(this.mapUnimodPosition(spec['position']));
    if (spec['classification']) {
      const mt = this.mapClassificationToType(spec['classification']);
      if (mt) this.MT.set(mt);
    }
    this.emitValue();
  }

  toggleHiddenSpecifications(): void {
    this.showHiddenSpecifications.set(!this.showHiddenSpecifications());
    const unimodData = this.selectedUnimodData();
    if (unimodData) {
      const mockSuggestion: OntologySuggestion = {
        id: '',
        value: '',
        displayName: '',
        ontologyType: OntologyType.UNIMOD,
        fullData: unimodData
      };
      this.updateAvailableSpecifications(mockSuggestion);
    }
  }

  onTAInput(value: string): void {
    const formatted = value
      .replace(/[^A-Za-z,]/g, '')
      .split(',')
      .map(aa => aa.trim().toUpperCase())
      .filter(aa => aa.length > 0)
      .join(',');
    this.TA.set(formatted);
    this.emitValue();
  }

  hideSuggestions(): void {
    setTimeout(() => this.showSuggestions.set(false), 200);
  }

  onFieldChange(): void {
    this.emitValue();
  }

  getSpecificationDisplay(spec: UnimodSpecification & { specNumber: string }): string {
    const parts: string[] = [];
    if (spec['site']) parts.push(`Site: ${spec['site']}`);
    if (spec['position']) parts.push(`${spec['position']}`);
    if (spec['classification']) parts.push(spec['classification']);
    return parts.join(' · ') || `Spec ${spec.specNumber}`;
  }

  private updateAvailableSpecifications(suggestion: OntologySuggestion): void {
    const allSpecs = OntologyUtils.getUnimodSpecifications(suggestion);
    const activeSpecs = OntologyUtils.getActiveUnimodSpecifications(suggestion);
    this.hiddenSpecificationCount.set(allSpecs.length - activeSpecs.length);
    this.availableSpecifications.set(this.showHiddenSpecifications() ? allSpecs : activeSpecs);
  }

  private mapUnimodPosition(unimodPosition: string): string {
    const map: Record<string, string> = {
      'Anywhere': 'Anywhere',
      'Protein N-term': 'Protein N-term',
      'Protein C-term': 'Protein C-term',
      'Any N-term': 'Any N-term',
      'Any C-term': 'Any C-term'
    };
    return map[unimodPosition] || 'Anywhere';
  }

  private mapClassificationToType(classification: string): string | null {
    const map: Record<string, string> = {
      'Post-translational': 'Variable',
      'Chemical derivatization': 'Fixed',
      'Artefact': 'Variable',
      'Pre-translational': 'Fixed',
      'Multiple': 'Variable',
      'Other': 'Variable'
    };
    return map[classification] || null;
  }

  private emitValue(): void {
    const nt = this.NT();
    if (!nt) {
      this.valueChange.emit('');
      return;
    }

    const params: ModificationParameters = { NT: nt };
    const ta = this.TA();
    const ac = this.AC();
    const cf = this.CF();
    const mt = this.MT();
    const pp = this.PP();
    const mm = this.MM();
    const ts = this.TS();

    if (ta) params.TA = ta;
    if (ac) params.AC = ac;
    if (cf) params.CF = cf;
    if (mt) params.MT = mt;
    if (pp) params.PP = pp;
    if (mm) params.MM = mm;
    if (ts) (params as any).TS = ts;

    this.valueChange.emit(this.sdrfSyntax.formatValue('modification', params));
  }
}
