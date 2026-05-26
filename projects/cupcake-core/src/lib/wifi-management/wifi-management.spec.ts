import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { WifiManagement } from './wifi-management';
import { CUPCAKE_CORE_CONFIG } from '../services/auth';

describe('WifiManagement', () => {
  let component: WifiManagement;
  let fixture: ComponentFixture<WifiManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WifiManagement],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: 'http://localhost' } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WifiManagement);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
