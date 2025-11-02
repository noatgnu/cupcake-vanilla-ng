import { Routes } from '@angular/router';
import { LoginComponent, RegisterComponent, SiteConfigComponent, UserManagementComponent, UserProfileComponent, LabGroupsComponent, authGuard, adminGuard } from '@noatgnu/cupcake-core';
import { MetadataTablesComponent} from './features/metadata-tables/metadata-tables';
import { MetadataTableTemplates, ColumnTemplates, FavoriteManagement, MetadataTableDetails } from '@noatgnu/cupcake-vanilla';
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
    component: MetadataTableDetails,
    canActivate: [authGuard]
  },
  {
    path: 'metadata-tables/:id/:mode',
    component: MetadataTableDetails,
    canActivate: [authGuard]
  },
  {
    path: 'metadata-templates',
    component: ColumnTemplates,
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
    component: FavoriteManagement,
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
