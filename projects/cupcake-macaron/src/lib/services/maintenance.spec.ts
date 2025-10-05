import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUPCAKE_CORE_CONFIG } from '@noatgnu/cupcake-core';

import { MaintenanceService } from './maintenance';

describe('MaintenanceService', () => {
  let service: MaintenanceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        MaintenanceService,
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: '/api' } }
      ]
    });
    service = TestBed.inject(MaintenanceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
