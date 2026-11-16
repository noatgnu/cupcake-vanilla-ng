import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { SiteConfigService } from './site-config';
import { ThemeService } from './theme';

describe('ThemeService', () => {
  function createService(): ThemeService {
    TestBed.configureTestingModule({
      providers: [{ provide: SiteConfigService, useValue: { primaryColor: signal('#1976d2') } }]
    });
    const service = TestBed.inject(ThemeService);
    TestBed.flushEffects();
    return service;
  }

  beforeEach(() => {
    localStorage.removeItem('cupcake-palette');
    localStorage.removeItem('cupcake-theme');
    document.documentElement.classList.remove('theme-default', 'theme-eink', 'theme-scifi-compact');
  });

  afterEach(() => {
    localStorage.removeItem('cupcake-palette');
    localStorage.removeItem('cupcake-theme');
    document.documentElement.classList.remove('theme-scifi-compact');
  });

  it('applies the scifi compact palette in dark mode whatever the light or dark setting', () => {
    const service = createService();
    service.setMode('light');
    service.setPalette('scifi-compact');
    TestBed.flushEffects();
    const root = document.documentElement;
    expect(service.isDark()).toBeTrue();
    expect(root.classList.contains('theme-scifi-compact')).toBeTrue();
    expect(root.classList.contains('theme-default')).toBeFalse();
    expect(root.getAttribute('data-bs-theme')).toBe('dark');
  });

  it('remembers the scifi compact palette', () => {
    localStorage.setItem('cupcake-palette', 'scifi-compact');
    expect(createService().palette()).toBe('scifi-compact');
  });

  it('switches back from scifi compact to the chosen light or dark mode', () => {
    const service = createService();
    service.setMode('light');
    service.setPalette('scifi-compact');
    TestBed.flushEffects();
    service.setPalette('default');
    TestBed.flushEffects();
    expect(service.isDark()).toBeFalse();
    expect(document.documentElement.classList.contains('theme-scifi-compact')).toBeFalse();
  });
});
