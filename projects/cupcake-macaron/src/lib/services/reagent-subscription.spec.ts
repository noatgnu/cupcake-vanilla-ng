import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUPCAKE_CORE_CONFIG } from '@cupcake/core';

import { ReagentSubscriptionService } from './reagent-subscription';

describe('ReagentSubscriptionService', () => {
  let service: ReagentSubscriptionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ReagentSubscriptionService,
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: '/api' } }
      ]
    });
    service = TestBed.inject(ReagentSubscriptionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});