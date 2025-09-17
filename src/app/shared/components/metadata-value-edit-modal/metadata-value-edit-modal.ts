import { Component, Input, Output, EventEmitter, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal, NgbModule, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { Observable, of, catchError, debounceTime, distinctUntilChanged, tap, switchMap, map } from 'rxjs';
import { MetadataColumn, OntologySuggestion, FavouriteMetadataOption, FavouriteMetadataOptionService, FavouriteMetadataOptionCreateRequest, MetadataColumnService, MetadataColumnTemplateService, OntologyType } from '@cupcake/vanilla';
import { AuthService, User, LabGroupService } from '@cupcake/core';
import { SdrfSyntaxService, SyntaxType } from '../../services/sdrf-syntax';
import { SdrfAgeInput } from '../sdrf-age-input/sdrf-age-input';
import { SdrfModificationInput } from '../sdrf-modification-input/sdrf-modification-input';
import { SdrfCleavageInput } from '../sdrf-cleavage-input/sdrf-cleavage-input';
import { SdrfSpikedCompoundInput } from '../sdrf-spiked-compound-input/sdrf-spiked-compound-input';

export interface MetadataValueEditConfig {
  columnId?: number;
  columnName: string;
  columnType: string;
  ontologyType?: string;
  enableTypeahead?: boolean;
  currentValue?: string;
  context: 'template' | 'table' | 'pool' | 'favorite_management';
  templateId?: number;
  tableId?: number;
  poolId?: number;
  customOntologyFilters?: Record<string, any>;
  enableMultiSampleEdit?: boolean;
  sampleData?: { index: number; value: string; sourceName?: string }[];
  maxSampleCount?: number;
}

@Component({
  selector: 'app-metadata-value-edit-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgbModule,
    NgbNavModule,
    SdrfAgeInput,
    SdrfModificationInput,
    SdrfCleavageInput,
    SdrfSpikedCompoundInput
  ],
  templateUrl: './metadata-value-edit-modal.html',
  styleUrl: './metadata-value-edit-modal.scss'
})
export class MetadataValueEditModal implements OnInit {
  @Input() config!: MetadataValueEditConfig;
  @Output() valueSaved = new EventEmitter<string | { value: string; sampleIndices: number[] }>();

  editForm: FormGroup;
  isLoading = signal(false);
  isLoadingSuggestions = signal(false);
  searchType = signal<'icontains' | 'istartswith'>('icontains');

  isLoadingFavorites = signal(false);
  userFavorites = signal<FavouriteMetadataOption[]>([]);
  labGroupFavorites = signal<FavouriteMetadataOption[]>([]);
  globalFavorites = signal<FavouriteMetadataOption[]>([]);
  selectedFavorite = signal<FavouriteMetadataOption | null>(null);

  currentUser = signal<User | null>(null);
  userLabGroups = signal<number[]>([]);

  activeFavoritesTab: 'user' | 'lab_group' | 'global' = 'user';

  private sdrfSyntaxService = inject(SdrfSyntaxService);
  specialSyntaxType = signal<SyntaxType | null>(null);
  showSpecialInput = signal(false);
  specialInputValue = signal('');

  selectedSampleIndices = signal<Set<number>>(new Set());
  showSamplePanel = signal(false);

  constructor(
    private fb: FormBuilder,
    private activeModal: NgbActiveModal,
    private authService: AuthService,
    private favouriteMetadataOptionService: FavouriteMetadataOptionService,
    private metadataColumnService: MetadataColumnService,
    private metadataColumnTemplateService: MetadataColumnTemplateService,
    private labGroupService: LabGroupService
  ) {
    this.editForm = this.fb.group({
      value: ['', [Validators.maxLength(500)]]
    });
  }

  ngOnInit() {

    const syntaxType = this.sdrfSyntaxService.detectSpecialSyntax(
      this.config.columnName,
      this.config.columnType
    );

    if (syntaxType) {
      this.specialSyntaxType.set(syntaxType);
      this.showSpecialInput.set(true);
      this.specialInputValue.set(this.config?.currentValue || '');
    }

    if (this.config?.currentValue) {
      this.editForm.patchValue({
        value: this.config.currentValue
      });
    }

    this.currentUser.set(this.authService.getCurrentUser());

    if (this.currentUser()) {
      this.loadUserLabGroups();
    }

    this.loadFavoriteOptions();


    if (this.config?.enableMultiSampleEdit && this.config?.sampleData) {
      this.showSamplePanel.set(true);
      console.log('Multi-sample editing enabled with', this.config.sampleData.length, 'samples');
    } else {
      console.log('Multi-sample editing not enabled:', {
        enableMultiSampleEdit: this.config?.enableMultiSampleEdit,
        hasSampleData: !!this.config?.sampleData,
        sampleDataLength: this.config?.sampleData?.length
      });
    }

    this.editForm.get('value')?.valueChanges.subscribe((newValue) => {
      const selected = this.selectedFavorite();
      if (selected && selected.value !== newValue) {
        this.selectedFavorite.set(null);
      }
    });
  }


