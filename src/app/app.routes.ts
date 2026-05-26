import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { LoginComponent, RegisterComponent, SiteConfigComponent, UserManagementComponent, UserProfileComponent, LabGroupsComponent, authGuard, adminGuard } from '@noatgnu/cupcake-core';
import { StoragePage } from './features/admin/storage-page/storage-page';
import { BackupPage } from './features/admin/backup-page/backup-page';
import { WifiPage } from './features/admin/wifi-page/wifi-page';
import { UserDevicesPage } from './features/user-devices/user-devices-page/user-devices-page';
import { PluginPageWrapper } from './features/plugins/plugin-page-wrapper/plugin-page-wrapper';
import { MetadataTablesComponent} from './features/metadata-tables/metadata-tables';
import { MetadataTableTemplates, ColumnTemplates, FavoriteManagement, MetadataTableDetails } from '@noatgnu/cupcake-vanilla';
import {MetadataSelector} from './features/metadata-selector/metadata-selector';
import { EnvironmentService } from './shared/services/environment';

const applianceGuard = () => {
  const env = inject(EnvironmentService);
  const router = inject(Router);
  if (!env.isAppliance()) {
    return router.parseUrl('/metadata');
  }
  return true;
};

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
    path: 'admin/storage',
    component: StoragePage,
    canActivate: [authGuard, adminGuard, applianceGuard]
  },
  {
    path: 'admin/backup',
    component: BackupPage,
    canActivate: [authGuard, adminGuard, applianceGuard]
  },
  {
    path: 'admin/wifi',
    component: WifiPage,
    canActivate: [authGuard, adminGuard, applianceGuard]
  },
  {
    path: 'user/devices',
    component: UserDevicesPage,
    canActivate: [authGuard]
  },
  {
    path: 'plugins/:pluginId/:pagePath',
    component: PluginPageWrapper,
    canActivate: [authGuard]
  },
  {
    path: 'plugins/:pluginId',
    component: PluginPageWrapper,
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: '/metadata'
  }
];
