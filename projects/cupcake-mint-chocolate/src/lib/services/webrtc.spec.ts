import { TestBed } from '@angular/core/testing';
import { AuthService, CUPCAKE_CORE_CONFIG } from '@noatgnu/cupcake-core';

import { ChatMessage } from '../models/webrtc';
import { WebRTCService } from './webrtc';
import { WebRTCSignallingService } from './webrtc-signalling';

describe('WebRTCService', () => {
  let service: WebRTCService;
  let signalling: WebRTCSignallingService;
  let received: ChatMessage[];
  const everything = { audio: true, video: true, screen_share: true, chat: true };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { getAccessToken: () => 'token' } },
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: '/api/v1' } }
      ]
    });
    service = TestBed.inject(WebRTCService);
    signalling = TestBed.inject(WebRTCSignallingService);
    signalling['handleConnectionEstablished']({ peer_id: 'own-peer', user_id: 1, permissions: { '1': everything, '7': everything } });
    service['peerConnections'].set('colleague-peer', {
      peerId: 'colleague-peer',
      userId: 7,
      username: 'colleague',
      role: 'participant',
      pc: { getReceivers: () => [] }
    } as any);
    received = [];
    service.chatMessages$.subscribe(message => received.push(message));
  });

  function deliver(data: object): void {
    service['handleDataChannelMessage'](JSON.stringify({ type: 'chat', data }), 'colleague-peer');
  }

  function setPermissions(userId: number, flags: Partial<typeof everything>): void {
    signalling['handlePeerPermissions']({
      user_id: userId,
      permissions: { ...everything, ...flags },
      overrides: { audio: null, video: null, screen_share: null, chat: null, ...flags },
      changed_by: 'owner'
    });
  }

  it('names the sender of a chat message from the signalling server', () => {
    deliver({ type: 'chat', peerId: 'spoofed', userId: 0, username: 'You', message: 'hello', timestamp: '2026-11-13T17:00:00Z' });
    expect(received.map(message => [message.peerId, message.userId, message.username, message.message])).toEqual([
      ['colleague-peer', 7, 'colleague', 'hello']
    ]);
  });

  it('remembers file offers so an accepted transfer can be received', () => {
    const fileOffer = { fileId: 'file-1', fileName: 'data.bin', fileSize: 10, fileType: '', chunkSize: 16384, totalChunks: 1 };
    deliver({ type: 'chat', peerId: 'colleague-peer', userId: 0, username: 'You', message: 'data.bin', timestamp: '', fileOffer });
    expect(service['receivedFileOffers'].get('file-1')).toEqual(fileOffer);
  });

  it('ignores chat from people the session owner has not allowed to chat', () => {
    setPermissions(7, { chat: false });
    deliver({ type: 'chat', peerId: 'colleague-peer', userId: 0, username: 'You', message: 'muted', timestamp: '' });
    expect(received).toEqual([]);
  });

  it('refuses the camera, microphone and screen sharing when they are not allowed', async () => {
    setPermissions(1, { audio: false, video: false, screen_share: false });
    await expectAsync(service.enableVideo()).toBeRejectedWithError('The session owner has not allowed you to turn on your camera');
    await expectAsync(service.enableAudio()).toBeRejectedWithError('The session owner has not allowed you to unmute your microphone');
    await expectAsync(service.startScreenShare()).toBeRejectedWithError('The session owner has not allowed you to share your screen');
  });

  it('switches off incoming media of a kind the sender is not allowed to send', () => {
    const audio = { kind: 'audio', enabled: true };
    const video = { kind: 'video', enabled: true };
    service['peerConnections'].get('colleague-peer')!.pc = { getReceivers: () => [{ track: audio }, { track: video }] } as any;
    setPermissions(7, { audio: false });
    expect([audio.enabled, video.enabled]).toEqual([false, true]);
    setPermissions(7, { audio: true });
    expect(audio.enabled).toBeTrue();
  });
});
