import { Routes } from '@angular/router';
import { ColumnTemplatesComponent } from './features/column-templates/column-templates';
import { MetadataTableTemplates } from './features/metadata-table-templates/metadata-table-templates';
import { LoginComponent } from './auth/login/login';
import { SiteConfigComponent } from './features/admin/site-config/site-config';
import { MetadataSelector } from './features/metadata-selector/metadata-selector';
import { MetadataTablesComponent } from './features/metadata-tables/metadata-tables';
import { MetadataTableDetailsComponent } from './features/metadata-table-details/metadata-table-details';
import { LabGroupsComponent } from './features/lab-groups/lab-groups';
import { authGuard } from './shared/guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/metadata',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'metadata',
    component: MetadataSelector,
    canActivate: [authGuard]
  },
  {
    path: 'metadata-tables',
    component: MetadataTablesComponent,
    canActivate: [authGuard]
  },
  {
    path: 'metadata-tables/:id',
    component: MetadataTableDetailsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'metadata-tables/:id/:mode',
    component: MetadataTableDetailsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'metadata-templates',
    component: ColumnTemplatesComponent,
    canActivate: [authGuard]
  },
  {
    path: 'metadata-table-templates',
    component: MetadataTableTemplates,
    canActivate: [authGuard]
  },
  {
    path: 'column-templates',
    redirectTo: '/metadata-templates',
    pathMatch: 'full'
  },
  {
    path: 'lab-groups',
    component: LabGroupsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'admin/site-config',
    component: SiteConfigComponent,
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: '/metadata'
  }
];
