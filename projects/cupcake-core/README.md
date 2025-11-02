# Cupcake Core

The `cupcake-core` library provides essential services, components, and models for building Angular applications that interact with a Cupcake backend. It simplifies authentication, API communication, and provides a set of reusable UI components.

## Key Features

- **Authentication:** Simplified user authentication and session management.
- **API Service:** A robust API service with automatic request/response case transformation.
- **Guards & Interceptors:** Route guards and HTTP interceptors for securing your application.
- **Reusable Components:** A collection of pre-built components for common UI patterns.
- **Type-safe Models:** A comprehensive set of TypeScript interfaces for backend data structures.

## Installation

To install the `@noatgnu/cupcake-core` library, run the following command:

```bash
npm install @noatgnu/cupcake-core
```

Then, import the `CupcakeCoreModule` into your application's `AppModule` (or any other feature module):

```typescript
import { CupcakeCoreModule } from '@noatgnu/cupcake-core';

@NgModule({
  imports: [
    // ... other modules
    CupcakeCoreModule
  ],
  // ...
})
export class AppModule { }
```

Additionally, you need to provide the `CUPCAKE_CORE_CONFIG` in your `AppModule` to configure the API URL:

```typescript
import { CUPCAKE_CORE_CONFIG } from '@noatgnu/cupcake-core';

@NgModule({
  // ...
  providers: [
    {
      provide: CUPCAKE_CORE_CONFIG,
      useValue: { apiUrl: 'YOUR_API_URL_HERE' }
    }
  ]
})
export class AppModule { }
```

## Services

### AuthService

The `AuthService` handles user authentication, including login, logout, and token management. It uses JWT for authentication and stores tokens in local storage.

**Usage:**

```typescript
import { AuthService } from '@noatgnu/cupcake-core';

@Component({ ... })
export class MyComponent {
  constructor(private authService: AuthService) {
    this.authService.isAuthenticated$.subscribe(isAuthenticated => {
      // ...
    });

    this.authService.currentUser$.subscribe(user => {
      // ...
    });
  }

  login() {
    this.authService.login('username', 'password').subscribe(response => {
      // ...
    });
  }

  logout() {
    this.authService.logout().subscribe(() => {
      // ...
    });
  }
}
```

### ApiService

The `ApiService` is the primary service for communicating with the Cupcake backend. It provides methods for a wide range of functionalities, including user management, site configuration, and more.

**Automatic Case Transformation:**

The `ApiService` automatically transforms request data from camelCase (frontend) to snake_case (backend) and response data from snake_case to camelCase. This eliminates the need for manual transformations in your components and services.

**Usage:**

```typescript
import { ApiService } from '@noatgnu/cupcake-core';

@Component({ ... })
export class MyComponent {
  constructor(private apiService: ApiService) {
    this.apiService.getUsers().subscribe(response => {
      // `response` is already transformed to camelCase
      console.log(response.results);
    });
  }
}
```

## Guards

The library provides the following route guards:

- `AuthGuard`: Ensures that a route can only be accessed by authenticated users.
- `AdminGuard`: Ensures that a route can only be accessed by admin users.

**Usage (in your routing module):**

```typescript
import { AuthGuard, AdminGuard } from '@noatgnu/cupcake-core';

const routes: Routes = [
  {
    path: 'profile',
    component: UserProfileComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'admin',
    component: AdminDashboardComponent,
    canActivate: [AdminGuard]
  }
];
```

## Interceptors

The `AuthInterceptor` automatically attaches the JWT access token to outgoing HTTP requests. It also handles token refreshing when the access token expires.

## Components

The `cupcake-core` library includes a variety of reusable components, such as:

- **Login Form:** A complete login form with username/password fields.
- **User Management:** Components for listing, creating, and editing users.
- **Color Picker:** A color selection component.
- **Toast Notifications:** A container for displaying toast messages.
- **Powered-by Footer:** A standard footer component.

## Models

The library defines a comprehensive set of TypeScript interfaces that correspond to the backend data models. These models provide type safety and autocompletion when working with API responses. Some of the key models include:

- `User`
- `SiteConfig`
- `Annotation`
- `ResourcePermission`

By leveraging the services, components, and models provided by `cupcake-core`, you can significantly accelerate the development of your Angular application and ensure consistency with the Cupcake backend.
