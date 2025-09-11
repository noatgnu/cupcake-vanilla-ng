import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { LabGroup, LabGroupService } from '@cupcake/core';

export interface ExcelExportOptions {
  includeLabGroups: 'none' | 'selected' | 'all';
  selectedLabGroupIds: number[];
  includePools: boolean;
}

@Component({
  selector: 'app-excel-export-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './excel-export-modal.html',
  styleUrl: './excel-export-modal.scss'
})
export class ExcelExportModalComponent implements OnInit {
  activeModal = inject(NgbActiveModal);
  labGroupService = inject(LabGroupService);

  // State
  isLoadingLabGroups = signal(false);
  availableLabGroups = signal<LabGroup[]>([]);
  
  // Form data
  includeLabGroups = signal<'none' | 'selected' | 'all'>('none');
  selectedLabGroupIds = signal<number[]>([]);
  includePools = signal(true);

  // Computed
  showLabGroupSelection = computed(() => this.includeLabGroups() === 'selected');
  canConfirm = computed(() => {
    if (this.includeLabGroups() === 'selected') {
      return this.selectedLabGroupIds().length > 0;
    }
    return true;
  });

  ngOnInit(): void {
    this.loadLabGroups();
  }

  private loadLabGroups(): void {
    this.isLoadingLabGroups.set(true);
    this.labGroupService.getMyLabGroups().subscribe({
      next: (response) => {
        this.availableLabGroups.set(response.results || []);
        this.isLoadingLabGroups.set(false);
      },
      error: (error) => {
        console.error('Error loading lab groups:', error);
        this.isLoadingLabGroups.set(false);
      }
    });
  }

  onLabGroupToggle(labGroupId: number, checked: boolean): void {
    const currentIds = this.selectedLabGroupIds();
    if (checked) {
      if (!currentIds.includes(labGroupId)) {
        this.selectedLabGroupIds.set([...currentIds, labGroupId]);
      }
    } else {
      this.selectedLabGroupIds.set(currentIds.filter(id => id !== labGroupId));
    }
  }

  isLabGroupSelected(labGroupId: number): boolean {
    return this.selectedLabGroupIds().includes(labGroupId);
  }

  onIncludeLabGroupsChange(value: 'none' | 'selected' | 'all'): void {
    this.includeLabGroups.set(value);
    if (value !== 'selected') {
      this.selectedLabGroupIds.set([]);
    }
  }

  selectAllLabGroups(): void {
    const allIds = this.availableLabGroups().map(lg => lg.id);
    this.selectedLabGroupIds.set(allIds);
  }

  deselectAllLabGroups(): void {
    this.selectedLabGroupIds.set([]);
  }

  confirm(): void {
    const options: ExcelExportOptions = {
      includeLabGroups: this.includeLabGroups(),
      selectedLabGroupIds: this.selectedLabGroupIds(),
      includePools: this.includePools()
    };
    this.activeModal.close(options);
  }

  cancel(): void {
    this.activeModal.dismiss();
  }
}
