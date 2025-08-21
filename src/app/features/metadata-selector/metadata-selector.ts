import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgbAlert } from '@ng-bootstrap/ng-bootstrap';
import { MetadataTableService } from '../../shared/services/metadata-table';

@Component({
  selector: 'app-metadata-selector',
  imports: [CommonModule, NgbAlert],
  templateUrl: './metadata-selector.html',
  styleUrl: './metadata-selector.scss'
})
export class MetadataSelector implements OnInit {
  private metadataTableService = inject(MetadataTableService);
  private router = inject(Router);

  loading = true;
  error: string | null = null;
  recommendation: 'table' | 'template' = 'table';
  hasTables = false;
  hasTemplates = false;
  tablesCount = 0;
  templatesCount = 0;

  ngOnInit(): void {
    this.checkUserData();
  }

  checkUserData(): void {
    this.loading = true;
    this.error = null;

    this.metadataTableService.checkRecommendedInterface().subscribe({
      next: (response) => {
        this.hasTables = response.has_tables;
        this.hasTemplates = response.has_templates;
        this.recommendation = response.recommended;
        this.tablesCount = response.tables_count || 0;
        this.templatesCount = response.templates_count || 0;
        this.loading = false;

        // Don't auto-navigate - let user choose
      },
      error: (error) => {
        this.loading = false;
        this.error = 'Failed to check user data. Please try again.';
        console.error('Error checking user data:', error);
        
        // Don't auto-navigate on error - let user choose
      }
    });
  }

  private navigateToRecommended(): void {
    if (this.recommendation === 'template') {
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
    if (!this.hasTables && !this.hasTemplates) {
      return 'You haven\'t created any metadata tables or templates yet. We recommend starting with templates to set up reusable configurations.';
    }
    
    if (!this.hasTables && this.hasTemplates) {
      return `You have ${this.templatesCount} ${this.templatesCount === 1 ? 'template' : 'templates'} but no metadata tables yet. We recommend starting with templates to create your first table.`;
    }

    if (this.hasTables && !this.hasTemplates) {
      return `You have ${this.tablesCount} ${this.tablesCount === 1 ? 'table' : 'tables'}. You can work with existing tables or create templates for reusable configurations.`;
    }
    
    return `You have ${this.tablesCount} ${this.tablesCount === 1 ? 'table' : 'tables'} and ${this.templatesCount} ${this.templatesCount === 1 ? 'template' : 'templates'}. Choose where you'd like to continue working.`;
  }
}
