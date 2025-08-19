import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbAlert } from '@ng-bootstrap/ng-bootstrap';
import { SiteConfigService } from '../../../shared/services/site-config';
import { SiteConfig } from '../../../shared/models';

@Component({
  selector: 'app-site-config',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbAlert],
  templateUrl: './site-config.html',
  styleUrl: './site-config.scss'
})
export class SiteConfigComponent implements OnInit {
  private fb = inject(FormBuilder);
  private siteConfigService = inject(SiteConfigService);

  configForm: FormGroup;
  loading = false;
  error: string | null = null;
  success: string | null = null;
  selectedLogoFile: File | null = null;

  constructor() {
    this.configForm = this.fb.group({
      site_name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(255)]],
      logo_url: [''],
      primary_color: ['#1976d2', [Validators.pattern(/^#[0-9A-Fa-f]{6}$/)]],
      show_powered_by: [true]
    });
  }

  ngOnInit() {
    // Load current configuration for admin (authenticated endpoint)
    this.siteConfigService.getCurrentConfig().subscribe({
      next: (config) => {
        this.configForm.patchValue(config);
      },
      error: (error) => {
        this.error = 'Failed to load current configuration.';
        console.error('Error loading site config:', error);
      }
    });
  }

  /**
   * Update site configuration
   */
  onSubmit() {
    if (this.configForm.valid) {
      this.loading = true;
      this.error = null;
      this.success = null;

      const config: Partial<SiteConfig> = this.configForm.value;

      this.siteConfigService.updateConfig(config).subscribe({
        next: (updatedConfig) => {
          this.loading = false;
          this.success = 'Site configuration updated successfully!';

          // Update local config
          localStorage.setItem('site_config', JSON.stringify(updatedConfig));

          setTimeout(() => {
            this.success = null;
          }, 3000);
        },
        error: (error) => {
          this.loading = false;
          this.error = error.error?.detail || 'Failed to update site configuration.';

          setTimeout(() => {
            this.error = null;
          }, 5000);
        }
      });
    }
  }

  /**
   * Reset form to current configuration
   */
  resetForm() {
    const currentConfig = this.siteConfigService.getCurrentConfig();
    this.configForm.patchValue(currentConfig);
    this.error = null;
    this.success = null;
  }

  /**
   * Preview the current form values
   */
  getPreviewConfig(): SiteConfig {
    return { ...this.siteConfigService.getCurrentConfig(), ...this.configForm.value };
  }

  /**
   * Clear error message
   */
  clearError() {
    this.error = null;
  }

  /**
   * Clear success message
   */
  clearSuccess() {
    this.success = null;
  }

  /**
   * Handle logo file selection
   */
  onLogoFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      this.selectedLogoFile = target.files[0];

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];
      if (!allowedTypes.includes(this.selectedLogoFile.type)) {
        this.error = 'Please select a valid image file (JPEG, PNG, GIF, or SVG).';
        this.selectedLogoFile = null;
        target.value = '';
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (this.selectedLogoFile.size > maxSize) {
        this.error = 'Logo file size must be less than 5MB.';
        this.selectedLogoFile = null;
        target.value = '';
        return;
      }

      this.error = null;
    }
  }

  /**
   * Remove selected logo file
   */
  clearLogoFile() {
    this.selectedLogoFile = null;
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

}
