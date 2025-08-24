import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgbAlert } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from '../../../services/api';
import { SiteConfigService } from '../../../services/site-config';
import { UserRegistrationRequest, UserResponse, RegistrationStatus } from '../../../models';

@Component({
  selector: 'app-register',
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
  loading = false;
  error: string | null = null;
  success: string | null = null;
  
  // Observable for site configuration
  siteConfig$ = this.siteConfigService.config$;
  
  // Registration status
  registrationStatus: RegistrationStatus | null = null;
  registrationEnabled = false;

  private returnUrl: string = '/login';

  constructor() {
    this.registrationForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
      first_name: ['', [Validators.required, Validators.maxLength(30)]],
      last_name: ['', [Validators.required, Validators.maxLength(30)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirm_password: ['', [Validators.required]]
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
        this.registrationStatus = status;
        this.registrationEnabled = status.registration_enabled;
        
        if (!this.registrationEnabled) {
          this.error = status.message || 'Registration is currently disabled';
        }
      },
      error: (error) => {
        console.warn('Could not load registration status:', error);
        this.error = 'Unable to check registration status. Please try again later.';
      }
    });
  }

  /**
   * Custom validator to check if passwords match
   */
  private passwordMatchValidator(form: AbstractControl): {[key: string]: any} | null {
    const password = form.get('password');
    const confirmPassword = form.get('confirm_password');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  /**
   * Handle form submission
   */
  onSubmit() {
    if (this.registrationForm.valid && this.registrationEnabled) {
      this.loading = true;
      this.error = null;

      const registrationData: UserRegistrationRequest = {
        username: this.registrationForm.get('username')?.value,
        email: this.registrationForm.get('email')?.value,
        first_name: this.registrationForm.get('first_name')?.value,
        last_name: this.registrationForm.get('last_name')?.value,
        password: this.registrationForm.get('password')?.value,
        password_confirm: this.registrationForm.get('confirm_password')?.value
      };

      this.apiService.registerUser(registrationData).subscribe({
        next: (response: UserResponse) => {
          this.loading = false;
          this.success = response.message || 'Registration successful! You can now log in with your credentials.';
          
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
          this.loading = false;
          
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
            this.error = errors.join('\n');
          } else {
            this.error = error.error?.message || error.message || 'Registration failed. Please try again.';
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
    this.error = null;
  }

  /**
   * Clear success message
   */
  clearSuccess() {
    this.success = null;
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
    
    // Check for password mismatch
    if (fieldName === 'confirm_password' && this.registrationForm.errors?.['passwordMismatch'] && field?.touched) {
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
      first_name: 'First name',
      last_name: 'Last name',
      password: 'Password',
      confirm_password: 'Confirm password'
    };
    return displayNames[fieldName] || fieldName;
  }

  /**
   * Check if a field has errors and should display error styling
   */
  hasFieldError(fieldName: string): boolean {
    const field = this.registrationForm.get(fieldName);
    if (fieldName === 'confirm_password') {
      return (field?.invalid && field?.touched) || 
             (this.registrationForm.errors?.['passwordMismatch'] && field?.touched) || false;
    }
    return field?.invalid && field?.touched || false;
  }
}
