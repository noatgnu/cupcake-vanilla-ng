import { Routes } from '@angular/router';
import { LoginComponent, RegisterComponent, SiteConfigComponent, UserManagementComponent, UserProfileComponent, LabGroupsComponent, authGuard, adminGuard } from '@cupcake/core';
import { MetadataTablesComponent} from './features/metadata-tables/metadata-tables';
import { MetadataTableDetailsComponent } from './features/metadata-table-details/metadata-table-details';
import { FavoriteManagementComponent } from './features/favorite-management/favorite-management';
import { MetadataTableTemplates } from '@cupcake/vanilla';
import {ColumnTemplatesComponent} from './features/column-templates/column-templates';
import {MetadataSelector} from './features/metadata-selector/metadata-selector';

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
    path: 'register',
    component: RegisterComponent
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
    path: 'users/profile',
    component: UserProfileComponent,
    canActivate: [authGuard]
  },
  {
    path: 'users/lab-groups', 
    redirectTo: '/lab-groups',
    pathMatch: 'full'
  },
  {
    path: 'favorites',
    component: FavoriteManagementComponent,
    canActivate: [authGuard]
  },
  {
    path: 'admin/site-config',
    component: SiteConfigComponent,
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'admin/users',
    component: UserManagementComponent,
    canActivate: [authGuard, adminGuard]
  },
  {
    path: '**',
    redirectTo: '/metadata'
  }
];
