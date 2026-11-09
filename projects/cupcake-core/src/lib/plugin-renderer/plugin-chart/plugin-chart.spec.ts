import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpRequest } from '@angular/common/http';

import { chartGeometry, PluginChart } from './plugin-chart';
import { PluginWidgetDefinition } from '../../models/plugin';
import { CUPCAKE_CORE_CONFIG } from '../../services/auth';

const definition: PluginWidgetDefinition = { id: 'w1', type: 'chart', endpoint: '/api/chart-data' };

function call(endpoint: string): (req: HttpRequest<unknown>) => boolean {
  return req => req.url.endsWith('/plugins/1/call/') && (req.method === 'POST' || req.params.get('endpoint') === endpoint);
}

describe('PluginChart', () => {
  let component: PluginChart;
  let fixture: ComponentFixture<PluginChart>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PluginChart],
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: 'http://api.test', siteName: 'Test' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PluginChart);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('definition', definition);
    fixture.componentRef.setInput('pluginId', 1);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should create', () => {
    fixture.detectChanges();
    httpMock.expectOne(call('/api/chart-data')).flush({});
    expect(component).toBeTruthy();
  });

  it('should fetch data on init', async () => {
    fixture.detectChanges();
    const chartData = { labels: ['A', 'B'], datasets: [{ label: 'CPU', data: [1, 2] }] };
    httpMock.expectOne(call('/api/chart-data')).flush(chartData);
    await fixture.whenStable();
    expect(component.data()).toBeTruthy();
    expect(component.loading()).toBeFalse();
  });

  it('should set error on failure', async () => {
    fixture.detectChanges();
    httpMock.expectOne(call('/api/chart-data')).flush({}, { status: 500, statusText: 'Error' });
    await fixture.whenStable();
    expect(component.error()).toBeTruthy();
  });

  it('should not fetch when endpoint is absent', () => {
    fixture.componentRef.setInput('definition', { id: 'w2', type: 'chart' });
    component.ngOnInit();
    httpMock.expectNone(req => req.url.includes('/call/'));
  });

  const twoSeries = {
    labels: ['10:00', '10:01', '10:02'],
    datasets: [{ label: 'CPU', data: [50, 52.5, 55] }, { label: 'GPU', data: [40, null as unknown as number, 44] }],
    unit: '°C',
  };

  function show(data: object): HTMLElement {
    fixture.detectChanges();
    httpMock.expectOne(call('/api/chart-data')).flush(data);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('draws one line per series with a legend when there are several', () => {
    const element = show(twoSeries);
    expect(element.querySelectorAll('path.line').length).toBe(2);
    expect(element.querySelector('.legend')?.textContent).toContain('GPU');
  });

  it('leaves out the legend for a single series', () => {
    const element = show({ ...twoSeries, datasets: [twoSeries.datasets[0]] });
    expect(element.querySelector('.legend')).toBeNull();
  });

  it('breaks a line at missing values', () => {
    const geometry = chartGeometry(twoSeries)!;
    expect(geometry.series[1].path.match(/M/g)?.length).toBe(2);
    expect(geometry.series[0].path.match(/M/g)?.length).toBe(1);
  });

  it('puts round ticks around the values', () => {
    const ticks = chartGeometry(twoSeries)!.ticks.map(t => t.value);
    expect(ticks[0]).toBeLessThanOrEqual(40);
    expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(55);
  });

  it('draws at most eight series', () => {
    const many = { labels: ['a'], datasets: Array.from({ length: 10 }, (_, i) => ({ label: `S${i}`, data: [i] })) };
    expect(chartGeometry(many)!.series.length).toBe(8);
  });

  it('has nothing to draw without values', () => {
    expect(chartGeometry({ labels: [], datasets: [] })).toBeNull();
    const element = show({ labels: ['a'], datasets: [{ label: 'x', data: [] }] });
    expect(element.textContent).toContain('No data.');
  });

  it('reads every series at a point with the arrow keys', () => {
    const element = show(twoSeries);
    const plot = element.querySelector('.plot') as HTMLElement;
    plot.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    fixture.detectChanges();
    const tooltip = element.querySelector('.chart-tooltip')?.textContent ?? '';
    expect(tooltip).toContain('10:01');
    expect(tooltip).toContain('52.5 °C');
    expect(tooltip).toContain('—');
  });

  it('shows the values as a table on request', () => {
    const element = show(twoSeries);
    (element.querySelector('.toggle-table') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(element.querySelectorAll('.chart-table tbody tr').length).toBe(3);
  });

  it('replaces the chart with live data', () => {
    show(twoSeries);
    fixture.componentRef.setInput('live', { labels: ['x'], datasets: [{ label: 'CPU', data: [60] }] });
    fixture.detectChanges();
    expect(component.geometry()!.labels).toEqual(['x']);
  });
});
