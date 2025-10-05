import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUPCAKE_CORE_CONFIG } from '@noatgnu/cupcake-core';

import { ProtocolService } from './protocol';

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