import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ConnectionService, OFFICIAL_CLOUD_URL } from './connection.service';
import { environment } from '../../../environments/environment';

describe('ConnectionService', () => {
  let service: ConnectionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        ConnectionService
      ]
    });

    service = TestBed.inject(ConnectionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have official cloud URL as default', () => {
    expect(service.cloudUrl()).toBe(environment.defaultCloudUrl);
    expect(OFFICIAL_CLOUD_URL).toBe(environment.defaultCloudUrl);
  });

  it('should have local URL as default', () => {
    expect(service.localUrl()).toBe(environment.defaultLocalUrl);
  });

  it('should default to configured mode', () => {
    expect(service.mode()).toBe(environment.defaultMode);
  });

  it('should return local URL as base URL in local mode', () => {
    service.setMode('local');
    expect(service.baseUrl()).toBe(environment.defaultLocalUrl);
  });

  it('should return cloud URL as base URL in cloud mode', () => {
    service.setMode('cloud');
    expect(service.baseUrl()).toBe(environment.defaultCloudUrl);
  });

  it('should set custom cloud URL', () => {
    const customUrl = 'https://custom.example.com/api/v1';
    service.setCloudUrl(customUrl);
    expect(service.cloudUrl()).toBe(customUrl);
  });

  it('should set custom local URL', () => {
    const customUrl = 'http://192.168.1.100:8000/api/v1';
    service.setLocalUrl(customUrl);
    expect(service.localUrl()).toBe(customUrl);
  });

  it('should reset cloud URL to official', () => {
    service.setCloudUrl('https://custom.example.com/api/v1');
    expect(service.isOfficialCloudUrl()).toBeFalse();

    service.resetCloudUrl();
    expect(service.cloudUrl()).toBe(environment.defaultCloudUrl);
    expect(service.isOfficialCloudUrl()).toBeTrue();
  });

  it('should reset local URL to default', () => {
    service.setLocalUrl('http://192.168.1.100:8000/api/v1');
    service.resetLocalUrl();
    expect(service.localUrl()).toBe(environment.defaultLocalUrl);
  });

  it('should return default URLs via getters', () => {
    expect(service.getDefaultCloudUrl()).toBe(environment.defaultCloudUrl);
    expect(service.getDefaultLocalUrl()).toBe(environment.defaultLocalUrl);
  });

  it('should detect if using official cloud URL', () => {
    expect(service.isOfficialCloudUrl()).toBeTrue();

    service.setCloudUrl('https://custom.example.com/api/v1');
    expect(service.isOfficialCloudUrl()).toBeFalse();
  });

  it('should persist mode to localStorage', () => {
    service.setMode('cloud');

    const stored = JSON.parse(localStorage.getItem(environment.storageKey) || '{}');
    expect(stored.mode).toBe('cloud');
  });

  it('should persist URLs to localStorage', () => {
    const customCloud = 'https://custom.example.com/api/v1';
    const customLocal = 'http://192.168.1.100:8000/api/v1';

    service.setCloudUrl(customCloud);
    service.setLocalUrl(customLocal);

    const stored = JSON.parse(localStorage.getItem(environment.storageKey) || '{}');
    expect(stored.cloudUrl).toBe(customCloud);
    expect(stored.localUrl).toBe(customLocal);
  });

  it('should load config from localStorage', () => {
    const config = {
      mode: 'cloud',
      cloudUrl: 'https://saved.example.com/api/v1',
      localUrl: 'http://192.168.1.50:8000/api/v1'
    };
    localStorage.setItem(environment.storageKey, JSON.stringify(config));

    const newService = new ConnectionService(TestBed.inject(HttpClient));
    expect(newService.mode()).toBe('cloud');
  });

  it('should test connection successfully', async () => {
    service.setMode('local');

    const testPromise = service.testConnection();

    const req = httpMock.expectOne(`${environment.defaultLocalUrl}/auth/status/`);
    req.flush({});

    const result = await testPromise;
    expect(result).toBeTrue();
    expect(service.isConnected()).toBeTrue();
  });

  it('should handle connection test failure', async () => {
    service.setMode('local');

    const testPromise = service.testConnection();

    const req = httpMock.expectOne(`${environment.defaultLocalUrl}/auth/status/`);
    req.error(new ErrorEvent('Network error'));

    const result = await testPromise;
    expect(result).toBeFalse();
    expect(service.isConnected()).toBeFalse();
  });

  it('should detect local backend', async () => {
    const detectPromise = service.detectLocalBackend();

    const req = httpMock.expectOne(`${environment.defaultLocalUrl}/auth/status/`);
    req.flush({});

    const result = await detectPromise;
    expect(result).toBeTrue();
  });

  it('should handle local backend detection failure', async () => {
    const detectPromise = service.detectLocalBackend();

    const req = httpMock.expectOne(`${environment.defaultLocalUrl}/auth/status/`);
    req.error(new ErrorEvent('Network error'));

    const result = await detectPromise;
    expect(result).toBeFalse();
  });
});
