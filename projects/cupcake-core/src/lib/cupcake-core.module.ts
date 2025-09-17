import { NgModule, ModuleWithProviders, InjectionToken } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, provideHttpClient, withInterceptors } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { LoginComponent } from './components/auth/login/login';
import { RegisterComponent } from './components/auth/register/register';
import { ToastContainerComponent } from './components/toast-container/toast-container';

import { CupcakeCoreConfig, CUPCAKE_CORE_CONFIG } from './services/auth';
import { authInterceptor } from './interceptors/auth-interceptor';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule,
    NgbModule,
    LoginComponent,
    RegisterComponent,
    ToastContainerComponent
  ],
  exports: [
    LoginComponent,
    RegisterComponent, 
    ToastContainerComponent,
    CommonModule,
    ReactiveFormsModule,
    NgbModule
  ]
})
export class CupcakeCoreModule {
  static forRoot(config: CupcakeCoreConfig): ModuleWithProviders<CupcakeCoreModule> {
    return {
      ngModule: CupcakeCoreModule,
      providers: [
        { provide: CUPCAKE_CORE_CONFIG, useValue: config },
        provideHttpClient(
          withInterceptors([authInterceptor])
        )
      ]
    };
  }
}