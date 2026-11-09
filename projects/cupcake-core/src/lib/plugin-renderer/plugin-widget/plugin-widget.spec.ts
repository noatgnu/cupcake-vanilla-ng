import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpRequest, provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { PluginWidget } from './plugin-widget';
import { PluginWidgetDefinition } from '../../models/plugin';
import { CUPCAKE_CORE_CONFIG } from '../../services/auth';

function call(endpoint: string): (req: HttpRequest<unknown>) => boolean {
  return req => req.url.endsWith('/plugins/1/call/') && (req.method === 'POST' || req.params.get('endpoint') === endpoint);
}

describe('PluginWidget', () => {
  let component: PluginWidget;
  let fixture: ComponentFixture<PluginWidget>;
  let httpMock: HttpTestingController;

  const makeDefinition = (type: PluginWidgetDefinition['type']): PluginWidgetDefinition => ({
    id: 'w1',
    type,
    endpoint: '/api/data',
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PluginWidget],
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: 'http://api.test', siteName: 'Test' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PluginWidget);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('pluginId', 1);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.match(() => true).forEach(r => r.flush({}));
    httpMock.verify();
  });

  it('should create', () => {
    fixture.componentRef.setInput('definition', makeDefinition('card'));
    fixture.detectChanges();
    httpMock.expectOne(call('/api/data')).flush({});
    expect(component).toBeTruthy();
  });

  it('should render ccc-plugin-card for type card', () => {
    fixture.componentRef.setInput('definition', makeDefinition('card'));
    fixture.detectChanges();
    httpMock.expectOne(call('/api/data')).flush({});
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('ccc-plugin-card')).toBeTruthy();
  });

  it('should render ccc-plugin-list for type list', () => {
    fixture.componentRef.setInput('definition', makeDefinition('list'));
    fixture.detectChanges();
    httpMock.expectOne(call('/api/data')).flush([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('ccc-plugin-list')).toBeTruthy();
  });

  it('should render ccc-plugin-table for type table', () => {
    fixture.componentRef.setInput('definition', makeDefinition('table'));
    fixture.detectChanges();
    httpMock.expectOne(call('/api/data')).flush([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('ccc-plugin-table')).toBeTruthy();
  });

  it('should render ccc-plugin-form for type form', () => {
    fixture.componentRef.setInput('definition', makeDefinition('form'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('ccc-plugin-form')).toBeTruthy();
  });


  it('should render ccc-plugin-chart for type chart', () => {
    fixture.componentRef.setInput('definition', makeDefinition('chart'));
    fixture.detectChanges();
    httpMock.expectOne(call('/api/data')).flush({});
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('ccc-plugin-chart')).toBeTruthy();
  });

  it('should render fallback text for unknown type', () => {
    fixture.componentRef.setInput('definition', makeDefinition('custom'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Unsupported widget type');
  });
});
