import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpRequest } from '@angular/common/http';

import { PluginTable } from './plugin-table';
import { PluginWidgetDefinition } from '../../models/plugin';
import { CUPCAKE_CORE_CONFIG } from '../../services/auth';

const definition: PluginWidgetDefinition = { id: 'w1', type: 'table', endpoint: '/api/rows', columns: ['id', 'name'] };

function call(endpoint: string): (req: HttpRequest<unknown>) => boolean {
  return req => req.url.endsWith('/plugins/1/call/') && (req.method === 'POST' || req.params.get('endpoint') === endpoint);
}

describe('PluginTable', () => {
  let component: PluginTable;
  let fixture: ComponentFixture<PluginTable>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PluginTable],
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: 'http://api.test', siteName: 'Test' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PluginTable);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('definition', definition);
    fixture.componentRef.setInput('pluginId', 1);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('should create', () => {
    httpMock.expectOne(call('/api/rows')).flush([]);
    expect(component).toBeTruthy();
  });

  it('should populate rows from array response', async () => {
    const rows = [{ id: 1, name: 'Alpha' }, { id: 2, name: 'Beta' }];
    httpMock.expectOne(call('/api/rows')).flush(rows);
    await fixture.whenStable();
    expect(component.rows().length).toBe(2);
  });

  it('should set empty rows for non-array response', async () => {
    httpMock.expectOne(call('/api/rows')).flush({ not: 'array' });
    await fixture.whenStable();
    expect(component.rows()).toEqual([]);
  });

  it('should set error on HTTP failure', async () => {
    httpMock.expectOne(call('/api/rows')).flush({}, { status: 500, statusText: 'Error' });
    await fixture.whenStable();
    expect(component.error()).toBeTruthy();
  });
});
