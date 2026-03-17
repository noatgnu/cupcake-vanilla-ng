import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { MetadataTablesComponent } from './metadata-tables';
import { CUPCAKE_CORE_CONFIG } from '@noatgnu/cupcake-core';

describe('MetadataTablesComponent', () => {
  let component: MetadataTablesComponent;
  let fixture: ComponentFixture<MetadataTablesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetadataTablesComponent, RouterTestingModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: 'http://localhost:8000/api' } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MetadataTablesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
