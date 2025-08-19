import { TestBed } from '@angular/core/testing';

import { MetadataTable } from './metadata-table';

describe('MetadataTable', () => {
  let service: MetadataTable;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MetadataTable);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
