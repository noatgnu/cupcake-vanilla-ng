import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CompactLogin } from '../compact-login/compact-login';
import { ConnectionPanel } from '../connection-panel/connection-panel';

const PENDING_TABLE_KEY = 'cupcake-excel-pending-table-nav';

@Component({
  selector: 'app-login-panel',
  imports: [CompactLogin, ConnectionPanel],
  templateUrl: './login-panel.html',
  styleUrl: './login-panel.scss',
})
export class LoginPanel {
  private router = inject(Router);

  onLoginSuccess(): void {
    this.router.navigate(['/non-imported']);
  }

  onTableReady(tableId: number): void {
    sessionStorage.setItem(PENDING_TABLE_KEY, tableId.toString());
    this.router.navigate(['/imported']);
  }
}
