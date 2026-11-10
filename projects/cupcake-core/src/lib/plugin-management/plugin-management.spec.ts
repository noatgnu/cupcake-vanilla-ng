import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { PluginManagement, STARTUP_RECHECK_MS } from './plugin-management';
import { CUPCAKE_CORE_CONFIG } from '../services/auth';
import { ConfirmDialogService } from '../services/confirm-dialog';
import { ToastService } from '../services/toast';

const API = 'http://localhost/api/v1';

const registered = [
  {
    id: 4,
    name: 'device-temperature',
    display_name: 'Device temperature',
    version: '1.0.0',
    lifecycle_status: 'running',
    progress_message: 'Above 75 °C: cpu-thermal',
    connection_verified_at: '2026-11-10T10:00:00Z',
  },
  { id: 5, name: 'remote-lims', display_name: 'Remote LIMS', version: '2.0.0', lifecycle_status: 'running', progress_message: 'Running' },
];
const installed = { plugins: [{ name: 'device-temperature', active: true, enabled: true }, { name: 'leftover', active: false, enabled: false }] };
const preview = {
  upload_id: 'a'.repeat(32),
  name: 'device-temperature',
  display_name: 'Device temperature',
  version: '1.1.0',
  description: 'Reports the temperature',
  pages: ['Device temperature'],
  vocabularies: ['Sensors'],
  installed_version: '1.0.0',
};

describe('PluginManagement', () => {
  let fixture: ComponentFixture<PluginManagement>;
  let component: PluginManagement;
  let httpMock: HttpTestingController;
  let element: HTMLElement;
  let toast: ToastService;
  let confirm: jasmine.Spy;

  beforeEach(async () => {
    confirm = jasmine.createSpy('confirm').and.resolveTo(true);
    await TestBed.configureTestingModule({
      imports: [PluginManagement],
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: API } },
        { provide: ConfirmDialogService, useValue: { confirm } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(PluginManagement);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    toast = TestBed.inject(ToastService);
    element = fixture.nativeElement;
    fixture.detectChanges();
    answerLoad();
  });

  afterEach(() => httpMock.verify());

  function answerLoad(): void {
    httpMock.expectOne(`${API}/plugins/`).flush(registered);
    httpMock.expectOne(`${API}/appliance/plugin-list/`).flush(installed);
    fixture.detectChanges();
  }

  function row(name: string): HTMLElement {
    return element.querySelector(`tr[data-plugin="${name}"]`) as HTMLElement;
  }

  function button(name: string, kind: string): HTMLButtonElement {
    return row(name).querySelector(`button.${kind}`) as HTMLButtonElement;
  }

  function choose(): void {
    const input = element.querySelector('input[type=file]') as HTMLInputElement;
    const transfer = new DataTransfer();
    transfer.items.add(new File(['x'], 'device-temperature-1.1.0.tar.gz'));
    input.files = transfer.files;
    input.dispatchEvent(new Event('change'));
  }

  it('lists registered and installed plugins together', () => {
    expect(row('device-temperature').textContent).toContain('Running');
    expect(row('device-temperature').textContent).toContain('Above 75 °C');
    expect(row('remote-lims').querySelector('.service')?.textContent).toContain('Not on this appliance');
    expect(row('leftover').querySelector('.status')?.textContent).toContain('Not registered');
  });

  it('disables actions that do not apply, with the reason', () => {
    expect(button('remote-lims', 'start').disabled).toBeTrue();
    expect(button('remote-lims', 'start').title).toContain('not installed');
    expect(button('remote-lims', 'check').disabled).toBeFalse();
    expect(button('leftover', 'check').disabled).toBeTrue();
    expect(button('leftover', 'check').title).toContain('not registered');
    expect(button('device-temperature', 'stop')).toBeTruthy();
  });

  it('shows what an uploaded package adds before installing it', () => {
    choose();
    const req = httpMock.expectOne(`${API}/appliance/plugin-upload/`);
    expect(req.request.body instanceof FormData).toBeTrue();
    req.flush(preview);
    fixture.detectChanges();
    const shown = element.querySelector('.preview')?.textContent ?? '';
    expect(shown).toContain('Device temperature');
    expect(shown).toContain('Sensors');
    expect(element.querySelector('.replaces')?.textContent).toContain('Replaces 1.0.0');
    expect(element.querySelector('button.install')?.textContent).toContain('Update');
  });

  it('installs the package and reads the plugins again once it has started', () => {
    jasmine.clock().install();
    try {
      const success = spyOn(toast, 'success');
      choose();
      httpMock.expectOne(`${API}/appliance/plugin-upload/`).flush(preview);
      fixture.detectChanges();
      (element.querySelector('button.install') as HTMLButtonElement).click();
      const req = httpMock.expectOne(`${API}/appliance/plugin-install-upload/`);
      expect(req.request.body).toEqual({ upload_id: 'a'.repeat(32) });
      req.flush({ plugin: registered[0], port: 8101 });
      expect(success).toHaveBeenCalledWith('Device temperature 1.1.0 installed on port 8101');
      answerLoad();
      jasmine.clock().tick(STARTUP_RECHECK_MS);
      answerLoad();
      expect(component.preview()).toBeNull();
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('shows why a package was refused', () => {
    const error = spyOn(toast, 'error');
    choose();
    httpMock.expectOne(`${API}/appliance/plugin-upload/`).flush(
      { error: 'The package contains a link or special file: secret' }, { status: 400, statusText: 'Bad Request' },
    );
    expect(error).toHaveBeenCalledWith('The package contains a link or special file: secret');
  });

  it('stops a running plugin through the plugin manager', () => {
    button('device-temperature', 'stop').click();
    const req = httpMock.expectOne(`${API}/appliance/plugin-control/`);
    expect(req.request.body).toEqual({ name: 'device-temperature', command: 'stop' });
    req.flush({ output: 'stop done' });
    answerLoad();
  });

  it('checks the connection of a registered plugin', () => {
    button('remote-lims', 'check').click();
    httpMock.expectOne(`${API}/plugins/5/check-connection/`).flush(registered[1]);
    answerLoad();
  });

  it('uninstalls only after confirmation', async () => {
    confirm.and.resolveTo(false);
    button('device-temperature', 'uninstall').click();
    await fixture.whenStable();
    httpMock.expectNone(`${API}/appliance/plugin-uninstall/`);

    confirm.and.resolveTo(true);
    button('device-temperature', 'uninstall').click();
    await fixture.whenStable();
    const req = httpMock.expectOne(`${API}/appliance/plugin-uninstall/`);
    expect(req.request.body).toEqual({ name: 'device-temperature' });
    req.flush({ output: 'uninstalled' });
    answerLoad();
  });
});
