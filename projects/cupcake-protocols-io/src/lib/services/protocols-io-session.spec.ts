import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { CUPCAKE_CORE_CONFIG } from '@noatgnu/cupcake-core';

import { ProtocolsIOExportQueued, ProtocolsIORun, ProtocolsIOSessionProtocolStatus } from '../models';
import { ProtocolsIOSessionService } from './protocols-io-session';

describe('ProtocolsIOSessionService', () => {
  let service: ProtocolsIOSessionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ProtocolsIOSessionService,
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: '/api' } }
      ]
    });
    service = TestBed.inject(ProtocolsIOSessionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });


  it('should queue a protocols.io export of the session', () => {
    let queued: ProtocolsIOExportQueued | undefined;
    service.exportSession(7, {
      protocols: [12, 15],
      newRuns: true,
      folder: 'C5463D4BF23D11ECA31A0A58A9FEAC02',
      sessionUrl: 'https://cupcake.example.org/protocols/sessions/7'
    }).subscribe(result => queued = result);

    const request = httpMock.expectOne('/api/protocols-io/sessions/7/export/');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      protocols: [12, 15],
      new_runs: true,
      folder: 'C5463D4BF23D11ECA31A0A58A9FEAC02',
      session_url: 'https://cupcake.example.org/protocols/sessions/7'
    });
    request.flush({ task_id: 'task-1', message: 'protocols.io session export queued' });

    expect(queued).toEqual({ taskId: 'task-1', message: 'protocols.io session export queued' });
  });

  it('should list the protocols.io runs of the session', () => {
    let runs: ProtocolsIORun[] | undefined;
    service.getRuns(7).subscribe(result => runs = result);

    const request = httpMock.expectOne('/api/protocols-io/sessions/7/runs/');
    expect(request.request.method).toBe('GET');
    request.flush([{
      id: 4,
      session: 7,
      protocol: 12,
      protocol_title: 'Lysis',
      protocol_export: 3,
      exported_by: 5,
      exported_by_username: 'toan',
      record_id: 523011,
      record_guid: 'C9B15EBCCBC711F1AECE0A58A9FEAC02',
      record_url: 'https://www.protocols.io/run/C9B15EBCCBC711F1AECE0A58A9FEAC02',
      item_id: 1841500,
      title: 'Run 7 - Lysis',
      comment_count: 6,
      created_at: '2026-10-19T15:10:00Z',
      exported_at: '2026-10-19T15:12:30Z'
    }]);

    expect(runs?.[0].recordUrl).toBe('https://www.protocols.io/run/C9B15EBCCBC711F1AECE0A58A9FEAC02');
    expect(runs?.[0].commentCount).toBe(6);
    expect(runs?.[0].protocolTitle).toBe('Lysis');
  });

  it('should describe how each protocol of the session would be exported', () => {
    let status: ProtocolsIOSessionProtocolStatus[] | undefined;
    service.getStatus(7).subscribe(result => status = result);

    const request = httpMock.expectOne('/api/protocols-io/sessions/7/status/');
    expect(request.request.method).toBe('GET');
    request.flush([{
      protocol: 12,
      protocol_title: 'Lysis',
      protocol_export: null,
      varied_steps: 2,
      run: null,
      run_is_current: false
    }]);

    expect(status?.[0].protocolTitle).toBe('Lysis');
    expect(status?.[0].variedSteps).toBe(2);
    expect(status?.[0].protocolExport).toBeNull();
    expect(status?.[0].runIsCurrent).toBeFalse();
  });
});
