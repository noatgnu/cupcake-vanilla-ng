import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpRequest } from '@angular/common/http';

import { PluginForm } from './plugin-form';
import { PluginWidgetDefinition } from '../../models/plugin';
import { CUPCAKE_CORE_CONFIG } from '../../services/auth';

const definition: PluginWidgetDefinition = { id: 'w1', type: 'form', endpoint: '/api/submit', fields: ['name', 'email'] };

function call(endpoint: string): (req: HttpRequest<unknown>) => boolean {
  return req => req.url.endsWith('/plugins/1/call/') && (req.method === 'POST' || req.params.get('endpoint') === endpoint);
}

describe('PluginForm', () => {
  let component: PluginForm;
  let fixture: ComponentFixture<PluginForm>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PluginForm],
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: 'http://api.test', siteName: 'Test' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PluginForm);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('definition', definition);
    fixture.componentRef.setInput('pluginId', 1);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return fields from definition', () => {
    expect(component.getFields()).toEqual(['name', 'email']);
  });

  it('should return empty string for unknown field', () => {
    expect(component.getValue('unknown')).toBe('');
  });

  it('should update form data on setValue', () => {
    component.setValue('name', 'Alice');
    expect(component.getValue('name')).toBe('Alice');
  });

  it('should POST form data on submit and set result', async () => {
    component.setValue('name', 'Alice');
    component.setValue('email', 'alice@test.com');
    component.submit();

    const req = httpMock.expectOne(call('/api/submit'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ endpoint: '/api/submit', data: { name: 'Alice', email: 'alice@test.com' } });
    req.flush({ success: true });
    await fixture.whenStable();

    expect(component.result()).toBeTruthy();
    expect(component.submitting()).toBeFalse();
  });

  it('should set error on submit failure', async () => {
    component.submit();
    httpMock.expectOne(call('/api/submit')).flush({}, { status: 400, statusText: 'Bad Request' });
    await fixture.whenStable();
    expect(component.error()).toBeTruthy();
    expect(component.submitting()).toBeFalse();
  });

  it('should not submit when endpoint is absent', () => {
    fixture.componentRef.setInput('definition', { id: 'w2', type: 'form', fields: ['x'] });
    component.submit();
    httpMock.expectNone(req => req.url.includes('/call/'));
  });
});
