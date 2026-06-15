import { Component, inject, OnInit, OnDestroy, signal, ChangeDetectionStrategy, effect, untracked, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NgbCollapse, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthService, User, SiteConfigService, UserManagementService, ThemeService, DemoModeService, PluginService, Plugin } from '@noatgnu/cupcake-core';
import { AsyncTaskUIService, NotificationService, Websocket } from '@noatgnu/cupcake-vanilla';
import { NotificationPanel } from '../notification-panel/notification-panel';
import { AsyncTaskMonitorComponent } from '../async-task-monitor/async-task-monitor';
import { Subscription, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TaskListItem, TaskType, TaskStatus } from '@noatgnu/cupcake-core';
import { environment } from '../../../../environments/environment';
import { EnvironmentService } from '../../services/environment';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, NgbDropdownModule, NgbCollapse, NotificationPanel, AsyncTaskMonitorComponent],
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
  private environmentService = inject(EnvironmentService);
  private pluginService = inject(PluginService);

  get isWails(): boolean { return this.environmentService.isWails(); }
  get isAppliance(): boolean { return this.environmentService.isAppliance(); }

  isAuthenticated = this.authService.authenticated;
  currentUser = this.authService.currentUser;

  siteConfig = this.siteConfigService.siteConfig;

  activeTasks = this.asyncTaskService.activeTasks;
  activeTaskCount = computed(() => this.activeTasks().length);

  protected readonly environment = environment;

  unreadCount = this.notificationService.unreadCount;
  isDemoMode = computed(() => this.demoModeService.demoMode().isActive);
  isMenuCollapsed = signal(true);
  activePlugins = signal<Plugin[]>([]);
  pluginsWithNav = computed(() => this.activePlugins().filter(p => p.manifestCache?.nav?.length));

  private subscriptions = new Subscription();

  constructor() {
    effect(() => {
      const isAuthenticated = this.authService.authenticated();
      untracked(() => {
        if (isAuthenticated && this.webSocketService.shouldConnect()) {
          const currentState = this.webSocketService.connectionState$();
          if (currentState === 'disconnected' || currentState === 'error') {
            this.webSocketService.connect();
          }
        } else if (!isAuthenticated) {
          this.webSocketService.disconnect();
        }
      });
    });
  }

  ngOnInit(): void {
    this.loadPlugins();
  }

  private loadPlugins(): void {
    this.pluginService.listPlugins().subscribe({
      next: plugins => this.activePlugins.set(plugins.filter(p => p.isActive)),
      error: () => this.activePlugins.set([]),
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.webSocketService.disconnect();
  }

  logout(): void {
    this.authService.logout().subscribe({
      error: () => {
        this.router.navigate(['/login']);
      },
      complete: () => {
        this.router.navigate(['/login']);
      }
    });
  }

  getUserDisplayName(user: User | null): string {
    return this.userManagementService.getUserDisplayName(user);
  }

  toggleMode(): void {
    this.themeService.toggleMode();
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
