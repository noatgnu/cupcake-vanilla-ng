import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpRequest } from '@angular/common/http';

import { PluginList } from './plugin-list';
import { PluginWidgetDefinition } from '../../models/plugin';
import { CUPCAKE_CORE_CONFIG } from '../../services/auth';

const definition: PluginWidgetDefinition = { id: 'w1', type: 'list', endpoint: '/api/items', fields: ['name', 'status'] };

function call(endpoint: string): (req: HttpRequest<unknown>) => boolean {
  return req => req.url.endsWith('/plugins/1/call/') && (req.method === 'POST' || req.params.get('endpoint') === endpoint);
}

describe('PluginList', () => {
  let component: PluginList;
  let fixture: ComponentFixture<PluginList>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PluginList],
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: 'http://api.test', siteName: 'Test' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PluginList);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('definition', definition);
    fixture.componentRef.setInput('pluginId', 1);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('should create', () => {
    httpMock.expectOne(call('/api/items')).flush([]);
    expect(component).toBeTruthy();
  });

  it('should populate items from array response', async () => {
    const items = [{ name: 'A', status: 'ok' }, { name: 'B', status: 'fail' }];
    httpMock.expectOne(call('/api/items')).flush(items);
    await fixture.whenStable();
    expect(component.items().length).toBe(2);
  });

  it('should set empty array for non-array response', async () => {
    httpMock.expectOne(call('/api/items')).flush({ not: 'array' });
    await fixture.whenStable();
    expect(component.items()).toEqual([]);
  });

  it('should set error on failure', async () => {
    httpMock.expectOne(call('/api/items')).flush({}, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();
    expect(component.error()).toBeTruthy();
  });
});
