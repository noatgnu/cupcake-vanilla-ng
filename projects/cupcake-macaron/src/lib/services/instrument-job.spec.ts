import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUPCAKE_CORE_CONFIG } from '@cupcake/core';

import { InstrumentJobService } from './instrument-job';

describe('InstrumentJobService', () => {
  let service: InstrumentJobService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        InstrumentJobService,
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: '/api' } }
      ]
    });
    service = TestBed.inject(InstrumentJobService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});