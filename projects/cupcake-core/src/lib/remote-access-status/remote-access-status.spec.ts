import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { RemoteAccessStatus } from './remote-access-status';
import { CUPCAKE_CORE_CONFIG } from '../services/auth';
import { ToastService } from '../services/toast';

const URL = 'http://localhost/api/v1/appliance/remote-access-status/';

const tailscale = {
  installed: true,
  configured: true,
  connected: true,
  state: 'Running',
  dns_name: 'appliance.example.ts.net',
  addresses: ['100.64.0.10'],
  online: true,
  health: ['no DERP home'],
  https_available: true,
  certificate: { name: 'appliance.example.ts.net', expires_at: '2027-02-01T00:00:00Z' },
  error: '',
};

const cloudflare = { installed: true, configured: true, active: true, connected: true, connections: 4, error: '' };

describe('RemoteAccessStatus', () => {
  let fixture: ComponentFixture<RemoteAccessStatus>;
  let httpMock: HttpTestingController;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RemoteAccessStatus],
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: 'http://localhost/api/v1' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RemoteAccessStatus);
    httpMock = TestBed.inject(HttpTestingController);
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  function answer(body: object): void {
    httpMock.expectOne(URL).flush(body);
    fixture.detectChanges();
  }

  function card(name: string): HTMLElement {
    return element.querySelector(`.${name}`) as HTMLElement;
  }

  it('shows the tailnet name, addresses and warnings of a connected appliance', () => {
    answer({ tailscale, cloudflare });
    const text = card('tailscale').textContent ?? '';
    expect(text).toContain('Connected');
    expect(text).toContain('appliance.example.ts.net');
    expect(text).toContain('100.64.0.10');
    expect(card('tailscale').querySelectorAll('.health').length).toBe(1);
  });

  it('shows the HTTPS address and certificate expiry of the Tailscale name', () => {
    answer({ tailscale, cloudflare });
    const https = card('tailscale').querySelector('.https')?.textContent ?? '';
    expect(https).toContain('https://appliance.example.ts.net/');
    expect(https).toContain('2027');
  });

  it('says how to turn on HTTPS when the tailnet issues no certificates', () => {
    answer({ tailscale: { ...tailscale, https_available: false, certificate: null }, cloudflare });
    expect(card('tailscale').querySelector('.https')?.textContent).toContain('Tailscale admin console');
  });

  it('shows a certificate on its way when the tailnet issues them', () => {
    answer({ tailscale: { ...tailscale, certificate: null }, cloudflare });
    expect(card('tailscale').querySelector('.https')?.textContent).toContain('Waiting for the certificate');
  });

  it('shows the tunnel connections', () => {
    answer({ tailscale, cloudflare });
    expect(card('cloudflare').textContent).toContain('4 connection(s) to Cloudflare');
  });

  it('shows how to set up services that are not set up', () => {
    answer({
      tailscale: { ...tailscale, configured: false, connected: false, state: 'NeedsLogin' },
      cloudflare: { ...cloudflare, configured: false, active: false, connected: false, connections: 0 },
    });
    expect(card('tailscale').textContent).toContain('configure-tailscale.sh');
    expect(card('cloudflare').textContent).toContain('configure-cloudflared.sh');
  });

  it('shows a stopped tunnel and a Tailscale that does not answer', () => {
    answer({
      tailscale: { ...tailscale, error: 'failed to connect to local tailscaled' },
      cloudflare: { ...cloudflare, active: false, connected: false },
    });
    expect(card('tailscale').textContent).toContain('failed to connect to local tailscaled');
    expect(card('cloudflare').textContent).toContain('Stopped');
  });

  it('reads the status again on refresh', () => {
    answer({ tailscale, cloudflare });
    (element.querySelector('.refresh') as HTMLButtonElement).click();
    answer({ tailscale: { ...tailscale, connected: false, state: 'Stopped' }, cloudflare });
    expect(card('tailscale').textContent).toContain('Stopped');
  });

  it('tells the user when the status cannot be read', () => {
    const toast = spyOn(TestBed.inject(ToastService), 'error');
    httpMock.expectOne(URL).flush({ detail: 'Admin access required.' }, { status: 403, statusText: 'Forbidden' });
    expect(toast).toHaveBeenCalledWith('Could not read the remote access status');
  });
});
