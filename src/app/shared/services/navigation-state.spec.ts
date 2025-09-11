import { TestBed } from '@angular/core/testing';

import { NavigationState } from './navigation-state';

describe('NavigationState', () => {
  let service: NavigationState;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NavigationState);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
