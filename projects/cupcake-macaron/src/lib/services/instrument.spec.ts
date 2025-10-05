import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUPCAKE_CORE_CONFIG } from '@noatgnu/cupcake-core';

import { InstrumentService } from './instrument';

describe('InstrumentService', () => {
  let service: InstrumentService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        InstrumentService,
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: '/api' } }
      ]
    });
    service = TestBed.inject(InstrumentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
