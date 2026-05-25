import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { CUPCAKE_CORE_CONFIG } from '@noatgnu/cupcake-core';

import { UserDevicesPage } from './user-devices-page';

describe('UserDevicesPage', () => {
  let component: UserDevicesPage;
  let fixture: ComponentFixture<UserDevicesPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserDevicesPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: 'http://localhost:8000/api/v1' } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserDevicesPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
