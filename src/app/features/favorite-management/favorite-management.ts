import {Component, OnInit, signal, computed, inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgbModule, NgbModal, NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { Observable, OperatorFunction, debounceTime, distinctUntilChanged, filter, map, switchMap, of, catchError, forkJoin, firstValueFrom } from 'rxjs';
import {FavouriteMetadataOption, MetadataColumn, MetadataColumnTemplate, OntologySuggestion} from '../../shared/models';
import { ApiService } from '../../shared/services/api';
import { ToastService } from '../../shared/services/toast';
import { AuthService, User } from '../../shared/services/auth';
import { SdrfSyntaxService, SyntaxType } from '../../shared/services/sdrf-syntax';
import { SdrfAgeInput } from '../../shared/components/sdrf-age-input/sdrf-age-input';
import { SdrfModificationInput } from '../../shared/components/sdrf-modification-input/sdrf-modification-input';
import { SdrfCleavageInput } from '../../shared/components/sdrf-cleavage-input/sdrf-cleavage-input';
import { SdrfSpikedCompoundInput } from '../../shared/components/sdrf-spiked-compound-input/sdrf-spiked-compound-input';

@Component({
  selector: 'app-favorite-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    NgbModule,
    NgbTypeahead,
    SdrfAgeInput,
    SdrfModificationInput,
    SdrfCleavageInput,
    SdrfSpikedCompoundInput
  ],
  templateUrl: './favorite-management.html',
  styleUrl: './favorite-management.scss'
})
export class FavoriteManagementComponent implements OnInit {

  // Expose Math to template
  Math = Math;

  // State management
  isLoading = signal(false);
  favorites = signal<FavouriteMetadataOption[]>([]);
  totalFavoritesCount = signal(0); // Total count from backend

  // Search filter signals - these will be updated when form changes
  searchTerm = signal('');
  scopeFilter = signal('');
  labGroupFilter = signal('');
  columnTypeFilter = signal('');

  filteredFavorites = computed(() => {
    const searchTerm = this.searchTerm().toLowerCase();
    const scopeFilter = this.scopeFilter();
    const labGroupFilter = this.labGroupFilter();
    const columnTypeFilter = this.columnTypeFilter();

    return this.favorites().filter(fav => {
      // Search filter
      const matchesSearch = !searchTerm ||
        fav.name.toLowerCase().includes(searchTerm) ||
        fav.value.toLowerCase().includes(searchTerm) ||
        (fav.display_value?.toLowerCase().includes(searchTerm) ?? false);

      // Scope filter
      let matchesScope = true;
      if (scopeFilter) {
        if (scopeFilter === 'personal') {
          matchesScope = !!(fav.user && !fav.is_global && !fav.lab_group);
        } else if (scopeFilter === 'lab_group') {
          matchesScope = !!(fav.lab_group && !fav.is_global);
        } else if (scopeFilter === 'global') {
          matchesScope = !!fav.is_global;
        }
      }

      // Specific lab group filter
      const matchesLabGroup = !labGroupFilter ||
        (fav.lab_group && fav.lab_group.toString() === labGroupFilter);

      // Column type filter
      const matchesType = !columnTypeFilter || fav.type.includes(columnTypeFilter);

      return matchesSearch && matchesScope && matchesLabGroup && matchesType;
    });
  });

  // Pagination
  currentPage = signal(1);
  pageSize = signal(25);
  paginatedFavorites = computed(() => {
    const filtered = this.filteredFavorites();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return filtered.slice(start, start + size);
  });

  totalPages = computed(() => {
    const filtered = this.filteredFavorites();
    const size = this.pageSize();
    return Math.ceil(filtered.length / size);
  });

  // Forms
  searchForm: FormGroup;
  editForm: FormGroup;
  isEditMode = signal(false);
  editingFavorite = signal<FavouriteMetadataOption | null>(null);
  showEditModal = signal(false);
  searchType = signal<'icontains' | 'istartswith'>('icontains');

  // SDRF special syntax support
  private sdrfSyntaxService = inject(SdrfSyntaxService);
  specialSyntaxType = signal<SyntaxType | null>(null);
  showSpecialInput = signal(false);
  specialInputValue = signal('');

  // User permissions
  currentUser = signal<User | null>(null);
  isAdmin = computed(() => {
    const user = this.currentUser();
    return user?.is_staff || user?.is_superuser || false;
  });
  currentUserId = computed(() => this.currentUser()?.id || null);
  userLabGroups = signal<number[]>([]);
  userLabGroupsLoaded = signal(false);

