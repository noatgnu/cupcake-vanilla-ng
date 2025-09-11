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
    return this.pool?.poolName || 'Sample Pool Details';
  }

  get poolTypeLabel(): string {
    return this.pool?.isReference ? 'Reference Pool' : 'Sample Pool';
  }

  get poolTypeClass(): string {
    return this.pool?.isReference ? 'badge bg-info' : 'badge bg-primary';
  }

  get pooledOnlySamplesText(): string {
    if (!this.pool?.pooledOnlySamples || this.pool.pooledOnlySamples.length === 0) {
      return 'None';
    }
    return this.pool.pooledOnlySamples.join(', ');
  }

  get pooledAndIndependentSamplesText(): string {
    if (!this.pool?.pooledAndIndependentSamples || this.pool.pooledAndIndependentSamples.length === 0) {
      return 'None';
    }
    return this.pool.pooledAndIndependentSamples.join(', ');
  }

  get allSamplesCount(): number {
    const pooledOnly = this.pool?.pooledOnlySamples?.length || 0;
    const pooledAndIndependent = this.pool?.pooledAndIndependentSamples?.length || 0;
    return pooledOnly + pooledAndIndependent;
  }
}