  onCancel() {
    this.activeModal.dismiss();
  }

  onClose() {
    this.isLoading.set(false);
    this.activeModal.close();
  }

  get title(): string {
    return `Edit ${this.config?.columnName || 'Metadata Value'}`;
  }

  get hasOntologyType(): boolean {
    return !!(this.config?.ontologyType && this.config.ontologyType.length > 0 && this.config.enableTypeahead);
  }

  get ontologyTypeLabel(): string {
    return this.config?.ontologyType || '';
  }

  get isFromFavoriteManagement(): boolean {
    return this.config?.context === 'favorite_management';
  }

  // Ontology autocomplete methods
  searchOntology = (text$: Observable<string>): Observable<OntologySuggestion[]> => {
    return text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      tap(() => this.isLoadingSuggestions.set(true)),
      switchMap(term => {
        if (term.length < 2 || !this.hasOntologyType) {
          this.isLoadingSuggestions.set(false);
          return of([]);
        }

        if (this.config.context === 'table' && this.config.columnId) {
          return this.metadataColumnService.getOntologySuggestions({
            columnId: this.config.columnId,
            search: term,
            limit: 10,
            searchType: this.searchType()
          }).pipe(
            switchMap(response => of(response.suggestions || [])),
            catchError(() => of([])),
            tap(() => this.isLoadingSuggestions.set(false))
          );
        } else if ((this.config.context === 'template' || this.config.context === 'favorite_management') && this.config.templateId) {
          return this.metadataColumnTemplateService.getOntologySuggestions({
            templateId: this.config.templateId,
            search: term,
            limit: 10,
            searchType: this.searchType()
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
    if (suggestion && suggestion.ontologyType === OntologyType.MS_UNIQUE_VOCABULARIES && suggestion.fullData && suggestion.fullData.name) {
      if (suggestion.fullData.accession) {
        return `NT=${suggestion.fullData.name};AC=${suggestion.fullData.accession}`;
      } else {
        return suggestion.fullData.name;
      }
    }

    // For other ontology types, use regular value
    return suggestion.displayName || suggestion.value || String(suggestion);
  };

  onSuggestionSelected = (event: any): void => {
    if (event.item) {
      const suggestion = event.item;
      let displayValue: string;

      // Extract the proper display value based on suggestion type
      if (suggestion.fullData && suggestion.fullData.name) {
        // For ontology suggestions with fullData, format according to SDRF syntax
        if (suggestion.fullData.accession) {
          // Use SDRF syntax: NT={name};AC={accession}
          displayValue = `NT=${suggestion.fullData.name};AC=${suggestion.fullData.accession}`;
        } else {
          // Only name available, use just the name
          displayValue = suggestion.fullData.name;
        }
      } else if (suggestion.displayName) {
        // For standard ontology suggestions, use displayName
        displayValue = suggestion.displayName;
      } else if (suggestion.value) {
        // Fallback to basic value
        displayValue = suggestion.value;
      } else {
        // Last resort
        displayValue = String(suggestion);
      }

      this.editForm.get('value')?.setValue(displayValue);
      this.editForm.get('value')?.markAsTouched();
    }
  };

  onSearchTypeChange(type: 'icontains' | 'istartswith'): void {
    this.searchType.set(type);
  }

  clearValue(): void {
    this.editForm.get('value')?.setValue('');
    this.editForm.get('value')?.markAsTouched();
    this.selectedFavorite.set(null); // Clear selected favorite when manually clearing
  }

  // Favorite options methods
  loadFavoriteOptions(): void {
    if (!this.config?.columnName || !this.config?.columnType) return;

    this.isLoadingFavorites.set(true);

    // Build base query parameters for column name
    const baseQueryParams = {
      name: this.config.columnName,
      limit: 10
    };

    // Load user favorites
    const currentUser = this.currentUser();
    if (currentUser?.id) {
      this.favouriteMetadataOptionService.getFavouriteMetadataOptions({
        ...baseQueryParams,
        userId: currentUser.id
      }).subscribe({
        next: (response) => {
          this.userFavorites.set(response.results);
        },
        error: () => this.userFavorites.set([])
      });
    }

    // Load lab group favorites - load for first lab group if user has any
    const userLabGroups = this.userLabGroups();
    if (userLabGroups.length > 0) {
      this.favouriteMetadataOptionService.getFavouriteMetadataOptions({
        ...baseQueryParams,
        labGroupId: userLabGroups[0] // Use first lab group for now
      }).subscribe({
        next: (response) => {
          this.labGroupFavorites.set(response.results);
        },
        error: () => this.labGroupFavorites.set([])
      });
    } else {
      this.labGroupFavorites.set([]);
    }

    // Load global favorites
    this.favouriteMetadataOptionService.getFavouriteMetadataOptions({
      ...baseQueryParams,
      isGlobal: true
    }).subscribe({
      next: (response) => {
        this.globalFavorites.set(response.results);
        this.isLoadingFavorites.set(false);
        // Set initial active tab based on available favorites
        this.setInitialActiveFavoritesTab();
      },
      error: () => {
        this.globalFavorites.set([]);
        this.isLoadingFavorites.set(false);
        // Set initial active tab based on available favorites
        this.setInitialActiveFavoritesTab();
      }
    });
  }

  selectFavorite(favorite: FavouriteMetadataOption): void {
    const favoriteValue = favorite.value || '';

    // Set the form value
    this.editForm.get('value')?.setValue(favoriteValue);
    this.editForm.get('value')?.markAsTouched();
    this.selectedFavorite.set(favorite);

    if (this.showSpecialInput() && this.specialSyntaxType()) {
      this.specialInputValue.set(favoriteValue);
    }

    if (favorite.columnTemplate && favorite.columnTemplate !== this.config.templateId) {
      this.config.templateId = favorite.columnTemplate;
    }

    if (this.hasCustomDisplayValue(favorite)) {
      console.log(`Selected "${favorite.displayValue}" (value: ${favorite.value})`);
    }
  }

  onFavoriteSelected(event: Event, favoritesList: FavouriteMetadataOption[]): void {
    const selectElement = event.target as HTMLSelectElement;
    const favoriteId = selectElement.value;

    if (!favoriteId) {
      return; // No selection made
    }

    const selectedFavorite = favoritesList.find(fav => fav.id?.toString() === favoriteId);
    if (selectedFavorite) {
      this.selectFavorite(selectedFavorite);
    }
  }

  setActiveFavoritesTab(tab: 'user' | 'lab_group' | 'global'): void {
    this.activeFavoritesTab = tab;
  }

  setInitialActiveFavoritesTab(): void {
    // Set the first available tab as active
    if (this.userFavorites().length > 0) {
      this.activeFavoritesTab = 'user';
    } else if (this.labGroupFavorites().length > 0) {
      this.activeFavoritesTab = 'lab_group';
    } else if (this.globalFavorites().length > 0) {
      this.activeFavoritesTab = 'global';
    }
  }

  addToFavorites(scope: 'user' | 'lab_group' | 'global' = 'user'): void {
    const value = this.editForm.get('value')?.value;
    if (!value || !this.config?.columnName || !this.config?.columnType) return;

    const newFavorite: FavouriteMetadataOptionCreateRequest = {
      name: this.config.columnName,
      type: this.config.columnType,
      columnTemplate: this.config.templateId || undefined,
      value: value,
      displayValue: value,
      isGlobal: scope === 'global',
      user: scope === 'user' ? this.currentUser()?.id : undefined,
      labGroup: scope === 'lab_group' ? this.userLabGroups()[0] || undefined : undefined
    };

    this.favouriteMetadataOptionService.createFavouriteMetadataOption(newFavorite).subscribe({
      next: (created) => {
        // Add to appropriate list
        if (scope === 'user') {
          this.userFavorites.set([...this.userFavorites(), created]);
        } else if (scope === 'lab_group') {
          this.labGroupFavorites.set([...this.labGroupFavorites(), created]);
        } else {
          this.globalFavorites.set([...this.globalFavorites(), created]);
        }
      },
      error: (error) => {
        console.error('Error adding to favorites:', error);
      }
    });
  }

  get hasFavorites(): boolean {
    return this.userFavorites().length > 0 ||
           this.labGroupFavorites().length > 0 ||
           this.globalFavorites().length > 0;
  }

  getFavoriteDisplayValue(favorite: FavouriteMetadataOption): string {
    return favorite.displayValue || favorite.value || '';
  }

  getFavoriteTooltip(favorite: FavouriteMetadataOption): string {
    const displayValue = favorite.displayValue || favorite.value || '';
    const actualValue = favorite.value || '';

    if (favorite.displayValue && favorite.displayValue !== actualValue) {
      return `${displayValue}\n\nActual value: ${actualValue}`;
    }

    return displayValue;
  }

  hasCustomDisplayValue(favorite: FavouriteMetadataOption): boolean {
    return !!(favorite.displayValue &&
              favorite.displayValue !== favorite.value &&
              favorite.displayValue.trim() !== '');
  }

  getSelectedFavoriteInfo(): string {
    const selected = this.selectedFavorite();
    const currentValue = this.editForm.get('value')?.value;

    if (!selected || !currentValue || selected.value !== currentValue) {
      return '';
    }

    if (this.hasCustomDisplayValue(selected)) {
      return `Selected from favorite: "${selected.displayValue}"`;
    }

    return '';
  }

  loadUserLabGroups(): void {
    // Load user's lab groups
    this.labGroupService.getMyLabGroups({ limit: 10 }).subscribe({
      next: (response) => {
        const labGroupIds = response.results.map(group => group.id!);
        this.userLabGroups.set(labGroupIds);
      },
      error: (error) => {
        console.error('Error loading user lab groups:', error);
        this.userLabGroups.set([]);
      }
    });
  }

  // SDRF Special Syntax Methods
  onSpecialInputChange(value: string): void {
    this.specialInputValue.set(value);
    this.editForm.patchValue({ value });
  }

  toggleSpecialInput(): void {
    this.showSpecialInput.set(!this.showSpecialInput());

    if (!this.showSpecialInput()) {
      // Switching to normal input, sync the current value
      this.editForm.patchValue({ value: this.specialInputValue() });
    }
  }

  getSpecialInputTitle(): string {
    const syntaxType = this.specialSyntaxType();
    switch (syntaxType) {
      case 'age': return 'Age Format Editor';
      case 'modification': return 'Modification Parameters Editor';
      case 'cleavage': return 'Cleavage Agent Editor';
      case 'spiked_compound': return 'Spiked Compound Editor';
      default: return 'Special Format Editor';
    }
  }

  // Multi-sample editing methods
  get hasMultiSampleEdit(): boolean {
    return !!(this.config?.enableMultiSampleEdit && this.config?.sampleData && this.config.sampleData.length > 0);
  }

  get sampleData(): { index: number; value: string; sourceName?: string }[] {
    return this.config?.sampleData || [];
  }

  toggleSampleSelection(sampleIndex: number): void {
    const current = new Set(this.selectedSampleIndices());
    if (current.has(sampleIndex)) {
      current.delete(sampleIndex);
    } else {
      current.add(sampleIndex);
    }
    this.selectedSampleIndices.set(current);
  }

  selectAllSamples(): void {
    const allIndices = new Set(this.sampleData.map(s => s.index));
    this.selectedSampleIndices.set(allIndices);
  }

  clearSampleSelection(): void {
    this.selectedSampleIndices.set(new Set());
  }

  get selectedSampleCount(): number {
    return this.selectedSampleIndices().size;
  }

  get totalSampleCount(): number {
    return this.sampleData.length;
  }

  isSampleSelected(sampleIndex: number): boolean {
    return this.selectedSampleIndices().has(sampleIndex);
  }

  // Override the onSubmit method to handle multi-sample editing
  onSubmit(): void {
    if (this.editForm.valid) {
      this.isLoading.set(true);
      const rawValue = this.editForm.get('value')?.value || '';

      // If the form contains an object (ontology suggestion), format it properly
      let value: string;
      if (typeof rawValue === 'object' && rawValue !== null) {
        // For MS Unique Vocabularies, use SDRF formatting
        if (rawValue.ontologyType === OntologyType.MS_UNIQUE_VOCABULARIES && rawValue.fullData && rawValue.fullData.name) {
          if (rawValue.fullData.accession) {
            value = `NT=${rawValue.fullData.name};AC=${rawValue.fullData.accession}`;
          } else {
            value = rawValue.fullData.name;
          }
        } else {
          // For other ontology types, use the regular value
          value = rawValue.displayName || rawValue.value || String(rawValue);
        }
      } else {
        value = String(rawValue);
      }


      // If multi-sample editing is enabled and samples are selected, include the sample indices
      if (this.hasMultiSampleEdit && this.selectedSampleCount > 0) {
        const selectedIndices = Array.from(this.selectedSampleIndices());
        this.valueSaved.emit({ value, sampleIndices: selectedIndices });
      } else {
        this.valueSaved.emit(value);
      }
    }
  }
}
