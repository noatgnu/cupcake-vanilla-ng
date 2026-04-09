import { Component, inject, signal, input, output, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MetadataTable,
  MetadataColumn,
  MetadataTableService,
  VariationSpec
} from '@noatgnu/cupcake-vanilla';
import { ToastService } from '../../core/services/toast.service';

type FillStrategy = 'cartesian_product' | 'sequential' | 'interleaved';
type VariationType = 'range' | 'list' | 'pattern';

interface VariationConfig {
  columnId: number | null;
  type: VariationType;
  rangeStart: number;
  rangeEnd: number;
  rangeStep: number;
  listValues: string;
  pattern: string;
  patternCount: number;
}

@Component({
  selector: 'app-autofill-panel',
  imports: [FormsModule],
  templateUrl: './autofill-panel.html',
  styleUrl: './autofill-panel.scss',
})
export class AutofillPanel implements OnInit {
  private tableService = inject(MetadataTableService);
  private toastService = inject(ToastService);

  readonly table = input.required<MetadataTable>();
  readonly back = output<void>();
  readonly applied = output<void>();

  readonly columns = signal<MetadataColumn[]>([]);
  readonly templateSamples = signal<string>('1');
  readonly targetSampleCount = signal<number>(10);
  readonly fillStrategy = signal<FillStrategy>('sequential');
  readonly variations = signal<VariationConfig[]>([]);
  readonly isApplying = signal(false);
  readonly strategies: FillStrategy[] = ['sequential', 'interleaved', 'cartesian_product'];

  ngOnInit(): void {
    const t = this.table();
    if (t.columns) {
      this.columns.set([...t.columns].sort((a, b) => a.columnPosition - b.columnPosition));
    }
    this.targetSampleCount.set(t.sampleCount);
  }

  addVariation(): void {
    this.variations.update(v => [...v, {
      columnId: null,
      type: 'range',
      rangeStart: 1,
      rangeEnd: 10,
      rangeStep: 1,
      listValues: '',
      pattern: 'Sample_{n}',
      patternCount: 10
    }]);
  }

  removeVariation(index: number): void {
    this.variations.update(v => v.filter((_, i) => i !== index));
  }

  updateVariation(index: number, field: keyof VariationConfig, value: any): void {
    this.variations.update(v => {
      const updated = [...v];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  private parseTemplateSamples(): number[] {
    const str = this.templateSamples();
    if (!str.trim()) return [1];

    return str.split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n) && n > 0);
  }

  private buildVariations(): VariationSpec[] {
    return this.variations()
      .filter(v => v.columnId !== null)
      .map(v => {
        const columnId = v.columnId!;

        switch (v.type) {
          case 'range':
            return {
              columnId,
              type: 'range' as const,
              start: v.rangeStart,
              end: v.rangeEnd,
              step: v.rangeStep
            };
          case 'list':
            return {
              columnId,
              type: 'list' as const,
              values: v.listValues.split(',').map(s => s.trim()).filter(s => s)
            };
          case 'pattern':
            return {
              columnId,
              type: 'pattern' as const,
              pattern: v.pattern,
              count: v.patternCount
            };
        }
      });
  }

  apply(): void {
    const variations = this.buildVariations();
    const templateSamples = this.parseTemplateSamples();

    if (variations.length === 0) {
      this.toastService.warning('Add at least one variation');
      return;
    }

    this.isApplying.set(true);

    this.tableService.advancedAutofill(this.table().id, {
      templateSamples,
      targetSampleCount: this.targetSampleCount(),
      variations,
      fillStrategy: this.fillStrategy()
    }).subscribe({
      next: (response) => {
        this.isApplying.set(false);
        this.toastService.success(
          `Autofill applied: ${response.samplesModified} samples, ${response.columnsModified} columns`
        );
        this.applied.emit();
      },
      error: () => {
        this.isApplying.set(false);
        this.toastService.error('Failed to apply autofill');
      }
    });
  }

  goBack(): void {
    this.back.emit();
  }

  getStrategyLabel(strategy: FillStrategy): string {
    switch (strategy) {
      case 'sequential': return 'Sequential';
      case 'interleaved': return 'Interleaved';
      case 'cartesian_product': return 'Cartesian Product';
    }
  }
}
