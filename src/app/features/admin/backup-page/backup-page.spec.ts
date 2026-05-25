import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { CUPCAKE_CORE_CONFIG } from '@noatgnu/cupcake-core';
import { BackupPage } from './backup-page';

describe('BackupPage', () => {
  let component: BackupPage;
  let fixture: ComponentFixture<BackupPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BackupPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: 'http://localhost:8000/api' } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BackupPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
