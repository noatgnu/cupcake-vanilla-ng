import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUPCAKE_CORE_CONFIG } from '@noatgnu/cupcake-core';

import { SupportInformationService } from './support-information';

describe('SupportInformationService', () => {
  let service: SupportInformationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        SupportInformationService,
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: '/api' } }
      ]
    });
    service = TestBed.inject(SupportInformationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});