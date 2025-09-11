import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgbAlert } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from '../../../services/api';
import { SiteConfigService } from '../../../services/site-config';
import { UserRegistrationRequest, UserResponse, RegistrationStatus } from '../../../models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbAlert],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class RegisterComponent implements OnInit {
  private apiService = inject(ApiService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private siteConfigService = inject(SiteConfigService);

  registrationForm: FormGroup;
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  
  // Observable for site configuration
  siteConfig$ = this.siteConfigService.config$;
  
  // Registration status signals
  registrationStatus = signal<RegistrationStatus | null>(null);
  registrationEnabled = signal(false);

  private returnUrl: string = '/login';

  constructor() {
    this.registrationForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
      firstName: ['', [Validators.required, Validators.maxLength(30)]],
      lastName: ['', [Validators.required, Validators.maxLength(30)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    // Check registration status
    this.checkRegistrationStatus();
    
    // Get return URL from query params
    this.route.queryParams.subscribe(params => {
      this.returnUrl = params['returnUrl'] || '/login';
    });
  }

  /**
   * Check if registration is enabled
   */
  private checkRegistrationStatus(): void {
    this.apiService.getRegistrationStatus().subscribe({
      next: (status) => {
        this.registrationStatus.set(status);
        this.registrationEnabled.set(status.registrationEnabled);
        
        if (!this.registrationEnabled()) {
          this.error.set(status.message || 'Registration is currently disabled');
        }
      },
      error: (error) => {
        this.error.set('Unable to check registration status. Please try again later.');
      }
    });
  }

  /**
   * Custom validator to check if passwords match
   */
  private passwordMatchValidator(form: AbstractControl): {[key: string]: any} | null {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  /**
   * Handle form submission
   */
  onSubmit() {
    if (this.registrationForm.valid && this.registrationEnabled()) {
      this.loading.set(true);
      this.error.set(null);

      const registrationData: UserRegistrationRequest = {
        username: this.registrationForm.get('username')?.value,
        email: this.registrationForm.get('email')?.value,
        firstName: this.registrationForm.get('firstName')?.value,
        lastName: this.registrationForm.get('lastName')?.value,
        password: this.registrationForm.get('password')?.value,
        passwordConfirm: this.registrationForm.get('confirmPassword')?.value
      };

      this.apiService.registerUser(registrationData).subscribe({
        next: (response: UserResponse) => {
          this.loading.set(false);
          this.success.set(response.message || 'Registration successful! You can now log in with your credentials.');
          
          // Redirect to login after successful registration
          setTimeout(() => {
            this.router.navigate(['/login'], {
              queryParams: { 
                returnUrl: this.returnUrl,
                registered: 'true',
                username: registrationData.username
              }
            });
          }, 2000);
        },
        error: (error) => {
          this.loading.set(false);
          
          // Handle specific validation errors
          if (error.error && typeof error.error === 'object') {
            const errors = [];
            for (const [field, messages] of Object.entries(error.error)) {
              if (Array.isArray(messages)) {
                errors.push(`${field}: ${messages.join(', ')}`);
              } else {
                errors.push(`${field}: ${messages}`);
              }
            }
            this.error.set(errors.join('\n'));
          } else {
            this.error.set(error.error?.message || error.message || 'Registration failed. Please try again.');
          }
        }
      });
    }
  }

  /**
   * Navigate back to login
   */
  goToLogin() {
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: this.returnUrl }
    });
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
   * Get field error message
   */
  getFieldErrorMessage(fieldName: string): string | null {
    const field = this.registrationForm.get(fieldName);
    if (field && field.invalid && field.touched) {
      if (field.errors?.['required']) {
        return `${this.getFieldDisplayName(fieldName)} is required`;
      }
      if (field.errors?.['email']) {
        return 'Please enter a valid email address';
      }
      if (field.errors?.['minlength']) {
        const requiredLength = field.errors?.['minlength'].requiredLength;
        return `${this.getFieldDisplayName(fieldName)} must be at least ${requiredLength} characters`;
      }
      if (field.errors?.['maxlength']) {
        const requiredLength = field.errors?.['maxlength'].requiredLength;
        return `${this.getFieldDisplayName(fieldName)} must be no more than ${requiredLength} characters`;
      }
    }
    
    if (fieldName === 'confirmPassword' && this.registrationForm.errors?.['passwordMismatch'] && field?.touched) {
      return 'Passwords do not match';
    }
    
    return null;
  }

  /**
   * Get user-friendly field display name
   */
  private getFieldDisplayName(fieldName: string): string {
    const displayNames: {[key: string]: string} = {
      username: 'Username',
      email: 'Email',
      firstName: 'First name',
      lastName: 'Last name',
      password: 'Password',
      confirmPassword: 'Confirm password'
    };
    return displayNames[fieldName] || fieldName;
  }

  /**
   * Check if a field has errors and should display error styling
   */
  hasFieldError(fieldName: string): boolean {
    const field = this.registrationForm.get(fieldName);
    if (fieldName === 'confirmPassword') {
      return (field?.invalid && field?.touched) || 
             (this.registrationForm.errors?.['passwordMismatch'] && field?.touched) || false;
    }
    return field?.invalid && field?.touched || false;
  }

  /**
   * Computed signals for UI display logic
   */
  isRegistrationDisabled = computed(() => !this.registrationEnabled());
  canSubmitForm = computed(() => {
    return this.registrationForm.valid && this.registrationEnabled() && !this.loading();
  });
}
