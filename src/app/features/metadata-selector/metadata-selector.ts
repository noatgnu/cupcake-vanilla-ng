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
    
    if (this.recommendation === 'template') {
      return 'We recommend starting with templates since you don\'t have any metadata tables yet.';
    }
    
    return 'You can work with your existing metadata tables or create new ones from templates.';
  }
}
