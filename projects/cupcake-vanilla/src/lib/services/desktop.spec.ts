import { TestBed } from '@angular/core/testing';

import { DesktopService } from './desktop';

describe('DesktopService', () => {
  it('signs nobody in automatically outside the desktop app', async () => {
    const service = TestBed.inject(DesktopService);
    expect(service.isDesktop).toBeFalse();
    expect(await service.getAutomaticSignIn()).toBeNull();
  });
});
