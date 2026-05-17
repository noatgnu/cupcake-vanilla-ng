import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { StorageManagement } from './storage-management';
import { CUPCAKE_CORE_CONFIG } from '../services/auth';

describe('StorageManagement', () => {
  let component: StorageManagement;
  let fixture: ComponentFixture<StorageManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StorageManagement],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: 'http://localhost' } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StorageManagement);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
