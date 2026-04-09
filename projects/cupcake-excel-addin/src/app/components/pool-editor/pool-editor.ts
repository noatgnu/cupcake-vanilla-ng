import { Component, inject, signal, input, output, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MetadataTable, SamplePool, SamplePoolService } from '@noatgnu/cupcake-vanilla';
import { ToastService } from '../../core/services/toast.service';

interface PoolForm {
  poolName: string;
  poolDescription: string;
  pooledOnlySamples: string;
  pooledAndIndependentSamples: string;
  isReference: boolean;
}

@Component({
  selector: 'app-pool-editor',
  imports: [FormsModule],
  templateUrl: './pool-editor.html',
  styleUrl: './pool-editor.scss',
})
export class PoolEditor implements OnInit {
  private poolService = inject(SamplePoolService);
  private toastService = inject(ToastService);

  readonly table = input.required<MetadataTable>();
  readonly pool = input<SamplePool | null>(null);
  readonly isCreating = input<boolean>(false);
  readonly saved = output<void>();
  readonly cancel = output<void>();

  readonly form = signal<PoolForm>({
    poolName: '',
    poolDescription: '',
    pooledOnlySamples: '',
    pooledAndIndependentSamples: '',
    isReference: false
  });

  readonly isSaving = signal(false);

  ngOnInit(): void {
    const p = this.pool();
    if (p) {
      this.form.set({
        poolName: p.poolName,
        poolDescription: p.poolDescription || '',
        pooledOnlySamples: this.arrayToString(p.pooledOnlySamples),
        pooledAndIndependentSamples: this.arrayToString(p.pooledAndIndependentSamples),
        isReference: p.isReference
      });
    }
  }

  private arrayToString(arr: number[] | undefined): string {
    if (!arr || arr.length === 0) return '';
    return arr.join(', ');
  }

  private stringToArray(str: string): number[] {
    if (!str.trim()) return [];
    return str.split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n) && n > 0);
  }

  updateForm<K extends keyof PoolForm>(field: K, value: PoolForm[K]): void {
    this.form.update(f => ({ ...f, [field]: value }));
  }

  save(): void {
    const formData = this.form();

    if (!formData.poolName.trim()) {
      this.toastService.warning('Pool name is required');
      return;
    }

    this.isSaving.set(true);

    if (this.isCreating()) {
      this.createPool(formData);
    } else {
      this.updatePool(formData);
    }
  }

  private createPool(formData: PoolForm): void {
    this.poolService.createSamplePool({
      poolName: formData.poolName.trim(),
      poolDescription: formData.poolDescription || undefined,
      pooledOnlySamples: this.stringToArray(formData.pooledOnlySamples),
      pooledAndIndependentSamples: this.stringToArray(formData.pooledAndIndependentSamples),
      isReference: formData.isReference,
      metadataTable: this.table().id
    }).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.toastService.success('Pool created');
        this.saved.emit();
      },
      error: () => {
        this.isSaving.set(false);
        this.toastService.error('Failed to create pool');
      }
    });
  }

  private updatePool(formData: PoolForm): void {
    const p = this.pool();
    if (!p) return;

    this.poolService.patchSamplePool(p.id, {
      poolName: formData.poolName.trim(),
      poolDescription: formData.poolDescription || undefined,
      pooledOnlySamples: this.stringToArray(formData.pooledOnlySamples),
      pooledAndIndependentSamples: this.stringToArray(formData.pooledAndIndependentSamples),
      isReference: formData.isReference
    }).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.toastService.success('Pool updated');
        this.saved.emit();
      },
      error: () => {
        this.isSaving.set(false);
        this.toastService.error('Failed to update pool');
      }
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
