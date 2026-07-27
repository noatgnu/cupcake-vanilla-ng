import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { CUPCAKE_CORE_CONFIG } from '@noatgnu/cupcake-core';

import { PluginPageWrapper } from './plugin-page-wrapper';

describe('PluginPageWrapper', () => {
  let component: PluginPageWrapper;
  let fixture: ComponentFixture<PluginPageWrapper>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PluginPageWrapper],
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: 'http://localhost:8000/api' } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ pluginId: '1', pagePath: 'home' }) } },
        },
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PluginPageWrapper);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
