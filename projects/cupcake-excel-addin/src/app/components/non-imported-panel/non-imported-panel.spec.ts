import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { CUPCAKE_CORE_CONFIG } from '@noatgnu/cupcake-core';
import { NonImportedPanel } from './non-imported-panel';

describe('NonImportedPanel', () => {
  let component: NonImportedPanel;
  let fixture: ComponentFixture<NonImportedPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NonImportedPanel],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: 'http://localhost' } },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NonImportedPanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
