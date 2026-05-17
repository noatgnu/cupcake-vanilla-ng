import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { BackupManagement } from './backup-management';
import { CUPCAKE_CORE_CONFIG } from '../services/auth';

describe('BackupManagement', () => {
  let component: BackupManagement;
  let fixture: ComponentFixture<BackupManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BackupManagement],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: 'http://localhost' } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BackupManagement);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
