import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbAlert } from '@ng-bootstrap/ng-bootstrap';
import { ColorSketchModule } from 'ngx-color/sketch';
import { SiteConfigService } from '../../services/site-config';
import { SiteConfig } from '../../models';

@Component({
  selector: 'ccc-site-config',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbAlert, ColorSketchModule],
  templateUrl: './site-config.html',
  styleUrl: './site-config.scss'
})
export class SiteConfigComponent implements OnInit {
  private fb = inject(FormBuilder);
  private siteConfigService = inject(SiteConfigService);

  configForm: FormGroup;
  
  // Signals for reactive state management
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  selectedLogoFile = signal<File | null>(null);
  currentConfig = signal<SiteConfig | null>(null);

  // Computed signal for preview configuration
  previewConfig = computed(() => {
    if (!this.currentConfig()) return null;
    return { ...this.currentConfig()!, ...this.configForm.value };
  });

  // Preset colors for the color picker
  presetColors = [
    '#1976d2', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
    '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722',
    '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#607d8b'
  ];

  constructor() {
    this.configForm = this.fb.group({
      siteName: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(255)]],
      logoUrl: [''],
      primaryColor: ['#1976d2', [Validators.pattern(/^#[0-9A-Fa-f]{6}$/)]],
      showPoweredBy: [true],
      allowUserRegistration: [false],
      enableOrcidLogin: [false]
    });
  }

  ngOnInit() {
    // Load current configuration for admin (authenticated endpoint)
    this.siteConfigService.getCurrentConfig().subscribe({
      next: (config) => {
        this.currentConfig.set(config);
        this.configForm.patchValue(config);
      },
      error: (error) => {
        this.error.set('Failed to load current configuration.');
      }
    });
  }

  /**
   * Update site configuration
   */
  onSubmit() {
    if (this.configForm.valid) {
      this.loading.set(true);
      this.error.set(null);
      this.success.set(null);

      const config: Partial<SiteConfig> = this.configForm.value;

      this.siteConfigService.updateConfig(config).subscribe({
        next: (updatedConfig) => {
          this.loading.set(false);
          this.success.set('Site configuration updated successfully!');
          this.currentConfig.set(updatedConfig);

          localStorage.setItem('site_config', JSON.stringify(updatedConfig));

          setTimeout(() => {
            this.success.set(null);
          }, 3000);
        },
        error: (error) => {
          this.loading.set(false);
          this.error.set(error.error?.detail || 'Failed to update site configuration.');

          setTimeout(() => {
            this.error.set(null);
          }, 5000);
        }
      });
    }
  }

  /**
   * Reset form to current configuration
   */
  resetForm() {
    if (this.currentConfig()) {
      this.configForm.patchValue(this.currentConfig()!);
    }
    this.error.set(null);
    this.success.set(null);
  }

  /**
   * Handle color change from ngx-color picker
   */
  onColorChange(event: any) {
    const color = event.color?.hex || event.hex || event;
    if (color && typeof color === 'string') {
      this.configForm.get('primaryColor')?.setValue(color);
      this.configForm.get('primaryColor')?.markAsTouched();
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
   * Get the current primary color value for styling
   */
  getCurrentPrimaryColor(): string {
    return this.configForm.get('primaryColor')?.value || '#1976d2';
  }

  /**
   * Clear error message
   */
  clearError() {
    this.error.set(null);
  }

  /**
   * Clear success message
   */
  clearSuccess() {
    this.success.set(null);
  }

  /**
   * Handle logo file selection
   */
  onLogoFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        this.error.set('Please select a valid image file (JPEG, PNG, GIF, or SVG).');
        this.selectedLogoFile.set(null);
        target.value = '';
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        this.error.set('Logo file size must be less than 5MB.');
        this.selectedLogoFile.set(null);
        target.value = '';
        return;
      }

      this.selectedLogoFile.set(file);
      this.error.set(null);
    }
  }

  /**
   * Remove selected logo file
   */
  clearLogoFile() {
    this.selectedLogoFile.set(null);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

}
