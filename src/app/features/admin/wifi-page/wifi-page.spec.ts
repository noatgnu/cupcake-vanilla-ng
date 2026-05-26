import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { CUPCAKE_CORE_CONFIG } from '@noatgnu/cupcake-core';
import { WifiPage } from './wifi-page';

describe('WifiPage', () => {
  let component: WifiPage;
  let fixture: ComponentFixture<WifiPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WifiPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: 'http://localhost:8000/api' } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WifiPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
