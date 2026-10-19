import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { CUPCAKE_CORE_CONFIG } from '@noatgnu/cupcake-core';

import { ProtocolService } from './protocol';
import { ProtocolsIOExportQueued } from '../models';

describe('ProtocolService', () => {
  let service: ProtocolService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ProtocolService,
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: '/api' } }
      ]
    });
    service = TestBed.inject(ProtocolService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
describe('ProtocolService protocols.io export', () => {
  let service: ProtocolService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: '/api' } },
        ProtocolService
      ]
    });
    service = TestBed.inject(ProtocolService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should import a protocol with the user account', () => {
    let protocolId: number | undefined;
    service.importFromProtocolsIOAccount('cupcake-export-test-kqcbcvssp').subscribe(result => protocolId = result.id);

    const request = httpMock.expectOne('/api/protocols/import_from_protocols_io_account/');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ protocol: 'cupcake-export-test-kqcbcvssp' });
    request.flush({ id: 41, protocol_title: 'Cupcake export test' });

    expect(protocolId).toBe(41);
  });

  it('should queue an export with the target and scaling factor', () => {
    let queued: ProtocolsIOExportQueued | undefined;
    service.exportToProtocolsIO(12, { target: 'https://www.protocols.io/edit/lysis-abc', scalingFactor: 2 }).subscribe(result => queued = result);

    const request = httpMock.expectOne('/api/protocols/12/export_to_protocols_io/');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ target: 'https://www.protocols.io/edit/lysis-abc', scaling_factor: 2 });
    request.flush({ task_id: '6f1c3a52-8b0e-4f7d-9a35-2d7c0e4b91a6', message: 'protocols.io export queued' });

    expect(queued).toEqual({ taskId: '6f1c3a52-8b0e-4f7d-9a35-2d7c0e4b91a6', message: 'protocols.io export queued' });
  });
});
