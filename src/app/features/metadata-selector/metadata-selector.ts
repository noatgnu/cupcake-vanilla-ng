import { Component, inject, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgbAlert } from '@ng-bootstrap/ng-bootstrap';
import { MetadataTableService } from '../../shared/services/metadata-table';

@Component({
  selector: 'app-metadata-selector',
  standalone: true,
  imports: [CommonModule, NgbAlert],
  templateUrl: './metadata-selector.html',
  styleUrl: './metadata-selector.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MetadataSelector implements OnInit {
  private metadataTableService = inject(MetadataTableService);
  private router = inject(Router);

  loading = signal(true);
  error = signal<string | null>(null);
  recommendation = signal<'table' | 'template'>('table');
  hasTables = signal(false);
  hasTemplates = signal(false);
  tablesCount = signal(0);
  templatesCount = signal(0);

  ngOnInit(): void {
    this.checkUserData();
  }

  checkUserData(): void {
    this.loading.set(true);
    this.error.set(null);

    this.metadataTableService.checkRecommendedInterface().subscribe({
      next: (response) => {
        this.hasTables.set(response.has_tables);
        this.hasTemplates.set(response.has_templates);
        this.recommendation.set(response.recommended);
        this.tablesCount.set(response.tables_count || 0);
        this.templatesCount.set(response.templates_count || 0);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.error.set('Failed to check user data. Please try again.');
        console.error('Error checking user data:', error);
      }
    });
  }

  private navigateToRecommended(): void {
    if (this.recommendation() === 'template') {
      this.navigateToTemplates();
    } else {
      this.navigateToTables();
    }
  }

  navigateToTables(): void {
    this.metadataTableService.setNavigationType('table');
    this.router.navigate(['/metadata-tables']);
  }

  navigateToTemplates(): void {
    this.metadataTableService.setNavigationType('template');
    this.router.navigate(['/metadata-table-templates']);
  }

  getRecommendationMessage(): string {
    const hasTables = this.hasTables();
    const hasTemplates = this.hasTemplates();
    const tablesCount = this.tablesCount();
    const templatesCount = this.templatesCount();

    if (!hasTables && !hasTemplates) {
      return 'You haven\'t created any metadata tables or templates yet. We recommend starting with templates to set up reusable configurations.';
    }

    if (!hasTables && hasTemplates) {
      return `You have ${templatesCount} ${templatesCount === 1 ? 'template' : 'templates'} but no metadata tables yet. We recommend starting with templates to create your first table.`;
    }

    if (hasTables && !hasTemplates) {
      return `You have ${tablesCount} ${tablesCount === 1 ? 'table' : 'tables'}. You can work with existing tables or create templates for reusable configurations.`;
    }

    return `You have ${tablesCount} ${tablesCount === 1 ? 'table' : 'tables'} and ${templatesCount} ${templatesCount === 1 ? 'template' : 'templates'}. Choose where you'd like to continue working.`;
  }
}
