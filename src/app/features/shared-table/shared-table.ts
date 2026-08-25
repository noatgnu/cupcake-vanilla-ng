import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MetadataTableService, MetadataTableDetails, MetadataTable } from '@noatgnu/cupcake-vanilla';

@Component({
  selector: 'app-shared-table',
  imports: [CommonModule, MetadataTableDetails],
  templateUrl: './shared-table.html',
  styleUrl: './shared-table.scss',
})
export class SharedTableComponent implements OnInit {
  readonly table = signal<MetadataTable | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly metadataTableService: MetadataTableService,
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) {
      this.error.set('No share token provided.');
      this.loading.set(false);
      return;
    }
    this.metadataTableService.getSharedTable(token).subscribe({
      next: (data) => {
        this.table.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('This shared table could not be found or the link has expired.');
        this.loading.set(false);
      },
    });
  }
}
