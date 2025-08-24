import { Component, Input, Output, EventEmitter, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal, NgbModule, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { Observable, of, catchError, debounceTime, distinctUntilChanged, tap, switchMap } from 'rxjs';
import { MetadataColumn, OntologySuggestion, FavouriteMetadataOption } from '../../models';
import { ApiService } from '../../services/api';
import { AuthService, User } from 'cupcake-core';
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
  context: 'template' | 'table' | 'pool';
  templateId?: number;
  tableId?: number;
  poolId?: number;
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
  @Output() valueSaved = new EventEmitter<string>();

  editForm: FormGroup;
  isLoading = signal(false);
  isLoadingSuggestions = signal(false);
  searchType = signal<'icontains' | 'istartswith'>('icontains');

  // Favorite options
  isLoadingFavorites = signal(false);
  userFavorites = signal<FavouriteMetadataOption[]>([]);
  labGroupFavorites = signal<FavouriteMetadataOption[]>([]);
  globalFavorites = signal<FavouriteMetadataOption[]>([]);
  selectedFavorite = signal<FavouriteMetadataOption | null>(null);

  // User info
  currentUser = signal<User | null>(null);
  userLabGroups = signal<number[]>([]);

  // Favorites tab management  
  activeFavoritesTab: 'user' | 'lab_group' | 'global' = 'user';

  // SDRF special syntax support
  private sdrfSyntaxService = inject(SdrfSyntaxService);
  specialSyntaxType = signal<SyntaxType | null>(null);
  showSpecialInput = signal(false);
  specialInputValue = signal('');

  constructor(
    private fb: FormBuilder,
    private activeModal: NgbActiveModal,
    private apiService: ApiService,
    private authService: AuthService
  ) {
    this.editForm = this.fb.group({
      value: ['', [Validators.maxLength(500)]]
    });
  }

  ngOnInit() {
    // Check for special SDRF syntax
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

    // Initialize user from auth service
    this.currentUser.set(this.authService.getCurrentUser());

    // Load user's lab groups if authenticated
    if (this.currentUser()) {
      this.loadUserLabGroups();
    }

    // Load favorite options
    this.loadFavoriteOptions();

    // Clear selected favorite when value is manually changed
    this.editForm.get('value')?.valueChanges.subscribe((newValue) => {
      const selected = this.selectedFavorite();
      if (selected && selected.value !== newValue) {
        this.selectedFavorite.set(null);
      }
    });
  }

  onSubmit() {
    if (this.editForm.valid) {
      this.isLoading.set(true);
      const value = this.editForm.get('value')?.value || '';
      this.valueSaved.emit(value);
    }
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

        // Use appropriate API endpoint based on context
        if (this.config.context === 'table' && this.config.columnId) {
          return this.apiService.getMetadataColumnOntologySuggestions(this.config.columnId, {
            search: term,
            limit: 10,
            search_type: this.searchType()
          }).pipe(
            switchMap(response => of(response.suggestions || [])),
            catchError(() => of([])),
            tap(() => this.isLoadingSuggestions.set(false))
          );
        } else if (this.config.context === 'template' && this.config.templateId) {
          return this.apiService.getColumnTemplateOntologySuggestions(this.config.templateId, {
            search: term,
            limit: 10
          }).pipe(
            switchMap(response => of(response.suggestions || [])),
            catchError(() => of([])),
            tap(() => this.isLoadingSuggestions.set(false))
          );
        } else {
          // Fallback - no suggestions available
          this.isLoadingSuggestions.set(false);
          return of([]);
        }
      })
    );
  };

  formatSuggestion = (suggestion: OntologySuggestion): string => {
    return suggestion.display_name || suggestion.value;
  };

  onSuggestionSelected = (event: any): void => {
    if (event.item && event.item.value) {
      this.editForm.get('value')?.setValue(event.item.value);
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

    // Load user favorites
    const currentUser = this.currentUser();
    if (currentUser?.id) {
      this.apiService.getFavouriteMetadataOptions({
        name: this.config.columnName,
        type: this.config.columnType,
        user_id: currentUser.id,
        limit: 10
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
      this.apiService.getFavouriteMetadataOptions({
        name: this.config.columnName,
        type: this.config.columnType,
        lab_group_id: userLabGroups[0], // Use first lab group for now
        limit: 10
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
    this.apiService.getFavouriteMetadataOptions({
      name: this.config.columnName,
      type: this.config.columnType,
      is_global: true,
      limit: 10
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

    // If we have special syntax and enhanced editor is enabled, update special input value too
    if (this.showSpecialInput() && this.specialSyntaxType()) {
      this.specialInputValue.set(favoriteValue);
    }

    // If the favorite has a stored template ID, update our config to use it for typeahead
    if (favorite.column_template && favorite.column_template !== this.config.templateId) {
      this.config.templateId = favorite.column_template;
    }

    // Optional: Show a brief toast if display name differs from actual value
    if (this.hasCustomDisplayValue(favorite)) {
      console.log(`Selected "${favorite.display_value}" (value: ${favorite.value})`);
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

    const newFavorite: Partial<FavouriteMetadataOption> = {
      name: this.config.columnName,
      type: this.config.columnType,
      column_template: this.config.templateId || undefined,
      value: value,
      display_value: value,
      is_global: scope === 'global',
      user: scope === 'user' ? this.currentUser()?.id : undefined,
      lab_group: scope === 'lab_group' ? this.userLabGroups()[0] || undefined : undefined
    };

    this.apiService.createFavouriteMetadataOption(newFavorite).subscribe({
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
    return favorite.display_value || favorite.value || '';
  }

  getFavoriteTooltip(favorite: FavouriteMetadataOption): string {
    const displayValue = favorite.display_value || favorite.value || '';
    const actualValue = favorite.value || '';

    if (favorite.display_value && favorite.display_value !== actualValue) {
      return `${displayValue}\n\nActual value: ${actualValue}`;
    }

    return displayValue;
  }

  hasCustomDisplayValue(favorite: FavouriteMetadataOption): boolean {
    return !!(favorite.display_value &&
              favorite.display_value !== favorite.value &&
              favorite.display_value.trim() !== '');
  }

  getSelectedFavoriteInfo(): string {
    const selected = this.selectedFavorite();
    const currentValue = this.editForm.get('value')?.value;

    if (!selected || !currentValue || selected.value !== currentValue) {
      return '';
    }

    if (this.hasCustomDisplayValue(selected)) {
      return `Selected from favorite: "${selected.display_value}"`;
    }

    return '';
  }

  loadUserLabGroups(): void {
    // Load user's lab groups
    this.apiService.getMyLabGroups({ limit: 10 }).subscribe({
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
}
