import { TestBed } from '@angular/core/testing';
import { AuthService, CUPCAKE_CORE_CONFIG, CupcakeCoreConfig } from '@noatgnu/cupcake-core';

import { WebRTCSignallingService } from './webrtc-signalling';

describe('WebRTCSignallingService', () => {
  function serviceWith(config: CupcakeCoreConfig): WebRTCSignallingService {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { getAccessToken: () => 'token' } },
        { provide: CUPCAKE_CORE_CONFIG, useValue: config }
      ]
    });
    return TestBed.inject(WebRTCSignallingService);
  }

  function pageWebSocketOrigin(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}`;
  }

  it('connects to the page host when the API URL is relative', () => {
    const service = serviceWith({ apiUrl: '/api/v1' });
    expect(service['getBaseUrl']()).toBe(pageWebSocketOrigin());
  });

  it('connects to the API host without its path', () => {
    expect(serviceWith({ apiUrl: 'http://localhost:8123/api/v1' })['getBaseUrl']()).toBe('ws://localhost:8123');
  });

  it('uses a secure websocket for an HTTPS API', () => {
    expect(serviceWith({ apiUrl: 'https://cupcake.example.org/api/v1' })['getBaseUrl']()).toBe('wss://cupcake.example.org');
  });

  it('uses the configured websocket URL', () => {
    const service = serviceWith({ apiUrl: '/api/v1', websocketUrl: 'wss://cupcake.example.org/ws/' });
    expect(service['getBaseUrl']()).toBe('wss://cupcake.example.org/ws');
  });

  it('follows API URL changes made after the service was created', () => {
    const config: CupcakeCoreConfig = { apiUrl: 'http://localhost:8000/api/v1' };
    const service = serviceWith(config);
    config.apiUrl = 'http://localhost:8001/api/v1';
    expect(service['getBaseUrl']()).toBe('ws://localhost:8001');
  });
});
