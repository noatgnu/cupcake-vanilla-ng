import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbTypeahead, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { Observable, OperatorFunction, debounceTime, distinctUntilChanged, filter, map, switchMap, of, catchError } from 'rxjs';
import { SdrfSyntaxService, ModificationParameters } from '../../services/sdrf-syntax';
import { 
  OntologySuggestion, 
  UnimodFullData, 
  UnimodSpecification, 
  isUnimodFullData, 
  OntologyUtils,
  MetadataColumnService,
  MetadataColumnTemplateService 
} from '../../models';

@Component({
  selector: 'app-sdrf-modification-input',
  imports: [CommonModule, ReactiveFormsModule, NgbTypeahead, NgbModule],
  templateUrl: './sdrf-modification-input.html',
  styleUrl: './sdrf-modification-input.scss'
})
export class SdrfModificationInput implements OnInit {
  @Input() value: string = '';
  @Input() templateId: number | null = null; // Template ID for ontology suggestions
  @Input() columnId: number | null = null; // Column ID for ontology suggestions (actual metadata column)
  @Output() valueChange = new EventEmitter<string>();

  // Search type for typeahead - internal signal
  searchType = signal<'icontains' | 'istartswith'>('icontains');

  private fb = inject(FormBuilder);
  private sdrfSyntax = inject(SdrfSyntaxService);
  private metadataColumnService = inject(MetadataColumnService);
  private metadataColumnTemplateService = inject(MetadataColumnTemplateService);

  modificationForm!: FormGroup;

  // Predefined options for dropdowns
  modificationTypes = ['Fixed', 'Variable', 'Annotated'];
  positions = ['Anywhere', 'Protein N-term', 'Protein C-term', 'Any N-term', 'Any C-term'];

  // Unimod specification support
  selectedUnimodData = signal<UnimodFullData | null>(null);
  availableSpecifications = signal<(UnimodSpecification & { specNumber: string })[]>([]);
  selectedSpecification = signal<string | null>(null);
  showSpecifications = signal(false);
  showHiddenSpecifications = signal(false);
  hiddenSpecificationCount = signal(0);

  ngOnInit() {
    this.modificationForm = this.fb.group({
      NT: ['', Validators.required], // Name of Term - with typeahead
      AC: [''], // Accession
      CF: [''], // Chemical Formula
      MT: [''], // Modification Type
      PP: [''], // Position in Polypeptide
      TA: ['', Validators.required], // Target Amino acid
      MM: ['', [Validators.pattern(/^\d+(\.\d+)?$/)]], // Monoisotopic Mass
      TS: [''] // Target Site regex
    });

    // Parse initial value
    if (this.value) {
      this.parseAndSetValue(this.value);
    }

    // Subscribe to form changes
    this.modificationForm.valueChanges.subscribe(() => {
      this.updateValue();
    });
  }

  private parseAndSetValue(value: string) {
    try {
      const parsed = this.sdrfSyntax.parseValue('modification', value) as ModificationParameters;
      this.modificationForm.patchValue(parsed);
    } catch (error) {
      console.warn('Could not parse modification value:', value);
    }
  }

  // Helper method to ensure we get string values from form controls
  private getStringValue(value: any): string {
    if (typeof value === 'string') {
      return value.trim();
    }
    
    // Handle objects from typeahead selection (OntologySuggestion)
    if (value && typeof value === 'object') {
      // For Unimod modifications, use the name from full_data
      if (value.full_data && value.full_data.name) {
        return value.full_data.name;
      }
      // For other ontology types, use the value property
      if (value.value) return value.value;
      if (value.name) return value.name;
    }
    
    // Fallback to string conversion
    return value ? String(value).trim() : '';
  }

