import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUPCAKE_CORE_CONFIG } from '@cupcake/core';

import { InstrumentPermissionService } from './instrument-permission';

describe('InstrumentPermissionService', () => {
  let service: InstrumentPermissionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        InstrumentPermissionService,
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: '/api' } }
      ]
    });
    service = TestBed.inject(InstrumentPermissionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});