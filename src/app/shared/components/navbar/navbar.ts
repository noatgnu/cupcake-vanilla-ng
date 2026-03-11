import { Component, inject, OnInit, OnDestroy, signal, ChangeDetectionStrategy, effect, untracked, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthService, User, SiteConfigService, UserManagementService, ThemeService, DemoModeService } from '@noatgnu/cupcake-core';
import { AsyncTaskUIService, NotificationService, Websocket } from '@noatgnu/cupcake-vanilla';
import { NotificationPanel } from '../notification-panel/notification-panel';
import { AsyncTaskMonitorComponent } from '../async-task-monitor/async-task-monitor';
import { Subscription, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TaskListItem, TaskType, TaskStatus } from '@noatgnu/cupcake-core';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, NgbDropdownModule, NotificationPanel, AsyncTaskMonitorComponent],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
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
  private demoModeService = inject(DemoModeService);

  isAuthenticated = this.authService.authenticated;
  currentUser = this.authService.currentUser;

  siteConfig = this.siteConfigService.siteConfig;

  activeTasks = this.asyncTaskService.activeTasks;
  activeTaskCount = computed(() => this.activeTasks().length);

  protected readonly environment = environment;

  unreadCount = this.notificationService.unreadCount;
  isDemoMode = computed(() => this.demoModeService.demoMode().isActive);

  private subscriptions = new Subscription();

  constructor() {
    effect(() => {
      const isAuthenticated = this.authService.authenticated();
      untracked(() => {
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
      });
    });
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.webSocketService.disconnect();
  }

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

  getUserDisplayName(user: User | null): string {
    return this.userManagementService.getUserDisplayName(user);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  getThemeIcon(): string {
    return this.themeService.getThemeIcon();
  }

  getThemeLabel(): string {
    return this.themeService.getThemeLabel();
  }

  getTaskDisplayName(taskType: TaskType): string {
    return this.asyncTaskService.getTaskDisplayName(taskType);
  }

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
