import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUPCAKE_CORE_CONFIG } from '@cupcake/core';

import { InstrumentUsageService } from './instrument-usage';

describe('InstrumentUsageService', () => {
  let service: InstrumentUsageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        InstrumentUsageService,
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: '/api' } }
      ]
    });
    service = TestBed.inject(InstrumentUsageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});