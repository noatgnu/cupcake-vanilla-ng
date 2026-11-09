import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { PluginRendererService } from './plugin-renderer';
import { CUPCAKE_CORE_CONFIG } from './auth';

describe('PluginRendererService', () => {
  let service: PluginRendererService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: 'http://api.test/api/v1' } },
      ],
    });
    service = TestBed.inject(PluginRendererService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('fetches widget data through the backend, never from the plugin', () => {
    service.fetch(3, '/api/status?verbose=1').subscribe();
    const req = httpMock.expectOne(r => r.url === 'http://api.test/api/v1/plugins/3/call/');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('endpoint')).toBe('/api/status?verbose=1');
    req.flush({});
  });

  it('submits form data through the backend', () => {
    service.submit(3, '/api/submit', { name: 'x' }).subscribe();
    const req = httpMock.expectOne('http://api.test/api/v1/plugins/3/call/');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ endpoint: '/api/submit', data: { name: 'x' } });
    req.flush({});
  });
});
