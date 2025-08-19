import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { 
  MetadataTable, 
  MetadataTableQueryResponse,
  LabGroup,
  LabGroupQueryResponse
} from '../../shared/models';
import { ApiService } from '../../shared/services/api';
import { MetadataTableService } from '../../shared/services/metadata-table';
import { ToastService } from '../../shared/services/toast';

@Component({
  selector: 'app-metadata-tables',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, NgbModule],
  templateUrl: './metadata-tables.html',
  styleUrl: './metadata-tables.scss'
})
export class MetadataTablesComponent implements OnInit {
  searchForm: FormGroup;
  
  // Signals for reactive state management
  private searchParams = signal({
    search: '',
    lab_group_id: null as number | null,
    is_locked: null as boolean | null,
    is_published: null as boolean | null,
    limit: 12,
    offset: 0
  });

  private labGroupParams = signal({
    limit: 10,
    offset: 0
  });

  // State signals
  isLoading = signal(false);
  selectedLabGroup = signal<LabGroup | null>(null);
  currentPage = signal(1);
  pageSize = signal(12);
  totalItems = signal(0);

  labGroupsCurrentPage = signal(1);
  labGroupsPageSize = signal(10);
  labGroupsTotalItems = signal(0);

  // Data signals
  tablesData = signal<MetadataTableQueryResponse>({ count: 0, results: [] });
  labGroupsData = signal<LabGroupQueryResponse>({ count: 0, results: [] });

  // Computed values
  hasTables = computed(() => this.tablesData().results.length > 0);
  hasLabGroups = computed(() => this.labGroupsData().results.length > 0);
  showTablesPagination = computed(() => this.tablesData().count > this.pageSize());
  showLabGroupsPagination = computed(() => this.labGroupsData().count > this.labGroupsPageSize());

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private metadataTableService: MetadataTableService,
    private toastService: ToastService
  ) {
    this.searchForm = this.fb.group({
      search: [''],
      lab_group_id: [null],
      is_locked: [null],
      is_published: [null]
    });

    // Effect to automatically reload tables when search params change
    effect(() => {
      const params = this.searchParams();
      this.loadTablesWithParams(params);
    });

    // Effect to automatically reload lab groups when params change
    effect(() => {
      const params = this.labGroupParams();
      this.loadLabGroupsWithParams(params);
    });
  }

  ngOnInit(): void {
    this.setupSearch();
    this.loadInitialData();
  }

  private loadInitialData() {
    // Load lab groups first
    this.labGroupParams.set({
      limit: this.labGroupsPageSize(),
      offset: 0
    });
    
    // Load tables
    this.searchParams.set({
      search: '',
      lab_group_id: null,
      is_locked: null,
      is_published: null,
      limit: this.pageSize(),
      offset: 0
    });
  }

  private loadLabGroupsWithParams(params: { limit: number; offset: number }) {
    this.apiService.getMyLabGroups(params).subscribe({
      next: (response) => {
        this.labGroupsTotalItems.set(response.count);
        this.labGroupsData.set(response);
      },
      error: (error) => {
        console.error('Error loading lab groups:', error);
        this.labGroupsData.set({ count: 0, results: [] });
      }
    });
  }

  private setupSearch() {
    this.searchForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(formValue => {
      this.currentPage.set(1);
      
      this.searchParams.set({
        search: formValue.search || '',
        lab_group_id: formValue.lab_group_id || null,
        is_locked: formValue.is_locked,
        is_published: formValue.is_published,
        limit: this.pageSize(),
        offset: 0
      });
    });
  }

  private loadTablesWithParams(params: any) {
    this.isLoading.set(true);
    
    this.apiService.getMetadataTables({
      search: params.search || undefined,
      lab_group_id: params.lab_group_id || undefined,
      is_locked: params.is_locked,
      is_published: params.is_published,
      limit: params.limit,
      offset: params.offset
    }).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.totalItems.set(response.count);
        this.tablesData.set(response);
      },
      error: (error) => {
        this.isLoading.set(false);
        console.error('Error loading metadata tables:', error);
        this.tablesData.set({ count: 0, results: [] });
      }
    });
  }

  onLabGroupChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const value = target.value;
    const id = value === 'null' ? null : Number(value);
    const labGroup = id ? this.findLabGroupById(id) : null;
    this.selectedLabGroup.set(labGroup);
    this.currentPage.set(1);
    
    this.searchParams.update(params => ({
      ...params,
      lab_group_id: id,
      offset: 0
    }));
  }

  private findLabGroupById(id: number): LabGroup | null {
    const labGroups = this.labGroupsData();
    return labGroups.results.find((group: LabGroup) => group.id === id) || null;
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.searchParams.update(params => ({
      ...params,
      offset: (page - 1) * this.pageSize()
    }));
  }

  onLabGroupsPageChange(page: number) {
    this.labGroupsCurrentPage.set(page);
    this.labGroupParams.set({
      limit: this.labGroupsPageSize(),
      offset: (page - 1) * this.labGroupsPageSize()
    });
  }

  deleteTable(table: MetadataTable) {
    const confirmMessage = `Are you sure you want to delete the table "${table.name}"?\n\nThis action cannot be undone.`;
    
    if (confirm(confirmMessage)) {
      this.isLoading.set(true);
      this.apiService.deleteMetadataTable(table.id!).subscribe({
        next: () => {
          console.log('Metadata table deleted successfully');
          this.toastService.success(`Table "${table.name}" deleted successfully!`);
          this.refreshTables();
        },
        error: (error) => {
          this.isLoading.set(false);
          console.error('Error deleting metadata table:', error);
          const errorMsg = error?.error?.detail || error?.message || 'Failed to delete table. Please try again.';
          this.toastService.error(errorMsg);
        }
      });
    }
  }

  private refreshTables() {
    this.searchParams.update(params => ({ ...params }));
  }

  navigateToTemplates(): void {
    this.metadataTableService.setNavigationType('template');
  }

  getTableStatusBadge(table: MetadataTable): string {
    if (table.is_published) return 'Published';
    if (table.is_locked) return 'Locked';
    return 'Draft';
  }

  getTableStatusClass(table: MetadataTable): string {
    if (table.is_published) return 'bg-success';
    if (table.is_locked) return 'bg-warning';
    return 'bg-secondary';
  }
}
