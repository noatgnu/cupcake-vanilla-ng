import { Component, inject, signal, input, output, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MetadataTable,
  AsyncImportService
} from '@noatgnu/cupcake-vanilla';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-import-panel',
  imports: [FormsModule],
  templateUrl: './import-panel.html',
  styleUrl: './import-panel.scss',
})
export class ImportPanel implements OnDestroy {
  private importService = inject(AsyncImportService);
  private toastService = inject(ToastService);

  readonly table = input.required<MetadataTable>();
  readonly back = output<void>();
  readonly imported = output<void>();

  readonly selectedFile = signal<File | null>(null);
  readonly replaceExisting = signal(false);
  readonly isImporting = signal(false);
  readonly importProgress = signal(0);
  readonly statusMessage = signal('');

  ngOnDestroy(): void {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile.set(input.files[0]);
      this.statusMessage.set(`Selected: ${input.files[0].name}`);
    }
  }

  startImport(): void {
    const file = this.selectedFile();
    if (!file) {
      this.toastService.warning('Please select a file');
      return;
    }

    this.isImporting.set(true);
    this.importProgress.set(0);
    this.statusMessage.set('Starting import...');

    const isSdrf = file.name.toLowerCase().endsWith('.sdrf.tsv') ||
                   file.name.toLowerCase().endsWith('.sdrf') ||
                   file.name.toLowerCase().endsWith('.tsv');

    const request = {
      metadataTableId: this.table().id,
      file: file,
      replaceExisting: this.replaceExisting()
    };

    const importObservable = isSdrf
      ? this.importService.sdrfFile(request)
      : this.importService.excelFile(request);

    importObservable.subscribe({
      next: (response) => {
        this.isImporting.set(false);
        this.importProgress.set(100);
        this.statusMessage.set(response.message || 'Import completed');
        this.toastService.success('Import completed');
        this.imported.emit();
      },
      error: (err) => {
        this.isImporting.set(false);
        this.statusMessage.set('Import failed');
        this.toastService.error(err.message || 'Import failed');
      }
    });
  }

  clearFile(): void {
    this.selectedFile.set(null);
    this.statusMessage.set('');
  }

  goBack(): void {
    this.back.emit();
  }
}
