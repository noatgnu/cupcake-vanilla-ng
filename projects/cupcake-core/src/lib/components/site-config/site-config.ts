import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbAlert } from '@ng-bootstrap/ng-bootstrap';
import { ColorSketchModule } from 'ngx-color/sketch';
import { SiteConfigService } from '../../services/site-config';
import { SiteConfig } from '../../models';

@Component({
  selector: 'app-site-config',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbAlert, ColorSketchModule],
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

  // Preset colors for the color picker
  presetColors = [
    '#1976d2', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
    '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722',
    '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#607d8b'
  ];

  constructor() {
    this.configForm = this.fb.group({
      site_name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(255)]],
      logo_url: [''],
      primary_color: ['#1976d2', [Validators.pattern(/^#[0-9A-Fa-f]{6}$/)]],
      show_powered_by: [true],
      allow_user_registration: [false],
      enable_orcid_login: [false]
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
   * Handle color change from ngx-color picker
   */
  onColorChange(event: any) {
    const color = event.color?.hex || event.hex || event;
    if (color && typeof color === 'string') {
      this.configForm.get('primary_color')?.setValue(color);
      this.configForm.get('primary_color')?.markAsTouched();
    }
  }

  /**
   * Get a darker version of the given color for gradients
   */
  getDarkerColor(hex: string): string {
    if (!hex || !hex.startsWith('#')) {
      return '#1565c0'; // Default darker color
    }
    
    // Remove # and convert to RGB
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    // Darken by 20%
    const factor = 0.8;
    const darkR = Math.floor(r * factor);
    const darkG = Math.floor(g * factor);
    const darkB = Math.floor(b * factor);
    
    // Convert back to hex
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    return `#${toHex(darkR)}${toHex(darkG)}${toHex(darkB)}`;
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
