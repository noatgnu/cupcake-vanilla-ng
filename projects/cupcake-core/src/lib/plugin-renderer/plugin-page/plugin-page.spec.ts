import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';

import { PluginPage } from './plugin-page';
import { PluginService } from '../../services/plugin';
import { CUPCAKE_CORE_CONFIG } from '../../services/auth';
import { Plugin } from '../../models/plugin';

const mockPlugin: Plugin = {
  id: 1,
  name: 'test-plugin',
  displayName: 'Test Plugin',
  version: '1.0.0',
  description: '',
  manifestCache: {
    name: 'test-plugin',
    displayName: 'Test Plugin',
    version: '1.0.0',
    baseUrl: 'http://plugin.local',
    pages: [
      { path: 'home', title: 'Home Page', widgets: [] },
    ],
  },
  baseUrl: 'http://plugin.local',
  isActive: true,
  registeredAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

function buildRoute(pluginId: string, pagePath: string) {
  return {
    snapshot: {
      paramMap: convertToParamMap({ pluginId, pagePath }),
    },
  };
}

describe('PluginPage', () => {
  let component: PluginPage;
  let fixture: ComponentFixture<PluginPage>;
  let pluginServiceSpy: jasmine.SpyObj<PluginService>;

  beforeEach(async () => {
    pluginServiceSpy = jasmine.createSpyObj('PluginService', ['getPlugin']);
    pluginServiceSpy.getPlugin.and.returnValue(of(mockPlugin));

    await TestBed.configureTestingModule({
      imports: [PluginPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PluginService, useValue: pluginServiceSpy },
        { provide: ActivatedRoute, useValue: buildRoute('1', 'home') },
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: 'http://api.test', siteName: 'Test' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PluginPage);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load plugin on init', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    expect(pluginServiceSpy.getPlugin).toHaveBeenCalledWith(1);
    expect(component.plugin()).toEqual(mockPlugin);
  });

  it('should resolve matching page from manifest', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.page()?.title).toBe('Home Page');
  });

  it('should set page to null when path not found', async () => {
    TestBed.overrideProvider(ActivatedRoute, { useValue: buildRoute('1', 'nonexistent') });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.page()).toBeNull();
  });

  it('should set error and stop loading on service failure', async () => {
    pluginServiceSpy.getPlugin.and.returnValue(throwError(() => new Error('Not found')));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.error()).toBeTruthy();
    expect(component.loading()).toBeFalse();
  });
});
