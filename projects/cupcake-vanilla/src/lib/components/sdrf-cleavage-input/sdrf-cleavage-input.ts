import { Component, Input, Output, EventEmitter, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbTypeahead, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { Observable, OperatorFunction, debounceTime, distinctUntilChanged, filter, map, switchMap, of, catchError } from 'rxjs';
import { SdrfSyntaxService, CleavageAgentDetails } from '../../services/sdrf-syntax';
import { OntologySuggestion } from '../../models';
import { MetadataColumnService, MetadataColumnTemplateService } from '../../services';

@Component({
  selector: 'ccv-sdrf-cleavage-input',
  imports: [CommonModule, ReactiveFormsModule, NgbTypeahead, NgbModule],
  templateUrl: './sdrf-cleavage-input.html',
  styleUrl: './sdrf-cleavage-input.scss'
})
export class SdrfCleavageInput implements OnInit {
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

  cleavageForm!: FormGroup;

  ngOnInit() {
    this.cleavageForm = this.fb.group({
      NT: ['', Validators.required], // Name of Term - will use ontology typeahead from parent
      AC: [''], // Accession
      CS: [''] // Cleavage Site pattern
    });

    // Parse initial value
    if (this.value) {
      this.parseAndSetValue(this.value);
    }

    // Subscribe to form changes
    this.cleavageForm.valueChanges.subscribe(() => {
      this.updateValue();
    });
  }

  private parseAndSetValue(value: string) {
    try {
      const parsed = this.sdrfSyntax.parseValue('cleavage', value) as CleavageAgentDetails;
      this.cleavageForm.patchValue(parsed);
    } catch (error) {
      console.warn('Could not parse cleavage agent value:', value);
    }
  }

  // Helper method to ensure we get string values from form controls
  private getStringValue(value: any): string {
    if (typeof value === 'string') {
      return value.trim();
    }
    
    // Handle objects from typeahead selection (OntologySuggestion)
    if (value && typeof value === 'object') {
      // For cleavage agents: display_name for NT, value for AC
      if (value.displayName) return value.displayName;
      if (value.value) return value.value;
      if (value.name) return value.name;
    }
    
    // Fallback to string conversion
    return value ? String(value).trim() : '';
  }

  private updateValue() {
    const formValue = this.cleavageForm.value;

    // Only emit if we have required field
    if (formValue.NT) {
      // Filter out empty values and convert to strings
      const cleanedValue: CleavageAgentDetails = {};
      Object.keys(formValue).forEach(key => {
        const stringValue = this.getStringValue(formValue[key]);
        if (stringValue) {
          cleanedValue[key as keyof CleavageAgentDetails] = stringValue;
        }
      });

      const formatted = this.sdrfSyntax.formatValue('cleavage', cleanedValue);
      this.valueChange.emit(formatted);
    } else if (!formValue.NT) {
      // If required field is empty, emit empty string
      this.valueChange.emit('');
    }
  }

  // Typeahead for NT field (Name of Term) - using ontology suggestions from API
  searchCleavageTerms: OperatorFunction<string, readonly OntologySuggestion[]> = (text$: Observable<string>) =>
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
    return suggestion.displayName || suggestion.value;
  };

  // Handle ontology suggestion selection
  onOntologySuggestionSelected = (event: any): void => {
    const suggestion: OntologySuggestion = event.item;
    if (suggestion) {
      // Set the NT field value
      this.cleavageForm.patchValue({ NT: suggestion.value });

      // Auto-fill AC field if available (use the ID as accession)
      if (suggestion.id) {
        this.cleavageForm.patchValue({ AC: suggestion.id });
      }
    }
  };

  // Handle search type change
  onSearchTypeChange(type: 'icontains' | 'istartswith'): void {
    this.searchType.set(type);
  }
}
