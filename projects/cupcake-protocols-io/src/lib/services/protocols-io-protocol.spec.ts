import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { CUPCAKE_CORE_CONFIG } from '@noatgnu/cupcake-core';

import { ProtocolsIOExportQueued, ProtocolsIOProtocolExport } from '../models';
import { ProtocolsIOProtocolService } from './protocols-io-protocol';

describe('ProtocolsIOProtocolService', () => {
  let service: ProtocolsIOProtocolService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: '/api' } },
        ProtocolsIOProtocolService
      ]
    });
    service = TestBed.inject(ProtocolsIOProtocolService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should import a protocol from an address', () => {
    let protocolId: number | undefined;
    service.importFromUrl('https://www.protocols.io/view/lysis-abc').subscribe(result => protocolId = result.id);

    const request = httpMock.expectOne('/api/protocols-io/protocols/import/');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ url: 'https://www.protocols.io/view/lysis-abc' });
    request.flush({ id: 40, protocol_title: 'Lysis' });

    expect(protocolId).toBe(40);
  });

  it('should import a protocol with the user account', () => {
    let protocolId: number | undefined;
    service.importFromAccount('cupcake-export-test-kqcbcvssp').subscribe(result => protocolId = result.id);

    const request = httpMock.expectOne('/api/protocols-io/protocols/import_from_account/');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ protocol: 'cupcake-export-test-kqcbcvssp' });
    request.flush({ id: 41, protocol_title: 'Cupcake export test' });

    expect(protocolId).toBe(41);
  });

  it('should queue an export with the target and scaling factor', () => {
    let queued: ProtocolsIOExportQueued | undefined;
    service.exportProtocol(12, { target: 'https://www.protocols.io/edit/lysis-abc', scalingFactor: 2 }).subscribe(result => queued = result);

    const request = httpMock.expectOne('/api/protocols-io/protocols/12/export/');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ target: 'https://www.protocols.io/edit/lysis-abc', scaling_factor: 2 });
    request.flush({ task_id: '6f1c3a52-8b0e-4f7d-9a35-2d7c0e4b91a6', message: 'protocols.io export queued' });

    expect(queued).toEqual({ taskId: '6f1c3a52-8b0e-4f7d-9a35-2d7c0e4b91a6', message: 'protocols.io export queued' });
  });

  it('should list the protocols.io exports of a protocol', () => {
    let exports: ProtocolsIOProtocolExport[] | undefined;
    service.getExports(12).subscribe(result => exports = result);

    const request = httpMock.expectOne('/api/protocols-io/protocols/12/exports/');
    expect(request.request.method).toBe('GET');
    request.flush([{
      id: 3,
      protocol: 12,
      exported_by: 5,
      exported_by_username: 'toan',
      protocols_io_id: 340067,
      protocols_io_guid: 'B5A1B28296954BDF8F34C4C693D95643',
      protocols_io_uri: 'lysis-abc',
      protocols_io_url: 'https://www.protocols.io/view/lysis-abc',
      step_ids: [41, 42],
      exported_at: '2026-10-19T14:02:11Z'
    }]);

    expect(exports?.[0].protocolsIoUri).toBe('lysis-abc');
    expect(exports?.[0].stepIds).toEqual([41, 42]);
  });
});