  private updateValue() {
    const formValue = this.modificationForm.value;

    // Only emit if we have required fields
    if (formValue.NT && formValue.TA) {
      // Build cleaned value, ensuring NT is always included and properly stringified
      const cleanedValue: ModificationParameters = {
        NT: this.getStringValue(formValue.NT), // Always include NT field as string
        TA: this.getStringValue(formValue.TA)  // Always include TA field as string
      };

      // Add other non-empty fields
      Object.keys(formValue).forEach(key => {
        if (key !== 'NT' && key !== 'TA') { // Skip NT and TA as they're already added
          const value = formValue[key];
          const stringValue = this.getStringValue(value);
          if (stringValue) {
            cleanedValue[key as keyof ModificationParameters] = stringValue;
          }
        }
      });

      const formatted = this.sdrfSyntax.formatValue('modification', cleanedValue);
      this.valueChange.emit(formatted);
    } else if (!formValue.NT && !formValue.TA) {
      // If both required fields are empty, emit empty string
      this.valueChange.emit('');
    }
  }

  // Typeahead for NT field (Name of Term) - using ontology suggestions from API
  searchModificationTerms: OperatorFunction<string, readonly OntologySuggestion[]> = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      filter(term => term.length >= 2),
      switchMap(term => {
        // Use column ID first if available (for actual metadata columns), otherwise template ID (for templates/favorites)
        if (this.columnId) {
          return this.metadataColumnService.getOntologySuggestions({
            columnId: this.columnId,
            search: term,
            limit: 10,
            searchType: this.searchType()
          }).pipe(
            map(response => response.suggestions || []),
            catchError(error => {
              console.warn(`Failed to get ontology suggestions for column ${this.columnId}:`, error);
              return of([]);
            })
          );
        } else if (this.templateId) {
          return this.metadataColumnTemplateService.getOntologySuggestions({
            templateId: this.templateId,
            search: term,
            limit: 10,
            searchType: this.searchType()
          }).pipe(
            map(response => response.suggestions || []),
            catchError(error => {
              console.warn(`Failed to get ontology suggestions for template ${this.templateId}:`, error);
              return of([]);
            })
          );
        } else {
          // No ID available, return empty suggestions
          return of([]);
        }
      })
    );

  // Formatter for ontology suggestions
  formatOntologySuggestion = (suggestion: OntologySuggestion): string => {
    return suggestion.display_name || suggestion.value;
  };

  // Handle ontology suggestion selection
  onOntologySuggestionSelected = (event: any): void => {
    const suggestion: OntologySuggestion = event.item;
    if (suggestion) {
      // Set the NT field value - use display name for Unimod, otherwise use value
      const ntValue = isUnimodFullData(suggestion) && suggestion.full_data.name 
        ? suggestion.full_data.name 
        : (suggestion.display_name || suggestion.value);
      this.modificationForm.patchValue({ NT: ntValue });

      // Check if this is a Unimod modification with specifications
      if (isUnimodFullData(suggestion)) {
        this.selectedUnimodData.set(suggestion.full_data);
        this.updateAvailableSpecifications(suggestion);
        this.showSpecifications.set(this.availableSpecifications().length > 0);

        // Auto-fill some fields from main Unimod data
        if (suggestion.full_data.accession) {
          this.modificationForm.patchValue({ AC: suggestion.full_data.accession });
        }
        if (suggestion.full_data.delta_composition) {
          this.modificationForm.patchValue({ CF: suggestion.full_data.delta_composition });
        }
        if (suggestion.full_data.delta_mono_mass) {
          this.modificationForm.patchValue({ MM: suggestion.full_data.delta_mono_mass });
        }
      } else {
        // Not a Unimod modification, clear specification data
        this.selectedUnimodData.set(null);
        this.availableSpecifications.set([]);
        this.showSpecifications.set(false);
        this.selectedSpecification.set(null);
      }
    }
  };

  // Format TA field display (amino acids)
  formatTargetAminoAcids(value: string): string {
    if (!value) return '';
    // Split by comma and clean up
    return value.split(',').map(aa => aa.trim().toUpperCase()).join(', ');
  }

  onTargetAminoAcidChange(event: any) {
    const value = event.target.value;
    if (value) {
      // Format as uppercase and validate amino acid letters
      const formatted = value
        .replace(/[^A-Za-z,]/g, '') // Only allow letters and commas
        .split(',')
        .map((aa: string) => aa.trim().toUpperCase())
        .filter((aa: string) => aa.length > 0)
        .join(',');

      this.modificationForm.patchValue({ TA: formatted });
    }
  }

  // Handle specification selection
  onSpecificationSelected(specNumber: string): void {
    this.selectedSpecification.set(specNumber);
    const unimodData = this.selectedUnimodData();

    if (unimodData && unimodData.specifications[specNumber]) {
      const spec = unimodData.specifications[specNumber];

      // Ensure NT field is preserved (use the Unimod name)
      const currentNT = this.modificationForm.get('NT')?.value;
      if (!currentNT && unimodData.name) {
        this.modificationForm.patchValue({ NT: unimodData.name });
      }

      // Update form fields with specification data
      if (spec['site']) {
        this.modificationForm.patchValue({ TA: spec['site'] });
      }
      if (spec['position']) {
        // Map Unimod position to our dropdown values
        const mappedPosition = this.mapUnimodPosition(spec['position']);
        this.modificationForm.patchValue({ PP: mappedPosition });
      }
      if (spec['classification']) {
        // Map classification to modification type if possible
        const mappedType = this.mapClassificationToType(spec['classification']);
        if (mappedType) {
          this.modificationForm.patchValue({ MT: mappedType });
        }
      }
    }
  }

  // Map Unimod position to our dropdown values
  private mapUnimodPosition(unimodPosition: string): string {
    const positionMap: Record<string, string> = {
      'Anywhere': 'Anywhere',
      'Protein N-term': 'Protein N-term',
      'Protein C-term': 'Protein C-term',
      'Any N-term': 'Any N-term',
      'Any C-term': 'Any C-term'
    };

    return positionMap[unimodPosition] || 'Anywhere';
  }

  // Map classification to modification type
  private mapClassificationToType(classification: string): string | null {
    const classificationMap: Record<string, string> = {
      'Post-translational': 'Variable',
      'Chemical derivatization': 'Fixed',
      'Artefact': 'Variable',
      'Pre-translational': 'Fixed',
      'Multiple': 'Variable',
      'Other': 'Variable'
    };

    return classificationMap[classification] || null;
  }

  // Get specification display text
  getSpecificationDisplay(spec: UnimodSpecification & { specNumber: string }): string {
    const parts = [];
    if (spec['site']) parts.push(`Site: ${spec['site']}`);
    if (spec['position']) parts.push(`Position: ${spec['position']}`);
    if (spec['classification']) parts.push(`Class: ${spec['classification']}`);

    return parts.join(' | ') || `Specification ${spec.specNumber}`;
  }

  // Handle search type change
  onSearchTypeChange(type: 'icontains' | 'istartswith'): void {
    this.searchType.set(type);
  }

  // Update available specifications based on toggle state
  private updateAvailableSpecifications(suggestion: OntologySuggestion): void {
    if (!isUnimodFullData(suggestion)) return;

    const allSpecs = OntologyUtils.getUnimodSpecifications(suggestion);
    const activeSpecs = OntologyUtils.getActiveUnimodSpecifications(suggestion);
    
    // Calculate hidden count
    this.hiddenSpecificationCount.set(allSpecs.length - activeSpecs.length);
    
    // Set available specifications based on toggle
    const specsToShow = this.showHiddenSpecifications() ? allSpecs : activeSpecs;
    this.availableSpecifications.set(specsToShow);
  }

  // Toggle hidden specifications visibility
  toggleHiddenSpecifications(): void {
    this.showHiddenSpecifications.set(!this.showHiddenSpecifications());
    
    // Update available specifications
    const unimodData = this.selectedUnimodData();
    if (unimodData) {
      // Create a mock suggestion object to pass to updateAvailableSpecifications
      const mockSuggestion: OntologySuggestion = {
        id: '',
        value: '',
        display_name: '',
        ontology_type: 'unimod',
        full_data: unimodData
      };
      this.updateAvailableSpecifications(mockSuggestion);
    }
  }
}
