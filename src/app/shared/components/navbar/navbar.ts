import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthService, User, SiteConfigService, UserManagementService, ThemeService } from '@cupcake/core';
import { AsyncTaskUIService, NotificationService, Websocket } from '@cupcake/vanilla';
import { NotificationPanel } from '../notification-panel/notification-panel';
import { AsyncTaskMonitorComponent } from '../async-task-monitor/async-task-monitor';
import { Subscription, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TaskListItem, TaskType, TaskStatus } from '@cupcake/vanilla';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, NgbDropdownModule, NotificationPanel, AsyncTaskMonitorComponent],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class NavbarComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private siteConfigService = inject(SiteConfigService);
  private userManagementService = inject(UserManagementService);
  private themeService = inject(ThemeService);
  private notificationService = inject(NotificationService);
  private webSocketService = inject(Websocket);
  private asyncTaskService = inject(AsyncTaskUIService);

  isAuthenticated$ = this.authService.isAuthenticated$;
  currentUser$ = this.authService.currentUser$;
  
  siteConfig$ = this.siteConfigService.config$;
  
  activeTasks$ = this.asyncTaskService.activeTasks$;
  activeTaskCount$ = this.activeTasks$.pipe(
    map(tasks => tasks.length)
  );
  
  protected readonly environment = environment;
  
  unreadCount = this.notificationService.unreadCount;
  
  private subscriptions = new Subscription();

  ngOnInit(): void {
    this.subscriptions.add(
      this.isAuthenticated$.subscribe(isAuthenticated => {
        if (isAuthenticated && this.webSocketService.shouldConnect()) {
          const currentState = this.webSocketService.connectionState$();
          if (currentState === 'disconnected' || currentState === 'error') {
            console.log('Navbar: Initiating WebSocket connection');
            this.webSocketService.connect();
          }
        } else if (!isAuthenticated) {
          console.log('Navbar: User not authenticated, disconnecting WebSocket');
          this.webSocketService.disconnect();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.webSocketService.disconnect();
  }

  /**
   * Logout user and redirect to login page
   */
  logout(): void {
    console.log('NavbarComponent: logout() called');
    this.authService.logout().subscribe({
      next: (response) => {
        console.log('NavbarComponent: logout success response:', response);
      },
      error: (error) => {
        console.error('NavbarComponent: logout error:', error);
        this.router.navigate(['/login']);
      },
      complete: () => {
        console.log('NavbarComponent: logout completed, navigating to login');
        this.router.navigate(['/login']);
      }
    });
  }

  /**
   * Get user display name using the service method
   */
  getUserDisplayName(user: User | null): string {
    return this.userManagementService.getUserDisplayName(user);
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

  /**
   * Get display name for task type
   */
  getTaskDisplayName(taskType: TaskType): string {
    return this.asyncTaskService.getTaskDisplayName(taskType);
  }

  /**
   * Get progress bar class based on status
   */
  getProgressBarClass(status: TaskStatus): string {
    const colorMap: Record<TaskStatus, string> = {
      'QUEUED': 'bg-secondary',
      'STARTED': 'bg-primary',
      'SUCCESS': 'bg-success',
      'FAILURE': 'bg-danger',
      'CANCELLED': 'bg-warning',
    };
    return colorMap[status] || 'bg-secondary';
  }
}
