import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, ParamMap } from '@angular/router';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import { signal } from '@angular/core';

import { PluginPage } from './plugin-page';
import { PluginService } from '../../services/plugin';
import { CUPCAKE_CORE_CONFIG } from '../../services/auth';
import { WebSocketMessage, WebSocketService } from '../../services/websocket';
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
    nav: [{ label: 'Home', path: 'home' }],
    pages: [
      { path: 'home', title: 'Home Page', widgets: [] },
      { path: 'other', title: 'Other Page', widgets: [] },
    ],
  },
  baseUrl: 'http://plugin.local',
  isActive: true,
  lifecycleStatus: 'running',
  progressMessage: '',
  progressData: {},
  connectionVerifiedAt: '2026-01-01T00:00:00Z',
  registeredAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

let params$: BehaviorSubject<ParamMap>;

function buildRoute(pluginId: string, pagePath?: string) {
  params$ = new BehaviorSubject(convertToParamMap(pagePath === undefined ? { pluginId } : { pluginId, pagePath }));
  return { paramMap: params$.asObservable() };
}

describe('PluginPage', () => {
  let component: PluginPage;
  let fixture: ComponentFixture<PluginPage>;
  let pluginServiceSpy: jasmine.SpyObj<PluginService>;
  let socket: { isConnected: ReturnType<typeof signal<boolean>>; messages$: Subject<WebSocketMessage>; subscribe: jasmine.Spy; unsubscribe: jasmine.Spy };

  beforeEach(async () => {
    socket = {
      isConnected: signal(true),
      messages$: new Subject<WebSocketMessage>(),
      subscribe: jasmine.createSpy('subscribe'),
      unsubscribe: jasmine.createSpy('unsubscribe'),
    };
    pluginServiceSpy = jasmine.createSpyObj('PluginService', ['getPlugin']);
    pluginServiceSpy.getPlugin.and.returnValue(of(mockPlugin));

    await TestBed.configureTestingModule({
      imports: [PluginPage],
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        { provide: PluginService, useValue: pluginServiceSpy },
        { provide: WebSocketService, useValue: socket },
        { provide: ActivatedRoute, useValue: buildRoute('1', 'home') },
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: 'http://api.test', siteName: 'Test' } },
      ],
    }).compileComponents();
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(PluginPage);
    component = fixture.componentInstance;
  }

  it('should create', () => {
    createComponent();
    expect(component).toBeTruthy();
  });

  it('should load plugin on init', async () => {
    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(pluginServiceSpy.getPlugin).toHaveBeenCalledWith(1);
    expect(component.plugin()).toEqual(mockPlugin);
  });

  it('should resolve matching page from manifest', async () => {
    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.page()?.title).toBe('Home Page');
  });

  it('should set page to null when path not found', async () => {
    TestBed.overrideProvider(ActivatedRoute, { useValue: buildRoute('1', 'nonexistent') });
    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.page()).toBeNull();
  });

  it('should set error and stop loading on service failure', async () => {
    pluginServiceSpy.getPlugin.and.returnValue(throwError(() => new Error('Not found')));
    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.error()).toBeTruthy();
    expect(component.loading()).toBeFalse();
  });

  async function open(): Promise<void> {
    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('subscribes to the plugin updates once the plugin is loaded', async () => {
    await open();
    expect(socket.subscribe).toHaveBeenCalledWith('plugin_updates', { plugin_id: 1, scope: 'global' });
  });

  it('subscribes again when the connection comes back', async () => {
    await open();
    socket.isConnected.set(false);
    fixture.detectChanges();
    socket.isConnected.set(true);
    fixture.detectChanges();
    expect(socket.subscribe).toHaveBeenCalledTimes(2);
  });

  it('unsubscribes when the page closes', async () => {
    await open();
    fixture.destroy();
    expect(socket.unsubscribe).toHaveBeenCalledWith('plugin_updates', { plugin_id: 1, scope: 'global' });
  });

  it('passes widget updates of this plugin to the widgets', async () => {
    await open();
    socket.messages$.next({ type: 'plugin.message', plugin_id: 1, payload: { widget: 'w1', data: { Temperature: '51 °C' } } });
    socket.messages$.next({ type: 'plugin.message', plugin_id: 2, payload: { widget: 'w1', data: { Temperature: 'other' } } });
    socket.messages$.next({ type: 'plugin.message', plugin_id: 1, payload: { event: 'alert' } });
    expect(component.live()).toEqual({ w1: { Temperature: '51 °C' } });
    expect(component.lastUpdate()).not.toBeNull();
  });

  it('shows lifecycle changes as they happen', async () => {
    await open();
    socket.messages$.next({ type: 'plugin.lifecycle', plugin_id: 1, lifecycle_status: 'error', progress_message: 'Sensor not found' });
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('.badge')?.textContent).toContain('error');
    expect(element.querySelector('.progress-message')?.textContent).toContain('Sensor not found');
  });

  it('says when live updates are not arriving', async () => {
    socket.isConnected.set(false);
    await open();
    expect((fixture.nativeElement as HTMLElement).querySelector('.live-state')?.textContent).toContain('Not receiving live updates');
  });

  it('opens the first page when the address names none', async () => {
    TestBed.overrideProvider(ActivatedRoute, { useValue: buildRoute('1') });
    await open();
    expect(component.page()?.title).toBe('Home Page');
  });

  it('switches pages of the same plugin without reading it again', async () => {
    await open();
    params$.next(convertToParamMap({ pluginId: '1', pagePath: 'other' }));
    expect(component.page()?.title).toBe('Other Page');
    expect(pluginServiceSpy.getPlugin).toHaveBeenCalledTimes(1);
  });

  it('moves the live subscription when another plugin is opened', async () => {
    await open();
    pluginServiceSpy.getPlugin.and.returnValue(of({ ...mockPlugin, id: 2 }));
    params$.next(convertToParamMap({ pluginId: '2', pagePath: 'home' }));
    fixture.detectChanges();
    expect(socket.unsubscribe).toHaveBeenCalledWith('plugin_updates', { plugin_id: 1, scope: 'global' });
    expect(socket.subscribe).toHaveBeenCalledWith('plugin_updates', { plugin_id: 2, scope: 'global' });
  });
});
