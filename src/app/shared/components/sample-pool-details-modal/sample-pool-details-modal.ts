import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SamplePool } from '../../models';

@Component({
  selector: 'app-sample-pool-details-modal',
  standalone: true,
  imports: [CommonModule, NgbModule],
  templateUrl: './sample-pool-details-modal.html',
  styleUrl: './sample-pool-details-modal.scss'
})
export class SamplePoolDetailsModal {
  @Input() pool!: SamplePool;

  constructor(private activeModal: NgbActiveModal) {}

  onClose(): void {
    this.activeModal.close();
  }

  get title(): string {
    return this.pool?.pool_name || 'Sample Pool Details';
  }

  get poolTypeLabel(): string {
    return this.pool?.is_reference ? 'Reference Pool' : 'Sample Pool';
  }

  get poolTypeClass(): string {
    return this.pool?.is_reference ? 'badge bg-info' : 'badge bg-primary';
  }

  get pooledOnlySamplesText(): string {
    if (!this.pool?.pooled_only_samples || this.pool.pooled_only_samples.length === 0) {
      return 'None';
    }
    return this.pool.pooled_only_samples.join(', ');
  }

  get pooledAndIndependentSamplesText(): string {
    if (!this.pool?.pooled_and_independent_samples || this.pool.pooled_and_independent_samples.length === 0) {
      return 'None';
    }
    return this.pool.pooled_and_independent_samples.join(', ');
  }

  get allSamplesCount(): number {
    const pooledOnly = this.pool?.pooled_only_samples?.length || 0;
    const pooledAndIndependent = this.pool?.pooled_and_independent_samples?.length || 0;
    return pooledOnly + pooledAndIndependent;
  }
}