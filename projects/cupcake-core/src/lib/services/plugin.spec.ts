import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { PluginService } from './plugin';
import { CUPCAKE_CORE_CONFIG } from './auth';
import { Plugin, PluginManifest } from '../models/plugin';

const mockConfig = { apiUrl: 'http://api.test', siteName: 'Test' };

const mockManifest: PluginManifest = {
  name: 'test-plugin',
  displayName: 'Test Plugin',
  version: '1.0.0',
  baseUrl: 'http://plugin.local',
  nav: [{ label: 'Home', path: 'home' }],
  pages: [{ path: 'home', title: 'Home', widgets: [] }],
};

const mockPlugin: Plugin = {
  id: 1,
  name: 'test-plugin',
  displayName: 'Test Plugin',
  version: '1.0.0',
  description: '',
  manifestCache: mockManifest,
  baseUrl: 'http://plugin.local',
  isActive: true,
  registeredAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('PluginService', () => {
  let service: PluginService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        PluginService,
        { provide: CUPCAKE_CORE_CONFIG, useValue: mockConfig },
      ],
    });
    service = TestBed.inject(PluginService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('listPlugins', () => {
    it('should GET /plugins/', (done) => {
      const snake = [{ id: 1, name: 'test-plugin', display_name: 'Test Plugin', version: '1.0.0', description: '', manifest_cache: {}, base_url: 'http://plugin.local', is_active: true, registered_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }];
      service.listPlugins().subscribe(plugins => {
        expect(plugins.length).toBe(1);
        expect(plugins[0].displayName).toBe('Test Plugin');
        done();
      });
      const req = httpMock.expectOne(`${mockConfig.apiUrl}/plugins/`);
      expect(req.request.method).toBe('GET');
      req.flush(snake);
    });
  });

  describe('getPlugin', () => {
    it('should GET /plugins/{id}/', (done) => {
      const snake = { id: 1, name: 'test-plugin', display_name: 'Test Plugin', version: '1.0.0', description: '', manifest_cache: {}, base_url: '', is_active: true, registered_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' };
      service.getPlugin(1).subscribe(plugin => {
        expect(plugin.id).toBe(1);
        expect(plugin.displayName).toBe('Test Plugin');
        done();
      });
      const req = httpMock.expectOne(`${mockConfig.apiUrl}/plugins/1/`);
      expect(req.request.method).toBe('GET');
      req.flush(snake);
    });
  });

  describe('getManifest', () => {
    it('should GET /plugins/{id}/manifest/', (done) => {
      const snake = { name: 'test-plugin', display_name: 'Test Plugin', version: '1.0.0', base_url: 'http://plugin.local' };
      service.getManifest(1).subscribe(manifest => {
        expect((manifest as any).displayName).toBe('Test Plugin');
        done();
      });
      const req = httpMock.expectOne(`${mockConfig.apiUrl}/plugins/1/manifest/`);
      expect(req.request.method).toBe('GET');
      req.flush(snake);
    });
  });

  describe('register', () => {
    it('should POST /plugins/register/ with snake_case body', (done) => {
      const snake = { id: 2, name: 'new-plugin', display_name: 'New Plugin', version: '1.0.0', description: '', manifest_cache: {}, base_url: '', is_active: true, registered_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' };
      service.register({ name: 'new-plugin', version: '1.0.0' }).subscribe(plugin => {
        expect(plugin.id).toBe(2);
        done();
      });
      const req = httpMock.expectOne(`${mockConfig.apiUrl}/plugins/register/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.name).toBe('new-plugin');
      expect(req.request.body.version).toBe('1.0.0');
      req.flush(snake);
    });

    it('should include manifest in request body', (done) => {
      const manifest = { name: 'x', displayName: 'X', version: '1.0.0', baseUrl: '' };
      service.register({ name: 'x', version: '1.0.0', manifest }).subscribe(() => done());
      const req = httpMock.expectOne(`${mockConfig.apiUrl}/plugins/register/`);
      expect(req.request.body.manifest).toBeDefined();
      req.flush({ id: 3, name: 'x', display_name: 'X', version: '1.0.0', description: '', manifest_cache: {}, base_url: '', is_active: true, registered_at: '', updated_at: '' });
    });
  });

  describe('broadcast', () => {
    it('should POST /plugins/{id}/broadcast/ with snake_case body', (done) => {
      service.broadcast(1, { scope: 'global', payload: { key: 'value' } }).subscribe(result => {
        expect(result.sent).toBeTrue();
        done();
      });
      const req = httpMock.expectOne(`${mockConfig.apiUrl}/plugins/1/broadcast/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.scope).toBe('global');
      req.flush({ sent: true, group: 'plugin__1__global' });
    });

    it('should send lab_group_id in snake_case', (done) => {
      service.broadcast(1, { scope: 'lab_group', payload: {}, labGroupId: 5 }).subscribe(() => done());
      const req = httpMock.expectOne(`${mockConfig.apiUrl}/plugins/1/broadcast/`);
      expect(req.request.body.lab_group_id).toBe(5);
      req.flush({ sent: true, group: 'plugin__1__lab_group_5' });
    });
  });

  describe('deletePlugin', () => {
    it('should DELETE /plugins/{id}/', (done) => {
      service.deletePlugin(1).subscribe(() => done());
      const req = httpMock.expectOne(`${mockConfig.apiUrl}/plugins/1/`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('patchPlugin', () => {
    it('should PATCH /plugins/{id}/ with snake_case body', (done) => {
      const snake = { id: 1, name: 'test-plugin', display_name: 'Test Plugin', version: '1.0.0', description: '', manifest_cache: {}, base_url: '', is_active: false, registered_at: '', updated_at: '' };
      service.patchPlugin(1, { isActive: false } as any).subscribe(plugin => {
        expect(plugin.isActive).toBeFalse();
        done();
      });
      const req = httpMock.expectOne(`${mockConfig.apiUrl}/plugins/1/`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body.is_active).toBeFalse();
      req.flush(snake);
    });
  });

  describe('error handling', () => {
    it('should propagate HTTP errors', (done) => {
      service.listPlugins().subscribe({
        next: () => fail('expected error'),
        error: err => { expect(err.status).toBe(500); done(); },
      });
      httpMock.expectOne(`${mockConfig.apiUrl}/plugins/`).flush({}, { status: 500, statusText: 'Internal Server Error' });
    });
  });
});
