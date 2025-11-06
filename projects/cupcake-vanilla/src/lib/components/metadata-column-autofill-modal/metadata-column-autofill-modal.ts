import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { MetadataColumn, AdvancedAutofillRequest } from '../../models';
import { BasicAutofillComponent, BasicAutofillConfig, BasicAutofillResult } from './basic-autofill';
import { AdvancedAutofillComponent, AdvancedAutofillConfig } from './advanced-autofill';

export interface MetadataColumnAutofillConfig {
  column: MetadataColumn;
  metadataTableId: number;
  sampleCount: number;
  selectedSampleIndices?: number[];
  allColumns?: MetadataColumn[];
}

@Component({
  selector: 'ccv-metadata-column-autofill-modal',
  standalone: true,
  imports: [CommonModule, NgbNavModule, BasicAutofillComponent, AdvancedAutofillComponent],
  templateUrl: './metadata-column-autofill-modal.html',
  styleUrl: './metadata-column-autofill-modal.scss'
})
export class MetadataColumnAutofillModal implements OnInit {
  @Input() config!: MetadataColumnAutofillConfig;

  activeTab = signal<1 | 2>(1);
  basicConfig = signal<BasicAutofillConfig | null>(null);
  advancedConfig = signal<AdvancedAutofillConfig | null>(null);

  constructor(private activeModal: NgbActiveModal) {}

  ngOnInit(): void {
    this.basicConfig.set({
      column: this.config.column,
      sampleCount: this.config.sampleCount,
      selectedSampleIndices: this.config.selectedSampleIndices,
      allColumns: this.config.allColumns
    });

    this.advancedConfig.set({
      metadataTableId: this.config.metadataTableId,
      sampleCount: this.config.sampleCount,
      allColumns: this.config.allColumns
    });
  }

  onBasicSubmit(result: BasicAutofillResult): void {
    this.activeModal.close({
      mode: 'basic',
      ...result
    });
  }

  onAdvancedSubmit(request: AdvancedAutofillRequest): void {
    this.activeModal.close({
      mode: 'advanced',
      request
    });
  }

  close(): void {
    this.activeModal.dismiss('cancel');
  }
}
