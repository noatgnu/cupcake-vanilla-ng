import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { CUPCAKE_CORE_CONFIG } from '@noatgnu/cupcake-core';
import { InstrumentJobService } from './instrument-job';
import { InstrumentJobAnnotationService } from './instrument-job-annotation';
import { ReagentSubscriptionService } from './reagent-subscription';

const API = 'http://localhost:8000/api/v1';

describe('Requests sent to the CUPCAKE Macaron backend', () => {
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

  it('reads the autocomplete values of earlier jobs in camelCase', () => {
    TestBed.inject(InstrumentJobService).getAutocompleteFields().subscribe(result => {
      expect(result.costCenters).toEqual(['CC-1']);
      expect(result.searchEngines).toEqual({ MaxQuant: ['2.4'] });
    });
    httpMock.expectOne(`${API}/instrument-jobs/autocomplete_fields/`)
      .flush({ funders: [], cost_centers: ['CC-1'], search_engines: { MaxQuant: ['2.4'] } });
  });

  it('reads the annotation id after queueing a transcription', () => {
    TestBed.inject(InstrumentJobAnnotationService).retriggerTranscription(3)
      .subscribe(result => expect(result.annotationId).toBe(8));
    httpMock.expectOne(`${API}/instrument-job-annotations/3/retrigger_transcription/`)
      .flush({ message: 'ok', annotation_id: 8 });
  });

  it('subscribes to a stored reagent without sending a user', () => {
    TestBed.inject(ReagentSubscriptionService)
      .createReagentSubscription({ storedReagent: 4, notifyOnLowStock: true })
      .subscribe();
    const req = httpMock.expectOne(`${API}/reagent-subscriptions/`);
    expect(req.request.body).toEqual({ stored_reagent: 4, notify_on_low_stock: true });
    req.flush({ id: 1 });
  });
});
