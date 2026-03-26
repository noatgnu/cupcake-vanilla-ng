import { Component, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { WailsService } from './core/services/wails.service';
import { SuperuserComponent } from './panels/superuser/superuser.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SuperuserComponent],
  template: `
    <router-outlet></router-outlet>

    @if (showSuperuserModal()) {
      <app-superuser />
    }
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
    }
  `]
})
export class AppComponent {
  private readonly wails = inject(WailsService);
  showSuperuserModal = this.wails.showSuperuserCreation;

  constructor() {
    effect(() => {
      const status = this.wails.backendStatus();
      if (status) {
        this.wails.logToFile(`Backend status: ${status.service} - ${status.status}: ${status.message}`);
      }
    });
  }
}
