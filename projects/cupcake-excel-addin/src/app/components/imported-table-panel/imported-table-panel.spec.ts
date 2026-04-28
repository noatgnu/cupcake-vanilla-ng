import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { CUPCAKE_CORE_CONFIG } from '@noatgnu/cupcake-core';
import { ImportedTablePanel } from './imported-table-panel';

describe('ImportedTablePanel', () => {
  let component: ImportedTablePanel;
  let fixture: ComponentFixture<ImportedTablePanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportedTablePanel],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: 'http://localhost' } },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ImportedTablePanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
