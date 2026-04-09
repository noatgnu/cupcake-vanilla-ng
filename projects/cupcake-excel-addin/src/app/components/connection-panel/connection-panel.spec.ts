import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ConnectionPanel } from './connection-panel';
import { ConnectionService, OFFICIAL_CLOUD_URL } from '../../core/services/connection.service';
import { ToastService } from '../../core/services/toast.service';
import { environment } from '../../../environments/environment';

describe('ConnectionPanel', () => {
  let component: ConnectionPanel;
  let fixture: ComponentFixture<ConnectionPanel>;
  let httpMock: HttpTestingController;
  let connectionService: ConnectionService;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    localStorage.clear();
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'warning', 'info']);

    await TestBed.configureTestingModule({
      imports: [ConnectionPanel],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        ConnectionService,
        { provide: ToastService, useValue: toastServiceSpy }
      ]
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    connectionService = TestBed.inject(ConnectionService);
    fixture = TestBed.createComponent(ConnectionPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display official cloud URL', () => {
    expect(component.officialCloudUrl).toBe(OFFICIAL_CLOUD_URL);
    expect(component.officialCloudUrl).toBe(environment.defaultCloudUrl);
  });

  it('should default to local mode', () => {
    expect(component.mode()).toBe('local');
  });

  it('should switch to cloud mode', async () => {
    component.setMode('cloud');

    const req = httpMock.expectOne(req => req.url.includes('/auth/status/'));
    req.flush({});
    await fixture.whenStable();

    expect(component.mode()).toBe('cloud');
  });

  it('should show official badge when using official cloud URL', () => {
    connectionService.setMode('cloud');
    fixture.detectChanges();

    expect(component.isOfficialCloud()).toBeTrue();
  });

  it('should show custom badge when using custom cloud URL', () => {
    connectionService.setMode('cloud');
    connectionService.setCloudUrl('https://custom.example.com/api/v1');
    fixture.detectChanges();

    expect(component.isOfficialCloud()).toBeFalse();
  });

  it('should toggle advanced settings', () => {
    expect(component.showAdvanced()).toBeFalse();

    component.toggleAdvanced();
    expect(component.showAdvanced()).toBeTrue();

    component.toggleAdvanced();
    expect(component.showAdvanced()).toBeFalse();
  });

  it('should detect custom cloud URL', () => {
    component.customCloudUrl.set('https://custom.example.com/api/v1');
    expect(component.hasCustomCloudUrl()).toBeTrue();

    component.customCloudUrl.set(connectionService.getDefaultCloudUrl());
    expect(component.hasCustomCloudUrl()).toBeFalse();
  });

  it('should detect custom local URL', () => {
    component.customLocalUrl.set('http://192.168.1.100:8000/api/v1');
    expect(component.hasCustomLocalUrl()).toBeTrue();

    component.customLocalUrl.set(connectionService.getDefaultLocalUrl());
    expect(component.hasCustomLocalUrl()).toBeFalse();
  });

  it('should save custom URLs', async () => {
    const customCloud = 'https://custom.example.com/api/v1';
    const customLocal = 'http://192.168.1.100:8000/api/v1';

    component.customCloudUrl.set(customCloud);
    component.customLocalUrl.set(customLocal);
    component.saveUrls();

    const req = httpMock.expectOne(req => req.url.includes('/auth/status/'));
    req.flush({});
    await fixture.whenStable();

    expect(connectionService.cloudUrl()).toBe(customCloud);
    expect(connectionService.localUrl()).toBe(customLocal);
    expect(toastServiceSpy.success).toHaveBeenCalledWith('Connection settings saved');
  });

  it('should reset cloud URL to official', () => {
    connectionService.setCloudUrl('https://custom.example.com/api/v1');
    component.customCloudUrl.set('https://custom.example.com/api/v1');

    component.resetCloudUrl();

    expect(connectionService.cloudUrl()).toBe(OFFICIAL_CLOUD_URL);
    expect(component.customCloudUrl()).toBe(OFFICIAL_CLOUD_URL);
    expect(toastServiceSpy.info).toHaveBeenCalledWith('Cloud URL reset to official');
  });

  it('should reset local URL to default', () => {
    connectionService.setLocalUrl('http://192.168.1.100:8000/api/v1');
    component.customLocalUrl.set('http://192.168.1.100:8000/api/v1');

    component.resetLocalUrl();

    expect(connectionService.localUrl()).toBe(environment.defaultLocalUrl);
    expect(component.customLocalUrl()).toBe(environment.defaultLocalUrl);
    expect(toastServiceSpy.info).toHaveBeenCalledWith('Local URL reset to default');
  });

  it('should test connection and show success toast', async () => {
    component.testConnection();

    const req = httpMock.expectOne(req => req.url.includes('/auth/status/'));
    req.flush({});
    await fixture.whenStable();

    expect(toastServiceSpy.success).toHaveBeenCalledWith('Connected successfully');
  });

  it('should test connection and show error toast on failure', async () => {
    component.testConnection();

    const req = httpMock.expectOne(req => req.url.includes('/auth/status/'));
    req.error(new ErrorEvent('Network error'));
    await fixture.whenStable();

    expect(toastServiceSpy.error).toHaveBeenCalledWith('Connection failed');
  });

  it('should detect local backend', async () => {
    component.detectLocal();

    const req = httpMock.expectOne(req => req.url.includes('/auth/status/'));
    req.flush({});
    await fixture.whenStable();

    expect(connectionService.mode()).toBe('local');
    expect(toastServiceSpy.success).toHaveBeenCalledWith('Local backend detected');
  });

  it('should show warning when no local backend found', async () => {
    component.detectLocal();

    const req = httpMock.expectOne(req => req.url.includes('/auth/status/'));
    req.error(new ErrorEvent('Network error'));
    await fixture.whenStable();

    expect(toastServiceSpy.warning).toHaveBeenCalledWith('No local backend found');
  });

  it('should load current URLs when opening advanced settings', () => {
    connectionService.setCloudUrl('https://saved.example.com/api/v1');
    connectionService.setLocalUrl('http://192.168.1.50:8000/api/v1');

    component.toggleAdvanced();

    expect(component.customCloudUrl()).toBe('https://saved.example.com/api/v1');
    expect(component.customLocalUrl()).toBe('http://192.168.1.50:8000/api/v1');
  });
});
