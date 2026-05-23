import { Component, signal, inject, OnInit, OnDestroy, effect, ChangeDetectionStrategy, untracked } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './shared/components/navbar/navbar';
import { DesktopService } from '@noatgnu/cupcake-vanilla';
import { AsyncTaskMonitorService, AuthService, WebSocketService } from '@noatgnu/cupcake-core';
import { ToastService, ToastContainerComponent, PoweredByFooterComponent } from '@noatgnu/cupcake-core';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgbModule, CommonModule, NavbarComponent, PoweredByFooterComponent, ToastContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('cupcake-vanilla-ng');
  protected readonly environment = environment;

  private asyncTaskService = inject(AsyncTaskMonitorService);
  private toastService = inject(ToastService);
  private desktopService = inject(DesktopService);
  private authService = inject(AuthService);
  private websocket = inject(WebSocketService);

  private _appInitialized = signal<boolean>(false);
  public appInitialized = this._appInitialized.asReadonly();

  private authEffect = effect(() => {
    const user = this.authService.currentUser();
    untracked(() => {
      if (user) {
        this.websocket.connect();
        if (environment.features?.asyncTasks) {
          this.asyncTaskService.startRealtimeUpdates();
        }
      } else {
        this.websocket.disconnect();
      }
    });
  });

  ngOnInit(): void {
    this.initializeApp();
  }

  ngOnDestroy(): void {
    this.websocket.disconnect();
  }

  private async initializeApp(): Promise<void> {
    try {
      this._appInitialized.set(true);
      this.desktopService.getAppVersion().then(appVersion => {
        this.desktopService.logToFile(`App Version: ${appVersion}`);
        this.toastService.show('Application initialized');
      });
    } catch (error) {
      this.desktopService.logToFile(`Failed to initialize app: ${error}`);
      this._appInitialized.set(true);
    }
  }
}
