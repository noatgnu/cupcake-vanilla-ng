import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { PluginCard } from './plugin-card';
import { PluginWidgetDefinition } from '../../models/plugin';
import { CUPCAKE_CORE_CONFIG } from '../../services/auth';

const definition: PluginWidgetDefinition = { id: 'w1', type: 'card', title: 'Status', endpoint: '/api/status' };

describe('PluginCard', () => {
  let component: PluginCard;
  let fixture: ComponentFixture<PluginCard>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PluginCard],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: 'http://api.test', siteName: 'Test' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PluginCard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('definition', definition);
    fixture.componentRef.setInput('baseUrl', 'http://plugin.local');
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should create', () => {
    httpMock.expectOne('http://plugin.local/api/status').flush({});
    expect(component).toBeTruthy();
  });

  it('should start in loading state', () => {
    expect(component.loading()).toBeTrue();
    httpMock.expectOne('http://plugin.local/api/status').flush({});
  });

  it('should fetch endpoint on init and populate data', async () => {
    const mockData = { health: 'ok', count: 5 };
    httpMock.expectOne('http://plugin.local/api/status').flush(mockData);
    await fixture.whenStable();
    expect(component.loading()).toBeFalse();
    expect(component.data()).toBeTruthy();
  });

  it('should set error on HTTP failure', async () => {
    httpMock.expectOne('http://plugin.local/api/status').flush({}, { status: 500, statusText: 'Error' });
    await fixture.whenStable();
    expect(component.error()).toBeTruthy();
    expect(component.loading()).toBeFalse();
  });

  it('should not fetch when endpoint is absent', async () => {
    const noEndpoint: PluginWidgetDefinition = { id: 'w2', type: 'card' };
    fixture.componentRef.setInput('definition', noEndpoint);
    fixture.componentRef.setInput('baseUrl', 'http://plugin.local');
    component.ngOnInit();
    httpMock.expectNone('http://plugin.local');
  });
});
