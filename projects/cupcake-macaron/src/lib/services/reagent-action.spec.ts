import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUPCAKE_CORE_CONFIG } from '@noatgnu/cupcake-core';

import { ReagentActionService } from './reagent-action';

describe('ReagentActionService', () => {
  let service: ReagentActionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ReagentActionService,
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: '/api' } }
      ]
    });
    service = TestBed.inject(ReagentActionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});