  // Lab groups for filtering
  availableLabGroups = signal<{id: number, name: string}[]>([]);
  allLabGroups = signal<{id: number, name: string}[]>([]); // For typeahead search

  // Column templates for typeahead
  availableColumnTemplates = signal<MetadataColumnTemplate[]>([]);
  columnTemplatesLoaded = signal(false);

  // Column types for filtering
  columnTypes = [
    { value: '', label: 'All Types' },
    { value: 'characteristics', label: 'Characteristics' },
    { value: 'factor', label: 'Factor Value' },
    { value: 'comment', label: 'Comment' },
    { value: 'source', label: 'Source Name' },
    { value: 'special', label: 'Special' }
  ];

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private toastService: ToastService,
    private modalService: NgbModal,
    private authService: AuthService
  ) {
    this.searchForm = this.fb.group({
      search: [''],
      scope: [''],
      labGroup: [''],
      columnType: ['']
    });

    this.editForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      type: ['', [Validators.required, Validators.maxLength(255)]],
      value: ['', [Validators.maxLength(500)]],
      display_value: ['', [Validators.maxLength(500)]],
      scope: ['personal', Validators.required],
      template_id: [null] // Store the selected template ID for value autocompletion
    });
  }

  ngOnInit() {
    // Initialize user from auth service
    this.currentUser.set(this.authService.getCurrentUser());

    // Subscribe to auth changes
    this.authService.currentUser$.subscribe(user => {
      this.currentUser.set(user);
      if (user) {
        this.loadUserLabGroups();
      } else {
        // No user, just load favorites (only global ones will be accessible)
        this.loadFavorites();
      }
    });

    // Load user's lab groups if user is already available
    if (this.currentUser()) {
      this.loadUserLabGroups();
    } else {
      // No user, just load favorites (only global ones will be accessible)
      this.loadFavorites();
    }

    this.loadAvailableColumnTemplates();

    // Watch for search form changes and update filter signals
    this.searchForm.valueChanges.subscribe(formValues => {
      // Update filter signals to trigger computed recalculation
      this.searchTerm.set(formValues.search || '');
      this.scopeFilter.set(formValues.scope || '');
      this.labGroupFilter.set(formValues.labGroup || '');
      this.columnTypeFilter.set(formValues.columnType || '');

      // Reset to first page on filter change
      this.currentPage.set(1);
    });
  }

  loadFavorites(): void {
    this.isLoading.set(true);

    // Make a single API call - the backend will handle filtering based on user access
    // The backend should return all favorites the user has access to (personal, lab group, global)
    this.apiService.getFavouriteMetadataOptions({
      limit: 1000 // Get all accessible favorites, backend will handle access control
    }).subscribe({
      next: (response) => {
        this.favorites.set(response.results);
        this.totalFavoritesCount.set(response.count || response.results.length);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading favorites:', error);
        this.toastService.error('Failed to load favorites');
        this.isLoading.set(false);
      }
    });
  }


  canEditFavorite(favorite: FavouriteMetadataOption): boolean {
    const userId = this.currentUserId();

    // User can edit their own favorites (handle type mismatch)
    if (favorite.user && userId && Number(favorite.user) === Number(userId)) {
      return true;
    }

    // Admin can edit global favorites
    if (favorite.is_global && this.isAdmin()) {
      return true;
    }

    return false;
  }

  canDeleteFavorite(favorite: FavouriteMetadataOption): boolean {
    return this.canEditFavorite(favorite);
  }

  openCreateModal(): void {
    this.isEditMode.set(false);
    this.editingFavorite.set(null);
    this.showEditModal.set(true);
    this.editForm.reset({
      name: '',
      type: '',
      value: '',
      display_value: '',
      scope: 'personal',
      template_id: null
    });
  }

  openEditModal(favorite: FavouriteMetadataOption): void {
    if (!this.canEditFavorite(favorite)) return;

    this.isEditMode.set(true);
    this.editingFavorite.set(favorite);
    this.showEditModal.set(true);

    // Determine scope
    let scope = 'personal';
    if (favorite.is_global) scope = 'global';
    else if (favorite.lab_group) scope = 'lab_group';

    // Use stored column_template ID if available, otherwise try to find matching template
    let templateId = favorite.column_template || null;
    
    this.editForm.patchValue({
      name: favorite.name,
      type: favorite.type,
      value: favorite.value,
      display_value: favorite.display_value || '',
      scope: scope,
      template_id: templateId
    });

    // Check for special SDRF syntax and activate enhanced editor
    const syntaxType = this.sdrfSyntaxService.detectSpecialSyntax(
      favorite.name,
      favorite.type
    );

    if (syntaxType) {
      this.specialSyntaxType.set(syntaxType);
      this.showSpecialInput.set(true);
      this.specialInputValue.set(favorite.value || '');
    } else {
      this.specialSyntaxType.set(null);
      this.showSpecialInput.set(false);
      this.specialInputValue.set('');
    }

    // If no stored template ID, try to find one as fallback for future use
    if (!templateId) {
      this.findTemplatesForColumnName(favorite.name).then(templates => {
        const matchingTemplate = templates.find(t => 
          t.column_name === favorite.name && t.column_type === favorite.type
        );
        if (matchingTemplate?.id) {
          this.editForm.patchValue({ template_id: matchingTemplate.id });
        }
      });
    }
  }

  saveFavorite(): void {
    if (this.editForm.invalid) return;

    const formValue = this.editForm.value;
    const favoriteData: Partial<FavouriteMetadataOption> = {
      name: formValue.name,
      type: formValue.type,
      column_template: formValue.template_id || undefined,
      value: formValue.value,
      display_value: formValue.display_value || formValue.value,
      is_global: formValue.scope === 'global',
      user: formValue.scope === 'personal' ? this.currentUserId() || undefined : undefined,
      lab_group: formValue.scope === 'lab_group' ? this.userLabGroups()[0] || undefined : undefined
    };

    const operation = this.isEditMode()
      ? this.apiService.updateFavouriteMetadataOption(this.editingFavorite()!.id!, favoriteData)
      : this.apiService.createFavouriteMetadataOption(favoriteData);

    operation.subscribe({
      next: (favorite) => {
        const action = this.isEditMode() ? 'updated' : 'created';
        this.toastService.success(`Favorite ${action} successfully!`);
        this.loadFavorites(); // Reload data
        this.closeEditModal();
      },
      error: (error) => {
        console.error('Error saving favorite:', error);
        const action = this.isEditMode() ? 'updating' : 'creating';
        this.toastService.error(`Failed ${action} favorite`);
      }
    });
  }

  deleteFavorite(favorite: FavouriteMetadataOption): void {
    if (!this.canDeleteFavorite(favorite)) return;

    const confirmMessage = `Are you sure you want to delete the favorite "${favorite.display_value || favorite.value}"?`;

    if (confirm(confirmMessage)) {
      this.apiService.deleteFavouriteMetadataOption(favorite.id!).subscribe({
        next: () => {
          this.toastService.success('Favorite deleted successfully!');
          this.loadFavorites();
        },
        error: (error) => {
          console.error('Error deleting favorite:', error);
          this.toastService.error('Failed to delete favorite');
        }
      });
    }
  }

  closeEditModal(): void {
    this.isEditMode.set(false);
    this.editingFavorite.set(null);
    this.showEditModal.set(false);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }

  clearFilters(): void {
    this.searchForm.reset();
    // Manually reset filter signals to ensure they're cleared
    this.searchTerm.set('');
    this.scopeFilter.set('');
    this.labGroupFilter.set('');
    this.columnTypeFilter.set('');
    this.currentPage.set(1);
  }

  getScopeDisplay(favorite: FavouriteMetadataOption): string {
    if (favorite.is_global) return 'Global';
    if (favorite.lab_group) return `Lab Group: ${favorite.lab_group_name || favorite.lab_group}`;
    if (favorite.user) return `Personal (${favorite.user_username || favorite.user})`;
    return 'Unknown';
  }

  getScopeClass(favorite: FavouriteMetadataOption): string {
    if (favorite.is_global) return 'badge bg-success';
    if (favorite.lab_group) return 'badge bg-info';
    if (favorite.user) return 'badge bg-primary';
    return 'badge bg-secondary';
  }

  get editModalTitle(): string {
    return this.isEditMode() ? 'Edit Favorite' : 'Create New Favorite';
  }

  loadUserLabGroups(): void {
    // Load user's lab groups
    this.apiService.getMyLabGroups({ limit: 10 }).subscribe({
      next: (response) => {
        const labGroupIds = response.results.map(group => group.id!);
        this.userLabGroups.set(labGroupIds);

        // Store available lab groups for filtering
        const labGroups = response.results.map(group => ({
          id: group.id!,
          name: group.name
        }));
        this.availableLabGroups.set(labGroups);

        this.userLabGroupsLoaded.set(true);

        // Reload favorites now that we have user lab groups
        this.loadFavorites();
      },
      error: (error) => {
        console.error('Error loading user lab groups:', error);
        this.userLabGroups.set([]);
        this.availableLabGroups.set([]);
        this.userLabGroupsLoaded.set(true);

        // Still load favorites even if lab group loading failed
        this.loadFavorites();
      }
    });

    // Load all lab groups for typeahead search (limit higher for search functionality)
    this.apiService.getLabGroups({ limit: 50 }).subscribe({
      next: (response) => {
        const allLabGroups = response.results.map(group => ({
          id: group.id!,
          name: group.name
        }));
        this.allLabGroups.set(allLabGroups);

        // If user is admin, also update available lab groups for filtering
        if (this.isAdmin()) {
          this.availableLabGroups.set(allLabGroups);
        }
      },
      error: (error) => {
        console.error('Error loading all lab groups:', error);
      }
    });
  }

  loadAvailableColumnTemplates(): void {
    // Load all available column templates for typeahead
    this.apiService.getColumnTemplates({ limit: 10 }).subscribe({
      next: (response) => {
        this.availableColumnTemplates.set(response.results);
        this.columnTemplatesLoaded.set(true);
      },
      error: (error) => {
        console.error('Error loading column templates:', error);
        this.availableColumnTemplates.set([]);
        this.columnTemplatesLoaded.set(true);
      }
    });
  }

  // Typeahead for column names
  searchColumnNames: OperatorFunction<string, readonly string[]> = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap(term => {
        if (term.length === 0) {
          // Show initial cached results when no search term
          return of(this.getColumnNameSuggestions(''));
        } else if (term.length >= 1) {
          // Make API call for dynamic search
          return this.apiService.getColumnTemplates({
            search: term,
            limit: 20 // Get more results for search
          }).pipe(
            map(response => {
              const uniqueNames = [...new Set(response.results.map(template => template.column_name))];
              return uniqueNames.sort();
            }),
            catchError(() => {
              // Fallback to cached data on error
              return of(this.getColumnNameSuggestions(term));
            })
          );
        } else {
          return of([]);
        }
      })
    );

  private getColumnNameSuggestions(term: string): string[] {
    const templates = this.availableColumnTemplates();
    const uniqueNames = [...new Set(templates.map(template => template.column_name))];

    if (!term) {
      // Return initial list when no term
      return uniqueNames.sort().slice(0, 10);
    }

    return uniqueNames
      .filter(name => name.toLowerCase().includes(term.toLowerCase()))
      .sort()
      .slice(0, 10);
  }

  // Typeahead for column types
  searchColumnTypes: OperatorFunction<string, readonly string[]> = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      filter(term => term.length >= 1),
      map(term => this.getColumnTypeSuggestions(term))
    );

  private getColumnTypeSuggestions(term: string): string[] {
    const selectedName = this.editForm.get('name')?.value;
    const templates = this.availableColumnTemplates();

    // If a name is selected, filter types to those available for that name
    let availableTypes: string[];
    if (selectedName) {
      availableTypes = templates
        .filter(template => template.column_name === selectedName)
        .map(template => template.column_type);
    } else {
      // Otherwise show all available types
      availableTypes = [...new Set(templates.map(template => template.column_type))];
    }

    return availableTypes
      .filter(type => type.toLowerCase().includes(term.toLowerCase()))
      .sort()
      .slice(0, 10);
  }

  // Handle column name selection to update type suggestions
  onColumnNameSelected(event: any): void {
    const selectedName = event.item || event;
    if (typeof selectedName === 'string') {
      this.editForm.patchValue({ name: selectedName });

      // Find templates for this column name - check both cached and make API call if needed
      this.findTemplatesForColumnName(selectedName).then(templatesForName => {
        if (templatesForName.length > 0) {
          // Use the first (most common) type as suggestion
          const currentType = this.editForm.get('type')?.value;
          const typesForName = templatesForName.map(template => template.column_type);

          if (!currentType || !typesForName.includes(currentType)) {
            const firstTemplate = templatesForName[0];
            this.editForm.patchValue({
              type: firstTemplate.column_type,
              template_id: firstTemplate.id // Set template ID for value autocompletion
            });
          } else {
            // If current type is valid, find the template with matching name and type
            const matchingTemplate = templatesForName.find(t => t.column_type === currentType);
            if (matchingTemplate) {
              this.editForm.patchValue({ template_id: matchingTemplate.id });
            } else {
              this.editForm.patchValue({ template_id: null });
            }
          }
        } else {
          // Clear template_id if no matching templates found
          this.editForm.patchValue({ template_id: null });
        }

        // Check for special SDRF syntax after name selection
        this.checkForSpecialSyntax();
      });
    }
  }

  // Helper method to find templates for a column name
  private async findTemplatesForColumnName(columnName: string): Promise<MetadataColumnTemplate[]> {
    // First check cached templates
    const cached = this.availableColumnTemplates();
    const cachedMatches = cached.filter(template => template.column_name === columnName);

    if (cachedMatches.length > 0) {
      return cachedMatches;
    }

    // If not found in cache, make API call
    try {
      const response = await firstValueFrom(this.apiService.getColumnTemplates({
        search: columnName,
        limit: 10
      }));

      if (response) {
        const exactMatches = response.results.filter(template => template.column_name === columnName);
        return exactMatches;
      }
    } catch (error) {
      console.warn('Failed to fetch templates for column name:', columnName, error);
    }

    return [];
  }

  onColumnTypeSelected(event: any): void {
    const selectedType = event.item || event;
    if (typeof selectedType === 'string') {
      this.editForm.patchValue({ type: selectedType });

      // Find the template ID for the selected name and type combination
      const selectedName = this.editForm.get('name')?.value;
      if (selectedName) {
        const templates = this.availableColumnTemplates();
        const matchingTemplate = templates.find(template =>
          template.column_name === selectedName && template.column_type === selectedType
        );

        if (matchingTemplate && matchingTemplate.id) {
          this.editForm.patchValue({ template_id: matchingTemplate.id });
        } else {
          this.editForm.patchValue({ template_id: null });
        }
      }

      // Check for special SDRF syntax after type selection
      this.checkForSpecialSyntax();
    }
  }

  // Typeahead for values using template ontology suggestions
  searchTemplateValues: OperatorFunction<string, readonly OntologySuggestion[]> = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      filter(term => term.length >= 2),
      switchMap(term => {
        const templateId = this.editForm.get('template_id')?.value;
        if (!templateId) {
          return of([]);
        }

        return this.apiService.getColumnTemplateOntologySuggestions(templateId, {
          search: term,
          limit: 10,
          search_type: this.searchType()
        }).pipe(
          map(response => response.suggestions || []),
          catchError(error => {
            console.warn(`Failed to get ontology suggestions for template ${templateId}:`, error);
            return of([]);
          })
        );
      })
    );

  formatValueSuggestion = (suggestion: OntologySuggestion): string => {
    return suggestion.display_name || suggestion.value;
  };

  onValueSuggestionSelected = (event: any): void => {
    if (event.item && event.item.value) {
      this.editForm.get('value')?.setValue(event.item.value);
      this.editForm.get('value')?.markAsTouched();

      // If display_value is empty, suggest the display name from the ontology
      const currentDisplayValue = this.editForm.get('display_value')?.value;
      if (!currentDisplayValue && event.item.display_name && event.item.display_name !== event.item.value) {
        this.editForm.get('display_value')?.setValue(event.item.display_name);
      }
    }
  };

  onSearchTypeChange(type: 'icontains' | 'istartswith'): void {
    this.searchType.set(type);
  }

  // Lab Group typeahead for filtering
  searchLabGroups: OperatorFunction<string, readonly {id: number, name: string}[]> = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap(term => {
        if (term.length === 0) {
          // Show initial cached user lab groups when no search term
          return of(this.availableLabGroups().slice(0, 10));
        } else if (term.length >= 1) {
          // Make API call for dynamic search across all lab groups
          return this.apiService.getLabGroups({
            search: term,
            limit: 20
          }).pipe(
            map(response => response.results.map(group => ({
              id: group.id!,
              name: group.name
            }))),
            catchError(() => {
              // Fallback to cached data on error
              return of(this.getLabGroupSuggestions(term));
            })
          );
        } else {
          return of([]);
        }
      })
    );

  private getLabGroupSuggestions(term: string): {id: number, name: string}[] {
    const allGroups = this.allLabGroups();

    if (!term) {
      return allGroups.slice(0, 10);
    }

    return allGroups
      .filter(group => group.name.toLowerCase().includes(term.toLowerCase()))
      .slice(0, 10);
  }

  formatLabGroup = (group: {id: number, name: string}): string => {
    return group.name;
  };

  onLabGroupSelected = (event: any): void => {
    const selectedGroup = event.item;
    if (selectedGroup && selectedGroup.id) {
      this.searchForm.patchValue({ labGroup: selectedGroup.id.toString() });
    }
  };

  // Clean up column name display for table
  getCleanColumnName(name: string): string {
    if (!name) return '';

    // Extract content inside brackets if it exists
    // e.g., "comment[modification parameters]" becomes "modification parameters"
    const bracketMatch = name.match(/\[(.+?)\]/);
    if (bracketMatch) {
      return bracketMatch[1];
    }

    // If no brackets, return the name as is
    return name;
  }

  // Clean up column type display for table
  getCleanColumnType(type: string): string {
    if (!type) return '';

    // Remove brackets and content inside them
    // e.g., "characteristics[organism]" becomes "characteristics"
    const cleanType = type.replace(/\[.*?\]/g, '').trim();

    // Capitalize first letter for better display
    return cleanType.charAt(0).toUpperCase() + cleanType.slice(1);
  }

  // Check if value contains multiple key-value pairs (complex value)
  isComplexValue(value: string): boolean {
    if (!value) return false;

    // Check for SDRF-style key=value pairs separated by semicolons
    // e.g., "AC=UNIMOD:21;CF=H O(3) P;PP=Anywhere;TA=T,S;MM=79.966331"
    const sdrfPattern = /^[A-Z]{2,3}=[^;]+(?:;[A-Z]{2,3}=[^;]+)+$/;

    // Check for other common key-value patterns
    const keyValuePattern = /\w+[:=][^;,]+[;,]\w+[:=]/;

    return sdrfPattern.test(value) || keyValuePattern.test(value);
  }

  // Parse complex value into key-value pairs
  parseComplexValue(value: string): {key: string, value: string}[] {
    if (!value) return [];

    const pairs: {key: string, value: string}[] = [];

    // Handle SDRF-style format (key=value;key=value)
    if (value.includes('=') && value.includes(';')) {
      const parts = value.split(';');
      parts.forEach(part => {
        const [key, val] = part.split('=', 2);
        if (key && val) {
          pairs.push({
            key: key.trim(),
            value: val.trim()
          });
        }
      });
    }
    // Handle other key:value formats
    else if (value.includes(':') && (value.includes(';') || value.includes(','))) {
      const separator = value.includes(';') ? ';' : ',';
      const parts = value.split(separator);
      parts.forEach(part => {
        const [key, val] = part.split(':', 2);
        if (key && val) {
          pairs.push({
            key: key.trim(),
            value: val.trim()
          });
        }
      });
    }

    return pairs;
  }

  // SDRF Special Syntax Methods
  checkForSpecialSyntax(): void {
    const columnName = this.editForm.get('name')?.value;
    const columnType = this.editForm.get('type')?.value;

    if (columnName && columnType) {
      const syntaxType = this.sdrfSyntaxService.detectSpecialSyntax(columnName, columnType);
      this.specialSyntaxType.set(syntaxType);

      if (syntaxType) {
        this.showSpecialInput.set(true);
        const currentValue = this.editForm.get('value')?.value;
        this.specialInputValue.set(currentValue || '');
      } else {
        this.showSpecialInput.set(false);
        this.specialInputValue.set('');
      }
    } else {
      this.specialSyntaxType.set(null);
      this.showSpecialInput.set(false);
      this.specialInputValue.set('');
    }
  }

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

  getColumnTypeClass(favouriteOption: FavouriteMetadataOption): string {
    const type = favouriteOption.type?.toLowerCase() || '';
    if (type.includes('characteristics')) return 'text-primary';
    if (type.includes('factor')) return 'text-success';
    if (type.includes('comment')) return 'text-info';
    if (type.includes('source')) return 'text-warning';
    if (type === 'special') return 'text-danger';
    return 'text-muted';
  }

  getColumnTypeIcon(favouriteMetadataOption: FavouriteMetadataOption): string {
    const type = favouriteMetadataOption.type?.toLowerCase() || '';
    if (type.includes('characteristics')) return 'bi-tags';
    if (type.includes('factor')) return 'bi-sliders';
    if (type.includes('comment')) return 'bi-chat-left-text';
    if (type.includes('source')) return 'bi-diagram-3';
    if (type === 'special') return 'bi-star';
    return 'bi-circle';
  }
}
