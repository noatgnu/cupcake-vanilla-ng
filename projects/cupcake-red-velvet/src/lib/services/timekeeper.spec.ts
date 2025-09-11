import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUPCAKE_CORE_CONFIG } from '@cupcake/core';

import { TimeKeeperService } from './timekeeper';

describe('TimeKeeperService', () => {
  let service: TimeKeeperService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        TimeKeeperService,
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: '/api' } }
      ]
    });
    service = TestBed.inject(TimeKeeperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});