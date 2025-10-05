import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUPCAKE_CORE_CONFIG } from '@noatgnu/cupcake-core';

import { SessionService } from './session';

describe('SessionService', () => {
  let service: SessionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        SessionService,
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: '/api' } }
      ]
    });
    service = TestBed.inject(SessionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});