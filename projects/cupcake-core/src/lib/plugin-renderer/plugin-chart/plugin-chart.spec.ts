import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { PluginChart } from './plugin-chart';
import { PluginWidgetDefinition } from '../../models/plugin';
import { CUPCAKE_CORE_CONFIG } from '../../services/auth';

const definition: PluginWidgetDefinition = { id: 'w1', type: 'chart', endpoint: '/api/chart-data' };

describe('PluginChart', () => {
  let component: PluginChart;
  let fixture: ComponentFixture<PluginChart>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PluginChart],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: 'http://api.test', siteName: 'Test' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PluginChart);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('definition', definition);
    fixture.componentRef.setInput('baseUrl', 'http://plugin.local');
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should create', () => {
    httpMock.expectOne('http://plugin.local/api/chart-data').flush({});
    expect(component).toBeTruthy();
  });

  it('should fetch data on init', async () => {
    const chartData = { labels: ['A', 'B'], values: [1, 2] };
    httpMock.expectOne('http://plugin.local/api/chart-data').flush(chartData);
    await fixture.whenStable();
    expect(component.data()).toBeTruthy();
    expect(component.loading()).toBeFalse();
  });

  it('should set error on failure', async () => {
    httpMock.expectOne('http://plugin.local/api/chart-data').flush({}, { status: 500, statusText: 'Error' });
    await fixture.whenStable();
    expect(component.error()).toBeTruthy();
  });

  it('should not fetch when endpoint is absent', () => {
    fixture.componentRef.setInput('definition', { id: 'w2', type: 'chart' });
    component.ngOnInit();
    httpMock.expectNone('http://plugin.local');
  });
});
