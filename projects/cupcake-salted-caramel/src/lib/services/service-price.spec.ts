import { TestBed } from '@angular/core/testing';

import { ServicePriceService } from './service-price';

describe('ServicePriceService', () => {
  let service: ServicePriceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServicePriceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});