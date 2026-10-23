import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { CUPCAKE_CORE_CONFIG } from '@noatgnu/cupcake-core';

import { ProtocolsIOAccountService } from './protocols-io-account';
import { ProtocolsIOAccountStatus } from '../models';

describe('ProtocolsIOAccountService', () => {
  let service: ProtocolsIOAccountService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: '/api' } },
        ProtocolsIOAccountService
      ]
    });
    service = TestBed.inject(ProtocolsIOAccountService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should read the connection status', () => {
    let status: ProtocolsIOAccountStatus | undefined;
    service.getStatus().subscribe(result => status = result);

    const request = httpMock.expectOne('/api/protocols-io/account/');
    expect(request.request.method).toBe('GET');
    request.flush({ connected: true, username: 'toan-phung', name: 'Toan K Phung', connected_at: '2026-10-19T08:00:00Z', last_used_at: null });

    expect(status).toEqual({ connected: true, username: 'toan-phung', name: 'Toan K Phung', connectedAt: '2026-10-19T08:00:00Z', lastUsedAt: null });
  });

  it('should send the token as access_token when connecting', () => {
    let status: ProtocolsIOAccountStatus | undefined;
    service.connect('personal-token').subscribe(result => status = result);

    const request = httpMock.expectOne('/api/protocols-io/account/');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ access_token: 'personal-token' });
    request.flush({ connected: true, username: 'toan-phung', name: '', connected_at: '2026-10-19T08:00:00Z', last_used_at: null });

    expect(status?.connected).toBeTrue();
    expect(status?.username).toBe('toan-phung');
  });

  it('should disconnect', () => {
    let finished = false;
    service.disconnect().subscribe(() => finished = true);

    const request = httpMock.expectOne('/api/protocols-io/account/disconnect/');
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });

    expect(finished).toBeTrue();
  });
});
