import { Component, inject, effect, untracked } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService, AsyncTaskMonitorService } from '@noatgnu/cupcake-core';
import { ToastContainer } from './components/toast/toast';
import { ThemeService } from './core/services/theme.service';
import { SchemaContext } from './core/services/schema-context';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainer],
  template: `<app-toast /><router-outlet />`,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
      background: var(--taskpane-bg, var(--bs-body-bg));
      color: var(--taskpane-fg, var(--bs-body-color));
    }
  `]
})
export class App {
  private readonly themeService = inject(ThemeService);
  private readonly authService = inject(AuthService);
  private readonly asyncTaskMonitor = inject(AsyncTaskMonitorService);
  private readonly schemaContext = inject(SchemaContext);

  constructor() {
    effect(() => {
      const isAuthenticated = this.authService.authenticated();
      untracked(() => {
        if (isAuthenticated) {
          this.asyncTaskMonitor.startRealtimeUpdates();
          this.schemaContext.loadSchemas();
        } else {
          this.asyncTaskMonitor.stopRealtimeUpdates();
        }
      });
    });
  }
}
