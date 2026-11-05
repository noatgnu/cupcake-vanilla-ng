import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CUPCAKE_CORE_CONFIG } from '@noatgnu/cupcake-core';

import { MessageThreadService } from './message-thread';

describe('MessageThreadService', () => {
  let service: MessageThreadService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: '/api' } }
      ]
    });
    service = TestBed.inject(MessageThreadService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('marks the thread as read for the current user', () => {
    const httpMock = TestBed.inject(HttpTestingController);
    service.markThreadAsRead('abc').subscribe(result => expect(result.lastReadAt).toBe('2026-11-04T10:00:00Z'));
    const request = httpMock.expectOne('/api/threads/abc/mark_read/');
    expect(request.request.method).toBe('POST');
    request.flush({ message: 'Thread marked as read', last_read_at: '2026-11-04T10:00:00Z' });
    httpMock.verify();
  });
});
