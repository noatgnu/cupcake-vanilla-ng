import { Component, Input, OnInit, Output, EventEmitter, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { MetadataColumnHistoryRecord, MetadataColumnHistoryResponse } from '../../models';
import { MetadataColumnService } from '../../services';

export interface ColumnHistoryModalConfig {
  columnId: number;
  columnName: string;
}

@Component({
  selector: 'ccv-metadata-column-history-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './metadata-column-history-modal.html',
  styleUrl: './metadata-column-history-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MetadataColumnHistoryModal implements OnInit {
  @Input() config!: ColumnHistoryModalConfig;
  @Output() closed = new EventEmitter<void>();

  readonly history = signal<MetadataColumnHistoryRecord[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly totalCount = signal(0);
  readonly hasMore = signal(false);

  private limit = 20;
  private offset = 0;

  readonly activeModal = inject(NgbActiveModal);
  private columnService = inject(MetadataColumnService);

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.loading.set(true);
    this.error.set(null);

    this.columnService.getHistory(this.config.columnId, { limit: this.limit, offset: this.offset })
      .subscribe({
        next: (response: MetadataColumnHistoryResponse) => {
          this.history.set([...this.history(), ...response.history]);
          this.totalCount.set(response.count);
          this.hasMore.set(response.hasMore);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Failed to load history: ' + (err.error?.detail || err.message));
          this.loading.set(false);
        }
      });
  }

  loadMore(): void {
    if (!this.hasMore() || this.loading()) {
      return;
    }
    this.offset += this.limit;
    this.loadHistory();
  }

  close(): void {
    this.closed.emit();
    this.activeModal.close();
  }

  getChangeLabel(field: string): string {
    const labels: Record<string, string> = {
      name: 'Name',
      type: 'Type',
      value: 'Value',
      columnPosition: 'Position',
      mandatory: 'Mandatory',
      hidden: 'Hidden',
      readonly: 'Read-only',
      modifiers: 'Modifiers',
      ontologyType: 'Ontology Type',
      notApplicable: 'Not Applicable',
      notAvailable: 'Not Available',
      enableTypeahead: 'Typeahead',
      staffOnly: 'Staff Only'
    };
    return labels[field] || field;
  }

  formatValue(value: any): string {
    if (value === null || value === undefined) {
      return '(empty)';
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  }

  getHistoryTypeClass(type: string): string {
    switch (type.toLowerCase()) {
      case 'created': return 'badge bg-success';
      case 'changed': return 'badge bg-primary';
      case 'deleted': return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  }
}
