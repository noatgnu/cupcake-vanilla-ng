import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { HelpService } from './help';

@Component({ template: '' })
class Blank {}

describe('HelpService', () => {
  let service: HelpService;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'metadata-tables', component: Blank },
          { path: 'metadata-tables/:id', component: Blank },
          { path: 'home', children: [{ path: 'projects', component: Blank }] },
          { path: 'favorites', component: Blank }
        ])
      ]
    });
    service = TestBed.inject(HelpService);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => http.verify());

  function serveManual(screens: Record<string, string>) {
    http.expectOne('/help/screens.json').flush({ app: 'cupcake-vanilla', version: 'latest', screens });
  }

  it('opens the page that explains the current route', async () => {
    serveManual({ 'metadata-tables/:id': 'table-editor.html' });
    await router.navigateByUrl('/metadata-tables/12');
    expect(service.currentRoute()).toBe('metadata-tables/:id');
    expect(service.pageUrl()).toBe('/help/table-editor.html');
  });

  it('joins the paths of nested routes', async () => {
    serveManual({ 'home/projects': 'projects.html' });
    await router.navigateByUrl('/home/projects');
    expect(service.pageUrl()).toBe('/help/projects.html');
  });

  it('opens the first page for a screen no page explains', async () => {
    serveManual({});
    await router.navigateByUrl('/favorites');
    expect(service.pageUrl()).toBe('/help/index.html');
  });

  it('has no help when the app is served without its manual', () => {
    http.expectOne('/help/screens.json').flush('not found', { status: 404, statusText: 'Not Found' });
    expect(service.available()).toBeFalse();
    expect(service.pageUrl()).toBeNull();
  });
});
