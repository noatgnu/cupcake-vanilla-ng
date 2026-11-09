import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpRequest } from '@angular/common/http';

import { PluginCard } from './plugin-card';
import { PluginWidgetDefinition } from '../../models/plugin';
import { CUPCAKE_CORE_CONFIG } from '../../services/auth';

const definition: PluginWidgetDefinition = { id: 'w1', type: 'card', title: 'Status', endpoint: '/api/status' };

function call(endpoint: string): (req: HttpRequest<unknown>) => boolean {
  return req => req.url.endsWith('/plugins/1/call/') && (req.method === 'POST' || req.params.get('endpoint') === endpoint);
}

describe('PluginCard', () => {
  let component: PluginCard;
  let fixture: ComponentFixture<PluginCard>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PluginCard],
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: 'http://api.test', siteName: 'Test' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PluginCard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('definition', definition);
    fixture.componentRef.setInput('pluginId', 1);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should create', () => {
    fixture.detectChanges();
    httpMock.expectOne(call('/api/status')).flush({});
    expect(component).toBeTruthy();
  });

  it('should start in loading state', () => {
    fixture.detectChanges();
    expect(component.loading()).toBeTrue();
    httpMock.expectOne(call('/api/status')).flush({});
  });

  it('should fetch endpoint on init and populate data', async () => {
    fixture.detectChanges();
    const mockData = { health: 'ok', count: 5 };
    httpMock.expectOne(call('/api/status')).flush(mockData);
    await fixture.whenStable();
    expect(component.loading()).toBeFalse();
    expect(component.data()).toBeTruthy();
  });

  it('should set error on HTTP failure', async () => {
    fixture.detectChanges();
    httpMock.expectOne(call('/api/status')).flush({}, { status: 500, statusText: 'Error' });
    await fixture.whenStable();
    expect(component.error()).toBeTruthy();
    expect(component.loading()).toBeFalse();
  });

  it('should not fetch when endpoint is absent', async () => {
    const noEndpoint: PluginWidgetDefinition = { id: 'w2', type: 'card' };
    fixture.componentRef.setInput('definition', noEndpoint);
    fixture.componentRef.setInput('pluginId', 1);
    component.ngOnInit();
    httpMock.expectNone(req => req.url.includes('/call/'));
  });

  it('shows live data in place of the fetched data', async () => {
    fixture.detectChanges();
    httpMock.expectOne(req => req.url.endsWith('/plugins/1/call/')).flush({ Old: 1 });
    fixture.componentRef.setInput('live', { Temperature: '52 °C' });
    fixture.detectChanges();
    expect(component.data()).toEqual({ Temperature: '52 °C' });
  });

  it('keeps the rows in the order the plugin sends them', async () => {
    fixture.detectChanges();
    httpMock.expectOne(req => req.url.endsWith('/plugins/1/call/')).flush({ Zone: 'cpu', Alpha: 1 });
    fixture.detectChanges();
    const labels = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.col-5')).map(e => e.textContent?.trim());
    expect(labels).toEqual(['Zone', 'Alpha']);
  });

  it('reloads every refreshInterval without showing loading again', () => {
    jasmine.clock().install();
    try {
      fixture.componentRef.setInput('definition', { ...definition, refreshInterval: 5000 });
      fixture.detectChanges();
      httpMock.expectOne(req => req.url.endsWith('/plugins/1/call/')).flush({ A: 1 });
      jasmine.clock().tick(5000);
      expect(component.loading()).toBeFalse();
      httpMock.expectOne(req => req.url.endsWith('/plugins/1/call/')).flush({ A: 2 });
      expect(component.data()).toEqual({ A: 2 });
      fixture.destroy();
      jasmine.clock().tick(5000);
      httpMock.expectNone(req => req.url.endsWith('/plugins/1/call/'));
    } finally {
      jasmine.clock().uninstall();
    }
  });
});
