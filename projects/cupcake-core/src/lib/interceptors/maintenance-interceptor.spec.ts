import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { CUPCAKE_CORE_CONFIG } from '../services/auth';
import { MaintenanceService } from '../services/maintenance';
import { maintenanceInterceptor } from './maintenance-interceptor';

describe('maintenanceInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let maintenance: jasmine.SpyObj<MaintenanceService>;

  beforeEach(() => {
    maintenance = jasmine.createSpyObj('MaintenanceService', ['start']);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withXhr(), withInterceptors([maintenanceInterceptor])),
        provideHttpClientTesting(),
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: '/api/v1' } },
        { provide: MaintenanceService, useValue: maintenance }
      ]
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  function failWith(url: string, status: number, body: object | null = null): void {
    http.get(url).subscribe({ error: () => undefined });
    const request = backend.expectOne(url);
    if (status === 0) {
      request.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
    } else {
      request.flush(body, { status, statusText: 'error' });
    }
  }

  it('shows the overlay for the appliance maintenance reply', () => {
    failWith('/api/v1/sessions/', 503, { error: 'The appliance is restarting.', maintenance: true });
    expect(maintenance.start).toHaveBeenCalledWith('restarting');
  });

  it('shows the overlay when the gateway cannot reach the backend', () => {
    failWith('/api/v1/sessions/', 502);
    expect(maintenance.start).toHaveBeenCalledWith('restarting');
  });

  it('shows the overlay when the appliance cannot be reached at all', () => {
    failWith('/api/v1/sessions/', 0);
    expect(maintenance.start).toHaveBeenCalledWith('unreachable');
  });

  it('leaves ordinary errors and other sites alone', () => {
    failWith('/api/v1/sessions/', 404);
    failWith('/api/v1/sessions/', 503, { error: 'busy' });
    failWith('https://other.example.org/data', 502);
    expect(maintenance.start).not.toHaveBeenCalled();
  });
});
