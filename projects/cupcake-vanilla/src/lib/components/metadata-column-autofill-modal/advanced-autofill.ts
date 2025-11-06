import { Component, Input, OnInit, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MetadataColumn, VariationSpec, AdvancedAutofillRequest } from '../../models';
import { MetadataValueEditModal, MetadataValueEditConfig } from '../metadata-value-edit-modal/metadata-value-edit-modal';

export interface AdvancedAutofillConfig {
  metadataTableId: number;
  sampleCount: number;
  allColumns?: MetadataColumn[];
}

@Component({
  selector: 'ccv-advanced-autofill',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './advanced-autofill.html',
  styleUrl: './advanced-autofill.scss'
})
export class AdvancedAutofillComponent implements OnInit {
  @Input() config!: AdvancedAutofillConfig;
  @Output() submit = new EventEmitter<AdvancedAutofillRequest>();

  advancedForm: FormGroup;
  private modalService = inject(NgbModal);

  constructor(private fb: FormBuilder) {
    this.advancedForm = this.fb.group({
      templateSamples: ['', [Validators.required]],
      targetSampleCount: [null, [Validators.required, Validators.min(1)]],
      fillStrategy: ['cartesian_product', [Validators.required]],
      variations: this.fb.array([])
    });
  }

  ngOnInit(): void {
  }

  get variations(): FormArray {
    return this.advancedForm.get('variations') as FormArray;
  }

  addVariation(type: 'range' | 'list' | 'pattern' = 'range'): void {
    const variationGroup = this.fb.group({
      columnId: [null, [Validators.required]],
      type: [type, [Validators.required]],
      start: [1],
      end: [10],
      step: [1],
      values: [''],
      pattern: ['{i}'],
      count: [10]
    });

    this.variations.push(variationGroup);
  }

  removeVariation(index: number): void {
    this.variations.removeAt(index);
  }

  getVariationType(index: number): 'range' | 'list' | 'pattern' {
    return this.variations.at(index).get('type')?.value || 'range';
  }

  getSelectedColumn(index: number): MetadataColumn | undefined {
    const columnId = this.variations.at(index).get('columnId')?.value;
    if (!columnId) return undefined;
    return this.config.allColumns?.find(col => col.id === columnId);
  }

  canOpenAutocomplete(index: number): boolean {
    const column = this.getSelectedColumn(index);
    return !!(column?.enableTypeahead && column?.ontologyType);
  }

  openAutocompleteModal(index: number): void {
    const column = this.getSelectedColumn(index);
    if (!column) return;

    const modalConfig: MetadataValueEditConfig = {
      columnId: column.id,
      columnName: column.displayName || column.name,
      columnType: column.type,
      ontologyType: column.ontologyType,
      enableTypeahead: column.enableTypeahead,
      currentValue: this.variations.at(index).get('values')?.value || '',
      context: 'table',
      tableId: this.config.metadataTableId
    };

    const modalRef = this.modalService.open(MetadataValueEditModal, {
      size: 'lg',
      backdrop: 'static'
    });
    modalRef.componentInstance.config = modalConfig;

    modalRef.componentInstance.valueSaved.subscribe((value: string) => {
      const currentValues = this.variations.at(index).get('values')?.value || '';
      const valueArray = currentValues ? currentValues.split(',').map((v: string) => v.trim()).filter((v: string) => v) : [];

      if (!valueArray.includes(value.trim())) {
        valueArray.push(value.trim());
      }

      this.variations.at(index).get('values')?.setValue(valueArray.join(', '));
      modalRef.close();
    });
  }

  parseTemplateSamples(value: string): number[] {
    if (!value) return [];
    return value.split(',')
      .map(v => v.trim())
      .filter(v => v)
      .flatMap(v => {
        if (v.includes('-')) {
          const [start, end] = v.split('-').map(n => parseInt(n.trim(), 10));
          if (!isNaN(start) && !isNaN(end) && start <= end) {
            return Array.from({ length: end - start + 1 }, (_, i) => start + i);
          }
        } else {
          const num = parseInt(v, 10);
          if (!isNaN(num)) return [num];
        }
        return [];
      });
  }

  onSubmit(): void {
    if (this.advancedForm.invalid) {
      return;
    }

    const formValue = this.advancedForm.value;
    const templateSamples = this.parseTemplateSamples(formValue.templateSamples);

    if (templateSamples.length === 0) {
      return;
    }

    const variations: VariationSpec[] = formValue.variations.map((v: any) => {
      if (v.type === 'range') {
        return {
          columnId: v.columnId,
          type: 'range',
          start: v.start,
          end: v.end,
          step: v.step || 1
        };
      } else if (v.type === 'list') {
        return {
          columnId: v.columnId,
          type: 'list',
          values: typeof v.values === 'string' ? v.values.split(',').map((s: string) => s.trim()) : v.values
        };
      } else {
        return {
          columnId: v.columnId,
          type: 'pattern',
          pattern: v.pattern,
          count: v.count
        };
      }
    });

    const request: AdvancedAutofillRequest = {
      templateSamples,
      targetSampleCount: formValue.targetSampleCount,
      variations,
      fillStrategy: formValue.fillStrategy
    };

    this.submit.emit(request);
  }
}
