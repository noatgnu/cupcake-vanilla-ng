import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { CUPCAKE_CORE_CONFIG } from '@noatgnu/cupcake-core';
import { LoginPanel } from './login-panel';

describe('LoginPanel', () => {
  let component: LoginPanel;
  let fixture: ComponentFixture<LoginPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPanel],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: 'http://localhost' } },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
