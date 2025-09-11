import { TestBed } from '@angular/core/testing';

import { ServiceTierService } from './service-tier';

describe('ServiceTierService', () => {
  let service: ServiceTierService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServiceTierService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});