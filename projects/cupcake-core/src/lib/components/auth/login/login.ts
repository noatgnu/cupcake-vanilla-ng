import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgbAlert } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../../services/auth';
import { SiteConfigService } from '../../../services/site-config';
import { ApiService } from '../../../services/api';
import { AuthConfig, RegistrationStatus } from '../../../models';

@Component({
  selector: 'ccc-login',
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
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  siteConfig$ = this.siteConfigService.config$;

  authConfig = signal<AuthConfig | null>(null);
  registrationStatus = signal<RegistrationStatus | null>(null);

  constructor() {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
      rememberMe: [false]
    });
  }

  private returnUrl: string = '/';

  ngOnInit() {
    this.loadAuthConfig();
    this.handleHashParams();

    this.route.queryParams.subscribe(params => {
      this.returnUrl = this.cleanReturnUrl(params['returnUrl']) || '/';

      if (params['code'] && params['state']) {
        this.handleORCIDCallback(params['code'], params['state']);
      } else if (params['error']) {
        this.error.set(`ORCID authentication failed: ${params['error']}`);
      }

      if (params['registered'] === 'true') {
        this.success.set('Registration successful! You can now log in with your credentials.');
        if (params['username']) {
          this.loginForm.patchValue({ username: params['username'] });
        }
      }
    });

    this.authService.isAuthenticated$.subscribe(isAuthenticated => {
      if (isAuthenticated) {
        this.navigateToReturnUrl();
      }
    });
  }

  private handleHashParams(): void {
    const hash = window.location.hash;
    const queryIndex = hash.indexOf('?');
    if (queryIndex === -1) return;

    const queryString = hash.substring(queryIndex + 1);
    const params = new URLSearchParams(queryString);

    const authCode = params.get('auth_code');
    const errorParam = params.get('error');

    if (errorParam) {
      this.error.set(`ORCID authentication failed: ${errorParam}`);
      this.cleanHashParams();
      return;
    }

    if (authCode) {
      this.loading.set(true);
      this.error.set(null);
      this.cleanHashParams();

      this.authService.exchangeAuthCode(authCode).subscribe({
        next: () => {
          this.success.set('Login successful!');
          setTimeout(() => {
            this.navigateToReturnUrl();
          }, 1000);
        },
        error: (error) => {
          this.loading.set(false);
          this.error.set(error.error?.error || error.error?.detail || 'Failed to complete authentication.');
        }
      });
    }
  }

  private cleanHashParams(): void {
    const hash = window.location.hash;
    const queryIndex = hash.indexOf('?');
    if (queryIndex !== -1) {
      const cleanHash = hash.substring(0, queryIndex);
      window.history.replaceState(null, '', window.location.pathname + cleanHash);
    }
  }

  /**
   * Navigate to return URL, properly handling query parameters
   */
  private navigateToReturnUrl(): void {
    const url = this.returnUrl;
    if (!url || url === '/') {
      this.router.navigate(['/']);
      return;
    }

    const [path, queryString] = url.split('?');
    if (queryString) {
      const queryParams: any = {};
      const params = new URLSearchParams(queryString);
      params.forEach((value, key) => {
        queryParams[key] = value;
      });
      this.router.navigate([path], { queryParams });
    } else {
      this.router.navigate([path]);
    }
  }

  /**
   * Clean return URL to prevent accumulating login URLs
   */
  private cleanReturnUrl(returnUrl: string | null): string | null {
    if (!returnUrl) return null;

    try {
      const url = new URL(returnUrl, window.location.origin);

      if (url.pathname === '/login') {
        const innerReturnUrl = url.searchParams.get('returnUrl');
        if (innerReturnUrl) {
          return this.cleanReturnUrl(innerReturnUrl);
        }
        return '/';
      }

      return url.pathname + url.search;
    } catch (error) {
      if (returnUrl.startsWith('/login')) {
        const urlParams = new URLSearchParams(returnUrl.split('?')[1]);
        const innerReturnUrl = urlParams.get('returnUrl');
        if (innerReturnUrl) {
          return this.cleanReturnUrl(innerReturnUrl);
        }
        return '/';
      }
      return returnUrl;
    }
  }

  /**
   * Load authentication configuration to determine available login options
   */
  private loadAuthConfig(): void {
    this.apiService.getAuthConfig().subscribe({
      next: (config) => {
        this.authConfig.set(config);
      },
      error: (error) => {
        console.warn('Could not load auth config:', error);
        this.authConfig.set({
          registrationEnabled: false,
          orcidLoginEnabled: false,
          regularLoginEnabled: true
        });
      }
    });

    this.apiService.getRegistrationStatus().subscribe({
      next: (status) => {
        this.registrationStatus.set(status);
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
      this.loading.set(true);
      this.error.set(null);

      const { username, password, rememberMe } = this.loginForm.value;

      this.authService.login(username, password, rememberMe || false).subscribe({
        next: (response) => {
          this.success.set('Login successful!');
          setTimeout(() => {
            this.navigateToReturnUrl();
          }, 1000);
        },
        error: (error) => {
          this.loading.set(false);
          this.error.set(error.error?.detail || 'Login failed. Please check your credentials.');
        }
      });
    }
  }

  /**
   * Initiate ORCID OAuth login
   */
  loginWithORCID() {
    this.loading.set(true);
    this.error.set(null);

    const rememberMe = this.loginForm.get('rememberMe')?.value || false;

    this.authService.initiateORCIDLogin(rememberMe).subscribe({
      next: (response) => {
        sessionStorage.setItem('orcid_state', response.state);
        window.location.href = response.authorizationUrl;
      },
      error: (error) => {
        this.loading.set(false);
        this.error.set(error.error?.error || 'Failed to initiate ORCID login.');
      }
    });
  }

  /**
   * Handle ORCID OAuth callback
   */
  private handleORCIDCallback(code: string, state: string) {
    this.loading.set(true);
    this.error.set(null);

    const storedState = sessionStorage.getItem('orcid_state');
    if (storedState !== state) {
      this.error.set('Invalid state parameter. Possible security issue.');
      this.loading.set(false);
      return;
    }

    sessionStorage.removeItem('orcid_state');

    const rememberMe = this.loginForm.get('rememberMe')?.value || false;

    this.authService.handleORCIDCallback(code, state, rememberMe).subscribe({
      next: (response) => {
        this.success.set(`Welcome, ${response.user.firstName || response.user.username}!`);
        setTimeout(() => {
          this.navigateToReturnUrl();
        }, 1000);
      },
      error: (error) => {
        this.loading.set(false);
        this.error.set(error.error?.error || 'ORCID authentication failed.');
      }
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
   * Computed signals for UI display logic
   */
  shouldShowOrcidLogin = computed(() => this.authConfig()?.orcidLoginEnabled === true);
  shouldShowRegistration = computed(() => this.registrationStatus()?.registrationEnabled === true);
  shouldShowRegularLogin = computed(() => this.authConfig()?.regularLoginEnabled !== false);
  registrationMessage = computed(() => this.registrationStatus()?.message || 'Registration is currently enabled');
  rememberMeDuration = computed(() => {
    const config = this.authConfig();
    const days = config?.jwtTokenLifetimes?.rememberMe?.refreshTokenDays || 30;
    return days;
  });

  /**
   * Navigate to registration page
   */
  goToRegister() {
    this.router.navigate(['/register'], {
      queryParams: { returnUrl: this.returnUrl }
    });
  }
}
