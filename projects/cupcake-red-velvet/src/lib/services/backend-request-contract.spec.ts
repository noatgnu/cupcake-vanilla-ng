import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { CUPCAKE_CORE_CONFIG } from '@noatgnu/cupcake-core';
import { ProtocolService } from './protocol';
import { ProtocolReagentService } from './protocol-reagent';
import { ProtocolRatingService } from './protocol-rating';
import { StepReagentService } from './step-reagent';
import { StepAnnotationService } from './step-annotation';
import { StepVariationService } from './step-variation';
import { TimeKeeperService } from './timekeeper';
import { SessionAnnotationService } from './session-annotation';

const API = 'http://localhost:8000/api/v1';

describe('Requests sent to the CUPCAKE Red Velvet backend', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: API } }
      ]
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  function expectRequest(method: string, url: string, body: unknown, response: object = {}) {
    const req = httpMock.expectOne(r => r.urlWithParams === `${API}${url}`);
    expect(req.request.method).toBe(method);
    expect(req.request.body).toEqual(body);
    req.flush(response);
  }

  it('adds reagents to a protocol and reads back the created reagents', () => {
    TestBed.inject(ProtocolReagentService)
      .bulkAddReagents({ protocolId: 2, reagents: [{ reagentId: 5, quantity: 1.5 }] })
      .subscribe(result => expect(result.reagents.length).toBe(1));
    expectRequest('POST', '/protocol-reagents/bulk_add_reagents/',
      { protocol_id: 2, reagents: [{ reagent_id: 5, quantity: 1.5 }] },
      { message: 'ok', reagents: [{ id: 1 }] });
  });

  it('reads the protocol export link', () => {
    TestBed.inject(ProtocolService).getExportUrl(2, 7)
      .subscribe(result => expect(result.downloadUrl).toBe('http://host/x'));
    expectRequest('GET', '/protocols/2/get_export_url/?session=7', null, { download_url: 'http://host/x' });
  });

  it('lists ratings of a protocol from the ratings route', () => {
    TestBed.inject(ProtocolRatingService).getRatingsByProtocol(2).subscribe();
    expectRequest('GET', '/ratings/?protocol=2', null, { count: 0, results: [] });
  });

  it('filters ratings by complexity', () => {
    TestBed.inject(ProtocolRatingService).getRatingsByComplexity(4).subscribe();
    expectRequest('GET', '/ratings/?complexity_rating=4', null, { count: 0, results: [] });
  });

  it('sends the scaling factor of a step reagent', () => {
    TestBed.inject(StepReagentService).updateScaling(3, { scalableFactor: 2 }).subscribe();
    expectRequest('POST', '/step-reagents/3/update_scaling/', { scalable_factor: 2 }, { message: 'ok', reagent: { id: 3 } });
  });

  it('reads the annotation id after queueing a transcription', () => {
    TestBed.inject(StepAnnotationService).retriggerTranscription(4)
      .subscribe(result => expect(result.annotationId).toBe(9));
    expectRequest('POST', '/step-annotations/4/retrigger_transcription/', {}, { message: 'ok', annotation_id: 9 });
  });

  it('filters step variations by duration', () => {
    TestBed.inject(StepVariationService).getVariationsByDuration({ minDuration: 10, maxDuration: 60 }).subscribe();
    expectRequest('GET', '/step-variations/by_duration/?min_duration=10&max_duration=60', null, { count: 0, results: [] });
  });

  it('reads the remaining seconds when a timer stops', () => {
    TestBed.inject(TimeKeeperService).stopTimer(5)
      .subscribe(result => expect(result.currentDuration).toBe(30));
    expectRequest('POST', '/time-keepers/5/stop_timer/', {}, { message: 'ok', current_duration: 30, time_keeper: { id: 5 } });
  });

  it('removes a metadata column of a session annotation by column id', () => {
    TestBed.inject(SessionAnnotationService).removeMetadataColumn(6, 8).subscribe();
    expectRequest('DELETE', '/session-annotations/6/remove_metadata_column/8/', null);
  });
});
