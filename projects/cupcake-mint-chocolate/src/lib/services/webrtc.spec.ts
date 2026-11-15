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
      pc: { getReceivers: () => [] },
      queuedCandidates: []
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

  function transceiver(kind: string, track: object | null = null) {
    return {
      currentDirection: 'sendrecv',
      receiver: { track: { kind } },
      sender: { track, replaceTrack: jasmine.createSpy(`replace ${kind}`).and.resolveTo() }
    };
  }

  it('sends local media by swapping tracks on the existing transceivers, without renegotiating', async () => {
    const camera = { kind: 'video' };
    const audio = transceiver('audio');
    const video = transceiver('video');
    service['peerConnections'].get('colleague-peer')!.pc = { getTransceivers: () => [audio, video] } as any;
    service['localStream'] = { getTracks: () => [camera] } as any;
    const renegotiate = spyOn<any>(service, 'renegotiateConnection');
    await service['sendLocalTracksToAll']();
    expect(video.sender.replaceTrack).toHaveBeenCalledWith(camera);
    expect(audio.sender.replaceTrack).not.toHaveBeenCalled();
    expect(renegotiate).not.toHaveBeenCalled();
  });

  it('stops sending a kind of media by clearing its track', async () => {
    const video = transceiver('video', { kind: 'video' });
    service['peerConnections'].get('colleague-peer')!.pc = { getTransceivers: () => [video] } as any;
    service['localStream'] = { getTracks: () => [] } as any;
    await service['sendLocalTracksToAll']();
    expect(video.sender.replaceTrack).toHaveBeenCalledWith(null);
  });

  function negotiatingConnection(signalingState: RTCSignalingState) {
    const pc = {
      signalingState,
      localDescription: { type: 'answer', sdp: 'answer' },
      setLocalDescription: jasmine.createSpy('setLocalDescription').and.callFake(async (description?: RTCSessionDescriptionInit) => {
        pc.signalingState = description?.type === 'rollback' ? 'stable' : pc.signalingState;
      }),
      setRemoteDescription: jasmine.createSpy('setRemoteDescription').and.callFake(async () => {
        pc.signalingState = 'have-remote-offer';
      }),
      getTransceivers: () => [],
      createAnswer: jasmine.createSpy('createAnswer').and.callFake(async () => {
        pc.signalingState = 'stable';
        return { type: 'answer', sdp: 'answer' };
      }),
      addIceCandidate: jasmine.createSpy('addIceCandidate')
    };
    service['peerConnections'].get('colleague-peer')!.pc = pc as any;
    return pc;
  }

  it('ignores a colliding offer on the side that is not polite', async () => {
    signalling['_peerId'].next('a-peer');
    const pc = negotiatingConnection('have-local-offer');
    const sendAnswer = spyOn(signalling, 'sendAnswer');
    await service['handleOffer']('colleague-peer', 7, 'colleague', { type: 'offer', sdp: 'offer' });
    expect(pc.setRemoteDescription).not.toHaveBeenCalled();
    expect(sendAnswer).not.toHaveBeenCalled();
  });

  it('rolls back, answers and then sends its own change again on the polite side', async () => {
    signalling['_peerId'].next('z-peer');
    const pc = negotiatingConnection('have-local-offer');
    spyOn(signalling, 'sendAnswer');
    const renegotiate = spyOn<any>(service, 'renegotiateConnection').and.resolveTo();
    await service['handleOffer']('colleague-peer', 7, 'colleague', { type: 'offer', sdp: 'offer' });
    expect(pc.setLocalDescription.calls.first().args[0]).toEqual({ type: 'rollback' });
    expect(signalling.sendAnswer).toHaveBeenCalled();
    expect(renegotiate).toHaveBeenCalledWith('colleague-peer');
  });

  it('waits for the pending answer before offering another change', async () => {
    const pc = negotiatingConnection('have-local-offer');
    (pc as any).createOffer = jasmine.createSpy('createOffer');
    await service['renegotiateConnection']('colleague-peer');
    expect((pc as any).createOffer).not.toHaveBeenCalled();
    expect(service['peerConnections'].get('colleague-peer')!.renegotiateWhenStable).toBeTrue();
  });

  it('keeps each person\'s tracks in their own stream even when the browser shares one stream between them', () => {
    service['peerConnections'].set('viewer-peer', {
      peerId: 'viewer-peer', userId: 8, username: 'viewer', role: 'viewer', queuedCandidates: [], pc: { getReceivers: () => [] }
    } as any);
    const shared = new MediaStream();
    const handlers: Record<string, any> = {};
    for (const peerId of ['colleague-peer', 'viewer-peer']) {
      const pc: any = { getReceivers: () => [] };
      service['setupPeerConnectionHandlers'](pc, peerId);
      handlers[peerId] = pc.ontrack;
    }
    const colleagueVideo = { kind: 'video', id: 'colleague-video' } as any;
    const viewerVideo = { kind: 'video', id: 'viewer-video' } as any;
    spyOn(MediaStream.prototype, 'addTrack').and.callFake(function (this: any, track: any) {
      (this.__tracks ??= []).push(track);
    });
    spyOn(MediaStream.prototype, 'getTracks').and.callFake(function (this: any) {
      return this.__tracks ?? [];
    });
    handlers['colleague-peer']({ track: colleagueVideo, streams: [shared] });
    handlers['viewer-peer']({ track: viewerVideo, streams: [shared] });
    const colleagueStream = service['peerConnections'].get('colleague-peer')!.stream!;
    const viewerStream = service['peerConnections'].get('viewer-peer')!.stream!;
    expect(colleagueStream).not.toBe(viewerStream);
    expect(colleagueStream.getTracks()).toEqual([colleagueVideo]);
    expect(viewerStream.getTracks()).toEqual([viewerVideo]);
  });
});
