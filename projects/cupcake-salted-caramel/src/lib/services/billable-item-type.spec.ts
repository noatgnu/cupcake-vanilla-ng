import { TestBed } from '@angular/core/testing';

import { BillableItemTypeService } from './billable-item-type';

describe('BillableItemTypeService', () => {
  let service: BillableItemTypeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BillableItemTypeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});