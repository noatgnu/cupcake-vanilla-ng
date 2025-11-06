import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
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
  styleUrl: './metadata-column-history-modal.scss'
})
export class MetadataColumnHistoryModal implements OnInit {
  @Input() config!: ColumnHistoryModalConfig;
  @Output() closed = new EventEmitter<void>();

  history: MetadataColumnHistoryRecord[] = [];
  loading = false;
  error: string | null = null;

  totalCount = 0;
  limit = 20;
  offset = 0;
  hasMore = false;

  constructor(
    public activeModal: NgbActiveModal,
    private columnService: MetadataColumnService
  ) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.loading = true;
    this.error = null;

    this.columnService.getHistory(this.config.columnId, { limit: this.limit, offset: this.offset })
      .subscribe({
        next: (response: MetadataColumnHistoryResponse) => {
          this.history = [...this.history, ...response.history];
          this.totalCount = response.count;
          this.hasMore = response.hasMore;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load history: ' + (err.error?.detail || err.message);
          this.loading = false;
        }
      });
  }

  loadMore(): void {
    if (!this.hasMore || this.loading) {
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
    const labels: { [key: string]: string } = {
      'name': 'Name',
      'type': 'Type',
      'value': 'Value',
      'columnPosition': 'Position',
      'mandatory': 'Mandatory',
      'hidden': 'Hidden',
      'readonly': 'Read-only',
      'modifiers': 'Modifiers',
      'ontologyType': 'Ontology Type',
      'notApplicable': 'Not Applicable',
      'notAvailable': 'Not Available',
      'enableTypeahead': 'Typeahead',
      'staffOnly': 'Staff Only'
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
      case 'created':
        return 'badge bg-success';
      case 'changed':
        return 'badge bg-primary';
      case 'deleted':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }
}
