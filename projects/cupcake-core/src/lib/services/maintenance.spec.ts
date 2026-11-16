import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { CUPCAKE_CORE_CONFIG } from './auth';
import { MaintenanceService } from './maintenance';

describe('MaintenanceService', () => {
  let service: MaintenanceService;
  let http: HttpTestingController;

  beforeEach(() => {
    jasmine.clock().install();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: '/api/v1' } }
      ]
    });
    service = TestBed.inject(MaintenanceService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    service.stop();
    jasmine.clock().uninstall();
  });

  it('keeps checking until the backend answers, then clears', () => {
    service.start('restarting');
    expect(service.active()).toBeTrue();
    jasmine.clock().tick(3000);
    http.expectOne('/api/v1/appliance/network-info/').flush({}, { status: 503, statusText: 'Service Unavailable' });
    expect(service.active()).toBeTrue();
    jasmine.clock().tick(4000);
    http.expectOne('/api/v1/appliance/network-info/').flush({ hostname: 'cupcake', addresses: [] });
    expect(service.active()).toBeFalse();
    http.verify();
  });

  it('treats any real answer from the backend as being back', () => {
    service.start('unreachable');
    jasmine.clock().tick(3000);
    http.expectOne('/api/v1/appliance/network-info/').flush({}, { status: 404, statusText: 'Not Found' });
    expect(service.active()).toBeFalse();
  });

  it('runs one set of checks however many requests fail', () => {
    service.start('restarting');
    service.start('unreachable');
    expect(service.reason()).toBe('unreachable');
    jasmine.clock().tick(3000);
    expect(http.match('/api/v1/appliance/network-info/').length).toBe(1);
  });
});
