# CupcakeCore

A reusable Angular library that provides user management, authentication, and site configuration functionality for cupcake applications.

## Features

- **Authentication**: Login/register components with ORCID support
- **User Management**: Admin user management, lab groups, user profiles
- **Site Configuration**: Configurable site settings and branding
- **Guards & Interceptors**: Auth guard, admin guard, and HTTP interceptors
- **Models & Services**: Complete set of models and services for user management

## Installation

```bash
npm install cupcake-core
```

## Usage

### 1. Configure in your app.config.ts

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor, CUPCAKE_CORE_CONFIG } from 'cupcake-core';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: 'https://your-api.com' } },
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    // ... other providers
  ]
};
```

### 2. Use components in your routes

```typescript
import { Routes } from '@angular/router';
import { LoginComponent, RegisterComponent, authGuard, adminGuard } from 'cupcake-core';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'protected', component: YourComponent, canActivate: [authGuard] },
  { path: 'admin', component: AdminComponent, canActivate: [authGuard, adminGuard] },
];
```

### 3. Import services in your components

```typescript
import { Component, inject } from '@angular/core';
import { AuthService, SiteConfigService, User } from 'cupcake-core';

@Component({
  selector: 'app-example',
  template: \`
    <div *ngIf="currentUser">
      Welcome, {{ currentUser.first_name }}!
    </div>
  \`
})
export class ExampleComponent {
  private authService = inject(AuthService);
  private siteConfigService = inject(SiteConfigService);
  
  currentUser = this.authService.currentUser$;
  siteConfig = this.siteConfigService.config$;
}
```

## Available Components

- `LoginComponent` - Login form with username/password and ORCID support
- `RegisterComponent` - User registration form
- `UserProfileComponent` - User profile management
- `UserManagementComponent` - Admin user management
- `LabGroupsComponent` - Lab group management
- `SiteConfigComponent` - Site configuration management
- `ToastContainerComponent` - Toast notification container

## Available Services

- `AuthService` - Authentication and user management
- `ApiService` - API communication
- `SiteConfigService` - Site configuration
- `UserManagementService` - User management operations
- `ToastService` - Toast notifications
- `ResourceService` - Resource utilities

## Available Guards

- `authGuard` - Protect routes requiring authentication
- `adminGuard` - Protect admin-only routes

## Available Models

All necessary TypeScript interfaces and enums for user management, authentication, and site configuration.

## Building the Library

To build the library:

```bash
ng build cupcake-core
```

To publish:

```bash
cd dist/cupcake-core
npm publish
```

## Development

The library is designed to be framework-agnostic and can be imported by any Angular application that needs user management functionality.