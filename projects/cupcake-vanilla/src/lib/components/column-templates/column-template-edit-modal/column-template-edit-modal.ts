import { Component, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { Observable, of, catchError, debounceTime, distinctUntilChanged, tap, switchMap, map } from 'rxjs';
import { MetadataColumnTemplate, ONTOLOGY_TYPE_CONFIGS, COLUMN_TYPE_CONFIGS, OntologyTypeConfig, ColumnTypeConfig, OntologySuggestion } from '../../../models';
import { LabGroup } from '@noatgnu/cupcake-core';
import { MetadataColumnTemplateService, OntologySearchService } from '../../../services';

@Component({
  selector: 'ccv-column-template-edit-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbModule],
  templateUrl: './column-template-edit-modal.html',
  styleUrl: './column-template-edit-modal.scss'
})
export class ColumnTemplateEditModal implements OnInit {
  @Input() template: MetadataColumnTemplate | null = null;
  @Input() labGroups: LabGroup[] = [];
  @Input() isEdit = false;
  @Output() templateSaved = new EventEmitter<Partial<MetadataColumnTemplate>>();

  editForm: FormGroup;
  isLoading = signal(false);
  isLoadingSuggestions = signal(false);

  Object = Object;

  columnTypes: ColumnTypeConfig[] = COLUMN_TYPE_CONFIGS;

  visibilityOptions = [
    { value: 'private', label: 'Private' },
    { value: 'labGroup', label: 'Lab Group' },
    { value: 'public', label: 'Public' },
    { value: 'global', label: 'Global' }
  ];

  ontologyTypes: OntologyTypeConfig[] = ONTOLOGY_TYPE_CONFIGS;

  constructor(
    private fb: FormBuilder,
    private activeModal: NgbActiveModal,
    private templateService: MetadataColumnTemplateService,
    private ontologySearchService: OntologySearchService
  ) {
    this.editForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      columnName: ['', [Validators.required, Validators.pattern(/^[a-zA-Z_][a-zA-Z0-9_]*$/)]],
      columnType: ['text', Validators.required],
      defaultValue: [''],
      defaultPosition: [0, [Validators.min(0)]],
      ontologyType: [''],
      customOntologyFilters: [{}],
      visibility: ['private', Validators.required],
      labGroup: [null],
      enableTypeahead: [false],
      notApplicable: [false],
      notAvailable: [false],
      excelValidation: [false],
      isActive: [true],
      tags: [''],
      category: ['']
    });
  }

  ngOnInit() {
    // Set initial disabled state for labGroup field
    this.onVisibilityChange();

    if (this.template && this.isEdit) {
      this.populateForm();
      // Reapply visibility logic after populating form
      this.onVisibilityChange();
      // Apply ontology filters if ontology type is set
      this.onOntologyTypeChange();
    }
  }

  private populateForm() {
    if (this.template) {
      const ontologyValue = this.getOntologyValueForTemplate(
        this.template.ontologyType,
        this.template.customOntologyFilters
      );

      this.editForm.patchValue({
        name: this.template.name,
        description: this.template.description || '',
        columnName: this.template.columnName,
        columnType: this.template.columnType,
        defaultValue: this.template.defaultValue || '',
        defaultPosition: this.template.defaultPosition || 0,
        ontologyType: ontologyValue,
        customOntologyFilters: this.template.customOntologyFilters || {},
        visibility: this.template.visibility || 'private',
        labGroup: this.template.labGroup || null,
        enableTypeahead: this.template.enableTypeahead || false,
        notApplicable: this.template.notApplicable || false,
        notAvailable: this.template.notAvailable || false,
        excelValidation: this.template.excelValidation || false,
        isActive: this.template.isActive !== false,
        tags: this.template.tags || '',
        category: this.template.category || ''
      });
    }
  }

  private getOntologyValueForTemplate(ontologyType?: string, customFilters?: any): string {
    if (!ontologyType) return '';

    if (!customFilters || Object.keys(customFilters).length === 0) {
      return ontologyType;
    }

    console.log('[Template] Looking for ontology match:', {
      ontologyType,
      customFilters
    });

    const matchingOption = this.ontologyTypes.find(opt => {
      if (opt.value !== ontologyType) return false;

      if (!opt.customFilters) return !customFilters || Object.keys(customFilters).length === 0;

      const optFilterKey = Object.keys(opt.customFilters)[0];
      const templateFilterKey = Object.keys(customFilters)[0];

      if (optFilterKey !== templateFilterKey) {
        return false;
      }

      const optFilterValue = opt.customFilters[optFilterKey];
      const templateFilterValue = customFilters[templateFilterKey];

      const optTermType = optFilterValue?.['term_type'];
      const templateTermType = templateFilterValue?.['term_type'];

      console.log('[Template] Comparing:', {
        label: opt.label,
        optTermType,
        templateTermType,
        matches: optTermType === templateTermType
      });

      return optTermType === templateTermType;
    });

    if (matchingOption) {
      const index = this.ontologyTypes.indexOf(matchingOption);
      console.log('[Template] Found match:', matchingOption.label, 'at index', index);
      return `${matchingOption.value}__${index}`;
    }

    console.warn('[Template] No match found, using base ontology type');
    return ontologyType;
  }

  onVisibilityChange() {
    const visibility = this.editForm.get('visibility')?.value;
    const labGroupControl = this.editForm.get('labGroup');

    if (visibility === 'labGroup') {
      labGroupControl?.setValidators([Validators.required]);
      labGroupControl?.enable();
    } else {
      labGroupControl?.clearValidators();
      labGroupControl?.setValue(null);
      labGroupControl?.disable();
    }
    labGroupControl?.updateValueAndValidity();
  }

  getOptionValue(ontology: OntologyTypeConfig, index: number): string {
    const hasMultipleSameValues = this.ontologyTypes.filter(o => o.value === ontology.value).length > 1;
    if (hasMultipleSameValues) {
      return `${ontology.value}__${index}`;
    }
    return ontology.value;
  }

  onOntologyTypeChange() {
    const ontologyValue = this.editForm.get('ontologyType')?.value;
    const customFiltersControl = this.editForm.get('customOntologyFilters');

    if (!ontologyValue) {
      customFiltersControl?.setValue({});
      customFiltersControl?.markAsDirty();
      return;
    }

    let selectedOntology: OntologyTypeConfig | undefined;

    if (ontologyValue.includes('__')) {
      const index = parseInt(ontologyValue.split('__')[1]);
      selectedOntology = this.ontologyTypes[index];
    } else {
      selectedOntology = this.ontologyTypes.find(ont => ont.value === ontologyValue);
    }

    if (selectedOntology && selectedOntology.customFilters) {
      customFiltersControl?.setValue(selectedOntology.customFilters);
    } else {
      customFiltersControl?.setValue({});
    }

    customFiltersControl?.markAsDirty();
  }

  onSubmit() {
    if (this.editForm.valid) {
      this.isLoading.set(true);
      const formValue = this.editForm.value;

      let ontologyType = formValue.ontologyType;
      if (ontologyType && ontologyType.includes('__')) {
        ontologyType = ontologyType.split('__')[0];
      }

      console.log('[Template] Submitting with:', {
        ontologyType,
        customOntologyFilters: formValue.customOntologyFilters
      });

      const templateData: Partial<MetadataColumnTemplate> = {
        ...formValue,
        ontologyType: ontologyType,
        customOntologyFilters: formValue.customOntologyFilters,
        labGroup: formValue.visibility === 'labGroup' ? formValue.labGroup : null,
        defaultPosition: Number(formValue.defaultPosition) || 0
      };

      this.templateSaved.emit(templateData);
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.editForm.controls).forEach(key => {
      const control = this.editForm.get(key);
      control?.markAsTouched();
    });
  }

  setDefaultValue(value: string): void {
    this.editForm.get('defaultValue')?.setValue(value);
    this.editForm.get('defaultValue')?.markAsTouched();
  }

  onCancel() {
    this.activeModal.dismiss();
  }

  onClose() {
    this.isLoading.set(false);
    this.activeModal.close();
  }

  getFieldError(fieldName: string): string {
    const control = this.editForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) return `${fieldName} is required`;
      if (control.errors['minlength']) return `${fieldName} must be at least ${control.errors['minlength'].requiredLength} characters`;
      if (control.errors['pattern']) return `${fieldName} must be a valid identifier (letters, numbers, underscore)`;
      if (control.errors['min']) return `${fieldName} must be at least ${control.errors['min'].min}`;
    }
    return '';
  }

  get title(): string {
    return this.isEdit ? 'Edit Column Template' : 'Create Column Template';
  }

  get hasOntologyType(): boolean {
    const ontologyValue = this.editForm.get('ontologyType')?.value;
    return !!ontologyValue && ontologyValue !== '';
  }

  searchDefaultValue = (text$: Observable<string>): Observable<OntologySuggestion[]> => {
    return text$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.isLoadingSuggestions.set(true)),
      switchMap(term => {
        if (!term || term.length < 2) {
          this.isLoadingSuggestions.set(false);
          return of([]);
        }

        const ontologyValue = this.editForm.get('ontologyType')?.value;
        if (!ontologyValue) {
          this.isLoadingSuggestions.set(false);
          return of([]);
        }

        let ontologyType = ontologyValue;
        if (ontologyValue.includes('__')) {
          ontologyType = ontologyValue.split('__')[0];
        }

        const customFilters = this.editForm.get('customOntologyFilters')?.value;

        if (this.template?.id) {
          return this.templateService.getOntologySuggestions({
            search: term,
            templateId: this.template.id,
            limit: 10
          }).pipe(
            map(response => response.suggestions || []),
            catchError(error => {
              console.error('Error getting ontology suggestions:', error);
              return of([]);
            }),
            tap(() => this.isLoadingSuggestions.set(false))
          );
        } else if (ontologyType) {
          return this.ontologySearchService.suggest({
            q: term,
            type: ontologyType,
            match: 'contains',
            customFilters: customFilters,
            limit: 10
          }).pipe(
            map(response => response.suggestions || []),
            catchError(error => {
              console.error('Error getting ontology suggestions:', error);
              return of([]);
            }),
            tap(() => this.isLoadingSuggestions.set(false))
          );
        } else {
          this.isLoadingSuggestions.set(false);
          return of([]);
        }
      })
    );
  };

  formatSuggestion = (suggestion: OntologySuggestion): string => {
    return suggestion.displayName || suggestion.value;
  };

  inputFormatter = (suggestion: OntologySuggestion): string => {
    if (suggestion.fullData && suggestion.fullData.name) {
      if (suggestion.fullData.accession) {
        return `NT=${suggestion.fullData.name};AC=${suggestion.fullData.accession}`;
      } else {
        return suggestion.fullData.name;
      }
    }
    return suggestion.displayName || suggestion.value || String(suggestion);
  };

  onSuggestionSelected = (event: any): void => {
    if (event.item) {
      const suggestion = event.item;
      let displayValue: string;

      if (suggestion.fullData && suggestion.fullData.name) {
        if (suggestion.fullData.accession) {
          displayValue = `NT=${suggestion.fullData.name};AC=${suggestion.fullData.accession}`;
        } else {
          displayValue = suggestion.fullData.name;
        }
      } else if (suggestion.displayName) {
        displayValue = suggestion.displayName;
      } else if (suggestion.value) {
        displayValue = suggestion.value;
      } else {
        displayValue = String(suggestion);
      }

      this.editForm.get('defaultValue')?.setValue(displayValue);
      this.editForm.get('defaultValue')?.markAsTouched();
    }
  };
}
