import { Component, inject, signal, input, output, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MetadataTable, SamplePool, SamplePoolService } from '@noatgnu/cupcake-vanilla';
import { ToastService } from '../../core/services/toast.service';
import { PoolEditor } from '../pool-editor/pool-editor';

@Component({
  selector: 'app-pool-manager',
  imports: [FormsModule, PoolEditor],
  templateUrl: './pool-manager.html',
  styleUrl: './pool-manager.scss',
})
export class PoolManager implements OnInit {
  private poolService = inject(SamplePoolService);
  private toastService = inject(ToastService);

  readonly table = input.required<MetadataTable>();
  readonly back = output<void>();
  readonly refresh = output<void>();

  readonly pools = signal<SamplePool[]>([]);
  readonly isLoading = signal(false);
  readonly selectedPool = signal<SamplePool | null>(null);
  readonly showEditor = signal(false);
  readonly isCreating = signal(false);

  ngOnInit(): void {
    this.loadPools();
  }

  loadPools(): void {
    this.isLoading.set(true);
    this.poolService.getSamplePools({ metadataTable: this.table().id, limit: 10 }).subscribe({
      next: (response) => {
        this.pools.set(response.results);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Failed to load pools');
        this.isLoading.set(false);
      }
    });
  }

  editPool(pool: SamplePool): void {
    this.selectedPool.set(pool);
    this.isCreating.set(false);
    this.showEditor.set(true);
  }

  createPool(): void {
    this.selectedPool.set(null);
    this.isCreating.set(true);
    this.showEditor.set(true);
  }

  deletePool(pool: SamplePool): void {
    this.poolService.deleteSamplePool(pool.id).subscribe({
      next: () => {
        this.toastService.success(`Pool "${pool.poolName}" deleted`);
        this.pools.update(pools => pools.filter(p => p.id !== pool.id));
        this.refresh.emit();
      },
      error: () => {
        this.toastService.error('Failed to delete pool');
      }
    });
  }

  onPoolSaved(): void {
    this.showEditor.set(false);
    this.selectedPool.set(null);
    this.loadPools();
    this.refresh.emit();
  }

  onEditorCancel(): void {
    this.showEditor.set(false);
    this.selectedPool.set(null);
  }

  goBack(): void {
    this.back.emit();
  }

  getSampleRange(pool: SamplePool): string {
    const all = [...(pool.pooledOnlySamples || []), ...(pool.pooledAndIndependentSamples || [])];
    if (all.length === 0) return 'No samples';
    if (all.length <= 5) return all.join(', ');
    return `${all.slice(0, 3).join(', ')}... (${all.length} total)`;
  }
}
