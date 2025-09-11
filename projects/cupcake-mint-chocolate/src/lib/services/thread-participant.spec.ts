import { TestBed } from '@angular/core/testing';

import { ThreadParticipantService } from './thread-participant';

describe('ThreadParticipantService', () => {
  let service: ThreadParticipantService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThreadParticipantService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});