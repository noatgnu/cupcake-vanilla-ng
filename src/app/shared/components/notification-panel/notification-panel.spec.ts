import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { CUPCAKE_CORE_CONFIG } from '@noatgnu/cupcake-core';

import { NotificationPanel } from './notification-panel';

describe('NotificationPanel', () => {
  let component: NotificationPanel;
  let fixture: ComponentFixture<NotificationPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationPanel],
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: 'http://localhost:8000/api' } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotificationPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
