import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgbAlert } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../../services/auth';
import { SiteConfigService } from '../../../services/site-config';
import { ApiService } from '../../../services/api';
import { AuthConfig, RegistrationStatus } from '../../../models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbAlert],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private siteConfigService = inject(SiteConfigService);
  private apiService = inject(ApiService);

  loginForm: FormGroup;
  loading = false;
  error: string | null = null;
  success: string | null = null;
  
  // Observable for site configuration
  siteConfig$ = this.siteConfigService.config$;
  
  // Auth configuration state
  authConfig: AuthConfig | null = null;
  registrationStatus: RegistrationStatus | null = null;

  constructor() {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  private returnUrl: string = '/';

  ngOnInit() {
    // Load auth configuration
    this.loadAuthConfig();
    
    // Get return URL from query params
    this.route.queryParams.subscribe(params => {
      this.returnUrl = params['returnUrl'] || '/';
      
      // Check for ORCID callback parameters
      if (params['code'] && params['state']) {
        this.handleORCIDCallback(params['code'], params['state']);
      } else if (params['error']) {
        this.error = `ORCID authentication failed: ${params['error']}`;
      }
      
      // Check for registration success message
      if (params['registered'] === 'true') {
        this.success = 'Registration successful! You can now log in with your credentials.';
        if (params['username']) {
          this.loginForm.patchValue({ username: params['username'] });
        }
      }
    });

    // Subscribe to authentication state changes to handle token refresh scenarios
    this.authService.isAuthenticated$.subscribe(isAuthenticated => {
      if (isAuthenticated) {
        console.log('LoginComponent: Authentication state changed to authenticated, navigating to:', this.returnUrl);
        this.router.navigate([this.returnUrl]);
      }
    });
  }

  /**
   * Load authentication configuration to determine available login options
   */
  private loadAuthConfig(): void {
    this.apiService.getAuthConfig().subscribe({
      next: (config) => {
        this.authConfig = config;
      },
      error: (error) => {
        console.warn('Could not load auth config:', error);
        // Use defaults if config loading fails
        this.authConfig = {
          registration_enabled: false,
          orcid_login_enabled: false,
          regular_login_enabled: true
        };
      }
    });

    this.apiService.getRegistrationStatus().subscribe({
      next: (status) => {
        this.registrationStatus = status;
      },
      error: (error) => {
        console.warn('Could not load registration status:', error);
      }
    });
  }

  /**
   * Handle traditional username/password login
   */
  onSubmit() {
    if (this.loginForm.valid) {
      this.loading = true;
      this.error = null;

      const { username, password } = this.loginForm.value;

      this.authService.login(username, password).subscribe({
        next: (response) => {
          this.success = 'Login successful!';
          setTimeout(() => {
            this.router.navigate([this.returnUrl]);
          }, 1000);
        },
        error: (error) => {
          this.loading = false;
          this.error = error.error?.detail || 'Login failed. Please check your credentials.';
        }
      });
    }
  }

  /**
   * Initiate ORCID OAuth login
   */
  loginWithORCID() {
    this.loading = true;
    this.error = null;

    this.authService.initiateORCIDLogin().subscribe({
      next: (response) => {
        // Store state in sessionStorage for verification
        sessionStorage.setItem('orcid_state', response.state);
        // Redirect to ORCID authorization page
        window.location.href = response.authorization_url;
      },
      error: (error) => {
        this.loading = false;
        this.error = error.error?.error || 'Failed to initiate ORCID login.';
      }
    });
  }

  /**
   * Handle ORCID OAuth callback
   */
  private handleORCIDCallback(code: string, state: string) {
    this.loading = true;
    this.error = null;

    // Verify state parameter
    const storedState = sessionStorage.getItem('orcid_state');
    if (storedState !== state) {
      this.error = 'Invalid state parameter. Possible security issue.';
      this.loading = false;
      return;
    }

    // Clean up stored state
    sessionStorage.removeItem('orcid_state');

    this.authService.handleORCIDCallback(code, state).subscribe({
      next: (response) => {
        this.success = `Welcome, ${response.user.first_name || response.user.username}!`;
        setTimeout(() => {
          this.router.navigate([this.returnUrl]);
        }, 1000);
      },
      error: (error) => {
        this.loading = false;
        this.error = error.error?.error || 'ORCID authentication failed.';
      }
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
   * Check if ORCID login should be displayed
   */
  get shouldShowOrcidLogin(): boolean {
    return this.authConfig?.orcid_login_enabled === true;
  }

  /**
   * Check if registration option should be displayed
   */
  get shouldShowRegistration(): boolean {
    return this.registrationStatus?.registration_enabled === true;
  }

  /**
   * Check if regular login should be displayed
   */
  get shouldShowRegularLogin(): boolean {
    return this.authConfig?.regular_login_enabled !== false; // Default to true
  }

  /**
   * Get registration message
   */
  get registrationMessage(): string {
    return this.registrationStatus?.message || 'Registration is currently enabled';
  }

  /**
   * Navigate to registration page
   */
  goToRegister() {
    this.router.navigate(['/register'], {
      queryParams: { returnUrl: this.returnUrl }
    });
  }
}
