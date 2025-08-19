import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthService, User } from '../../services/auth';
import { SiteConfigService } from '../../services/site-config';
import { ThemeService } from '../../services/theme';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, NgbDropdownModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class NavbarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private siteConfigService = inject(SiteConfigService);
  private themeService = inject(ThemeService);

  // Observable for authentication state
  isAuthenticated$ = this.authService.isAuthenticated$;
  currentUser$ = this.authService.currentUser$;
  
  // Observable for site configuration
  siteConfig$ = this.siteConfigService.config$;

  /**
   * Logout user and redirect to login page
   */
  logout(): void {
    this.authService.logout().subscribe({
      complete: () => {
        this.router.navigate(['/login']);
      }
    });
  }

  /**
   * Get user display name
   */
  getUserDisplayName(user: User | null): string {
    if (!user) return '';
    
    if (user.first_name || user.last_name) {
      return `${user.first_name} ${user.last_name}`.trim();
    }
    
    return user.username || user.email || 'User';
  }

  /**
   * Toggle theme
   */
  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  /**
   * Get theme icon
   */
  getThemeIcon(): string {
    return this.themeService.getThemeIcon();
  }

  /**
   * Get theme label
   */
  getThemeLabel(): string {
    return this.themeService.getThemeLabel();
  }
}
