import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { HelpLink } from './help-link';

describe('HelpLink', () => {
  let fixture: ComponentFixture<HelpLink>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HelpLink],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(HelpLink);
    http = TestBed.inject(HttpTestingController);
  });

  it('links to the manual in a new tab when the app has one', async () => {
    http.expectOne('/help/screens.json').flush({ app: 'cupcake', version: 'latest', screens: {} });
    await fixture.whenStable();
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
    expect(link.getAttribute('href')).toBe('/help/index.html');
    expect(link.target).toBe('_blank');
  });

  it('shows nothing when the app has no manual', async () => {
    http.expectOne('/help/screens.json').flush('not found', { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('a')).toBeNull();
  });

  it('shows its label when asked to', async () => {
    fixture.componentRef.setInput('showLabel', true);
    http.expectOne('/help/screens.json').flush({ app: 'cupcake', version: 'latest', screens: {} });
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Help');
  });
});
