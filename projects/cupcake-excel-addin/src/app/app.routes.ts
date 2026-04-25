import { Routes } from '@angular/router';
import { LoginPanel } from './components/login-panel/login-panel';
import { NonImportedPanel } from './components/non-imported-panel/non-imported-panel';
import { ImportedTablePanel } from './components/imported-table-panel/imported-table-panel';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  { path: 'login', component: LoginPanel },
  { path: 'non-imported', component: NonImportedPanel, canActivate: [authGuard] },
  { path: 'imported', component: ImportedTablePanel, canActivate: [authGuard] },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];
