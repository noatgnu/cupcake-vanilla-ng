import { TestBed } from '@angular/core/testing';

import { BillingRecordService } from './billing-record';

describe('BillingRecordService', () => {
  let service: BillingRecordService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BillingRecordService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});