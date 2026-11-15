import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Subject, Subscription } from 'rxjs';
import { WebRTCSignallingService } from './webrtc-signalling';
import {
  WebRTCMessage,
  PeerConnection,
  PeerInfo,
  PeerRole,
  PeerConnectionState,
  WebRTCConfig,
  MediaConstraintsConfig,
  ChatMessage,
  DataChannelMessage,
  FileOfferData,
  WebRTCPermissions,
  FileTransferRequest,
  FileTransferAccept,
  FileChunk,
  FileTransferProgress,
  FileTransferState
} from '../models/webrtc';

@Injectable({
  providedIn: 'root'
})
export class WebRTCService {
  private peerConnections: Map<string, PeerConnection> = new Map();
  private localStream?: MediaStream;
  private signallingSubscription?: Subscription;
  private fileTransfers: Map<string, FileTransferState> = new Map();
  private readonly DEFAULT_CHUNK_SIZE = 16384;
  private role: PeerRole = PeerRole.PARTICIPANT;

  private _localStream = new BehaviorSubject<MediaStream | null>(null);
  private _localStreamReady = new BehaviorSubject<boolean>(false);
  private _remoteStreams = new BehaviorSubject<Map<string, MediaStream>>(new Map());
  private _connectionState = new BehaviorSubject<'disconnected' | 'connecting' | 'connected'>('disconnected');
  private _activePeers = new BehaviorSubject<PeerInfo[]>([]);
  private _chatMessages = new Subject<ChatMessage>();
  private _fileTransferProgress = new Subject<FileTransferProgress>();
  private receivedFileOffers = new Map<string, FileOfferData>();
  private _dataChannelReady = new BehaviorSubject<boolean>(false);

  localStream$ = this._localStream.asObservable();
  localStreamReady$ = this._localStreamReady.asObservable();
  remoteStreams$ = this._remoteStreams.asObservable();
  connectionState$ = this._connectionState.asObservable();
  activePeers$ = this._activePeers.asObservable();
  chatMessages$ = this._chatMessages.asObservable();
  fileTransferProgress$ = this._fileTransferProgress.asObservable();
  dataChannelReady$ = this._dataChannelReady.asObservable();

  private defaultConfig: WebRTCConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ],
    iceCandidatePoolSize: 10,
    iceTransportPolicy: 'all',
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require'
  };

  private defaultMediaConstraints: MediaConstraintsConfig = {
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 }
    },
    audio: true
  };

  private screenSharing = false;

  constructor(
    private signalling: WebRTCSignallingService,
    private zone: NgZone
  ) {
    this.signalling.permissions$.subscribe(() => this.applyPermissions());
    this.signalling.peers$.subscribe(() => this.applyRemotePermissions());
  }

  private applyPermissions(): void {
    const own = this.signalling.ownPermissions;
    if (!own.screenShare && this.screenSharing) {
      this.stopScreenShare();
    }
    if (!own.video && !this.screenSharing && this.localStream?.getVideoTracks().length) {
      this.disableVideo();
    }
    if (!own.audio && this.localStream?.getAudioTracks().length) {
      this.disableAudio();
    }
    this.applyRemotePermissions();
  }

  private applyRemotePermissions(): void {
    this.peerConnections.forEach(connection => this.applyPermissionsTo(connection));
  }

  private applyPermissionsTo(connection: PeerConnection): void {
    const allowed = this.signalling.permissionsFor(connection.userId);
    const sharingScreen = this.signalling.peers.find(peer => peer.id === connection.peerId)?.hasScreenShare ?? false;
    connection.pc.getReceivers().forEach(receiver => {
      if (receiver.track.kind === 'audio') {
        receiver.track.enabled = allowed.audio;
      } else {
        receiver.track.enabled = sharingScreen ? allowed.screenShare : allowed.video;
      }
    });
  }

  private requirePermission(kind: keyof WebRTCPermissions, action: string): void {
    if (!this.signalling.ownPermissions[kind]) {
      throw new Error(`The session owner has not allowed you to ${action}`);
    }
  }

  async startSession(
    sessionId: string,
    role: PeerRole = PeerRole.PARTICIPANT,
    enableVideo: boolean = true,
    enableAudio: boolean = true,
    videoDeviceId?: string,
    audioDeviceId?: string
  ): Promise<void> {
    this.role = role;
    this._connectionState.next('connecting');

    console.log('[WebRTC] Starting session with role:', role, {enableVideo, enableAudio, videoDeviceId, audioDeviceId});

    if (enableVideo || enableAudio) {
      await this.startLocalMedia(enableVideo, enableAudio, videoDeviceId, audioDeviceId);
    }

    this.signalling.connect(sessionId);

    this.signallingSubscription = this.signalling.messages$.subscribe({
      next: (message) => {
        this.handleSignallingMessage(message);
      }
    });

    this.signalling.peerId$.subscribe(peerId => {
      if (peerId) {
        console.log('[WebRTC] Peer ID assigned, sending check with role:', role);
        this.signalling.sendCheck(role);
      }
    });

    this.signalling.peers$.subscribe(peers => {
      console.log('[WebRTC] Peers list updated:', peers);
      this._activePeers.next(peers);
    });
  }

  async startLocalMedia(
    enableVideo: boolean = true,
    enableAudio: boolean = true,
    videoDeviceId?: string,
    audioDeviceId?: string
  ): Promise<void> {
    const constraints: MediaConstraintsConfig = {
      video: enableVideo ? this.videoConstraints(videoDeviceId) : false,
      audio: enableAudio ? this.audioConstraints(audioDeviceId) : false
    };
    this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
    this._localStream.next(this.localStream);
    this._localStreamReady.next(true);
    await this.sendLocalTracksToAll();
    this.updatePeerState(undefined, enableVideo, enableAudio, false);
  }

  async startScreenShare(): Promise<void> {
    this.requirePermission('screenShare', 'share your screen');
    const screenStream: MediaStream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true, audio: false });
    const screenTrack = screenStream.getVideoTracks()[0];
    await this.useLocalTrack(screenTrack);
    this.screenSharing = true;
    this.updatePeerState(undefined, false, undefined, true);
    screenTrack.addEventListener('ended', () => this.stopScreenShare());
  }

  stopScreenShare(): void {
    if (!this.screenSharing) {
      return;
    }
    this.screenSharing = false;
    this.dropLocalTrack('video');
    this.updatePeerState(undefined, false, undefined, false);
  }

  async enableVideo(deviceId?: string): Promise<void> {
    this.requirePermission('video', 'turn on your camera');
    if (this.localStream?.getVideoTracks().length && !this.screenSharing) {
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ video: this.videoConstraints(deviceId) });
    this.screenSharing = false;
    await this.useLocalTrack(stream.getVideoTracks()[0]);
    this.updatePeerState(undefined, true, undefined, false);
  }

  async disableVideo(): Promise<void> {
    if (!this.localStream?.getVideoTracks().length || this.screenSharing) {
      return;
    }
    this.dropLocalTrack('video');
    this.updatePeerState(undefined, false, undefined, undefined);
  }

  async switchVideoDevice(deviceId: string): Promise<void> {
    if (!this.localStream?.getVideoTracks().length || this.screenSharing) {
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ video: this.videoConstraints(deviceId) });
    await this.useLocalTrack(stream.getVideoTracks()[0]);
  }

  async enableAudio(deviceId?: string): Promise<void> {
    this.requirePermission('audio', 'unmute your microphone');
    if (this.localStream?.getAudioTracks().length) {
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: this.audioConstraints(deviceId) });
    await this.useLocalTrack(stream.getAudioTracks()[0]);
    this.updatePeerState(undefined, undefined, true, undefined);
  }

  async disableAudio(): Promise<void> {
    if (!this.localStream?.getAudioTracks().length) {
      return;
    }
    this.dropLocalTrack('audio');
    this.updatePeerState(undefined, undefined, false, undefined);
  }

  async switchAudioDevice(deviceId: string): Promise<void> {
    if (!this.localStream?.getAudioTracks().length) {
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: this.audioConstraints(deviceId) });
    await this.useLocalTrack(stream.getAudioTracks()[0]);
  }

  private videoConstraints(deviceId?: string): MediaTrackConstraints {
    return {
      ...this.defaultMediaConstraints.video as MediaTrackConstraints,
      ...(deviceId ? { deviceId: { exact: deviceId } } : {})
    };
  }

  private audioConstraints(deviceId?: string): MediaTrackConstraints {
    return {
      ...(this.defaultMediaConstraints.audio as MediaTrackConstraints || {}),
      ...(deviceId ? { deviceId: { exact: deviceId } } : {})
    };
  }

  private async useLocalTrack(track: MediaStreamTrack): Promise<void> {
    if (!this.localStream) {
      this.localStream = new MediaStream();
    }
    this.localStream.getTracks().filter(existing => existing.kind === track.kind).forEach(existing => {
      existing.stop();
      this.localStream!.removeTrack(existing);
    });
    this.localStream.addTrack(track);
    this._localStream.next(this.localStream);
    this._localStreamReady.next(true);
    await this.sendLocalTracksToAll();
  }

  private dropLocalTrack(kind: 'audio' | 'video'): void {
    if (!this.localStream) {
      return;
    }
    this.localStream.getTracks().filter(track => track.kind === kind).forEach(track => {
      track.stop();
      this.localStream!.removeTrack(track);
    });
    this._localStream.next(this.localStream);
    this.sendLocalTracksToAll();
  }

  private mediaTransceiver(pc: RTCPeerConnection, kind: 'audio' | 'video'): RTCRtpTransceiver | undefined {
    return pc.getTransceivers().find(transceiver => transceiver.receiver.track.kind === kind && transceiver.currentDirection !== 'stopped');
  }

  private async sendLocalTracks(connection: PeerConnection): Promise<void> {
    for (const kind of ['audio', 'video'] as const) {
      const transceiver = this.mediaTransceiver(connection.pc, kind);
      if (!transceiver) {
        continue;
      }
      const track = this.localStream?.getTracks().find(candidate => candidate.kind === kind) ?? null;
      if (transceiver.sender.track !== track) {
        await transceiver.sender.replaceTrack(track);
      }
    }
  }

  private async sendLocalTracksToAll(): Promise<void> {
    await Promise.all([...this.peerConnections.values()].map(connection => this.sendLocalTracks(connection)));
  }

  endSession(): void {
    this.screenSharing = false;
    this.peerConnections.forEach((conn, peerId) => {
      this.closePeerConnection(peerId);
    });

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = undefined;
      this._localStream.next(null);
      this._localStreamReady.next(false);
    }

    if (this.signallingSubscription) {
      this.signallingSubscription.unsubscribe();
    }

    this.signalling.disconnect();

    this._connectionState.next('disconnected');
    this._remoteStreams.next(new Map());
    this._activePeers.next([]);

    console.log('WebRTC session ended');
  }

  private async handleSignallingMessage(message: WebRTCMessage): Promise<void> {
    try {
      console.log('[WebRTC] Received signalling message:', message.type, message);

      const normalizedMessage = this.normalizeMessage(message);

      switch (normalizedMessage.type) {
        case 'peer.check':
          if (normalizedMessage.fromPeerId) {
            console.log('[WebRTC] Handling peer check from:', normalizedMessage.fromUsername, normalizedMessage.fromPeerId);
            await this.handlePeerCheck(normalizedMessage.fromPeerId, normalizedMessage.fromUserId!, normalizedMessage.fromUsername!, normalizedMessage.peerRole!);
          }
          break;

        case 'offer':
          if (normalizedMessage.fromPeerId && normalizedMessage.sdp) {
            await this.handleOffer(normalizedMessage.fromPeerId, normalizedMessage.fromUserId!, normalizedMessage.fromUsername!, normalizedMessage.sdp);
          }
          break;

        case 'answer':
          if (normalizedMessage.fromPeerId && normalizedMessage.sdp) {
            await this.handleAnswer(normalizedMessage.fromPeerId, normalizedMessage.sdp);
          }
          break;

        case 'ice_candidate':
          if (normalizedMessage.fromPeerId && normalizedMessage.candidate) {
            await this.handleIceCandidate(normalizedMessage.fromPeerId, normalizedMessage.candidate);
          }
          break;

        case 'peer.state_update':
          this.handlePeerStateUpdate(normalizedMessage);
          break;

        case 'peer.left':
          if (normalizedMessage.fromPeerId) {
            this.handlePeerLeft(normalizedMessage.fromPeerId);
          }
          break;
      }
    } catch (error) {
      console.error('Error handling signalling message:', error);
    }
  }

  private normalizeMessage(message: any): WebRTCMessage {
    return {
      ...message,
      fromPeerId: message.from_peer_id || message.fromPeerId,
      fromUserId: message.from_user_id || message.fromUserId,
      fromUsername: message.from_username || message.fromUsername,
      peerRole: message.peer_role || message.peerRole,
      toPeerId: message.to_peer_id || message.toPeerId,
      connectionState: message.connection_state || message.connectionState,
      hasVideo: message.has_video !== undefined ? message.has_video : message.hasVideo,
      hasAudio: message.has_audio !== undefined ? message.has_audio : message.hasAudio,
      hasScreenShare: message.has_screen_share !== undefined ? message.has_screen_share : message.hasScreenShare
    } as WebRTCMessage;
  }

  private async handlePeerCheck(peerId: string, userId: number, username: string, role: PeerRole): Promise<void> {
    if (peerId === this.signalling.peerId) {
      console.log(`[WebRTC] Ignoring peer check from self: ${peerId}`);
      return;
    }

    if (!this.peerConnections.has(peerId)) {
      console.log(`[WebRTC] New peer discovered: ${username} (${peerId}) as ${role}`);

      const pc = await this.createPeerConnection(peerId, userId, username, role);

      const shouldInitiate = this.shouldInitiateConnection(peerId, role);

      if (shouldInitiate) {
        console.log(`[WebRTC] Initiating connection to ${username} (${peerId})`);
        try {
          pc.addTransceiver('audio', { direction: 'sendrecv' });
          pc.addTransceiver('video', { direction: 'sendrecv' });
          await this.sendLocalTracks(this.peerConnections.get(peerId)!);
          const offer = await pc.createOffer();
          console.log(`[WebRTC] Offer created for ${peerId}:`, offer);
          await pc.setLocalDescription(offer);
          console.log(`[WebRTC] Local description set for ${peerId}`);

          if (pc.localDescription) {
            console.log(`[WebRTC] Sending offer to ${peerId}`);
            this.signalling.sendOffer(peerId, pc.localDescription);

            const connection = this.peerConnections.get(peerId);
            if (connection) {
              connection.offered = true;
            }
            console.log(`[WebRTC] Offer sent successfully to ${peerId}`);
          }
        } catch (error) {
          console.error(`[WebRTC] Error creating/sending offer to ${peerId}:`, error);
        }
      } else {
        console.log(`[WebRTC] Waiting for ${username} (${peerId}) to initiate connection`);
      }
    } else {
      console.log(`[WebRTC] Peer connection already exists for: ${peerId}`);
    }
  }

  private async handleOffer(peerId: string, userId: number, username: string, sdp: RTCSessionDescriptionInit): Promise<void> {
    let pc: RTCPeerConnection;

    if (!this.peerConnections.has(peerId)) {
      pc = await this.createPeerConnection(peerId, userId, username, PeerRole.PARTICIPANT);
    } else {
      pc = this.peerConnections.get(peerId)!.pc;
    }

    const existing = this.peerConnections.get(peerId)!;
    const collision = existing.makingOffer || pc.signalingState !== 'stable';
    existing.ignoringOffer = collision && !this.isPolite(peerId);
    if (existing.ignoringOffer) {
      return;
    }
    if (collision) {
      await pc.setLocalDescription({ type: 'rollback' });
      existing.renegotiateWhenStable = true;
    }

    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    for (const kind of ['audio', 'video'] as const) {
      const transceiver = this.mediaTransceiver(pc, kind);
      if (transceiver && transceiver.direction !== 'sendrecv') {
        transceiver.direction = 'sendrecv';
      }
    }
    await this.sendLocalTracks(existing);

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    if (pc.localDescription) {
      this.signalling.sendAnswer(peerId, pc.localDescription);

      const connection = this.peerConnections.get(peerId);
      if (connection) {
        connection.answered = true;
      }
    }

    const connection = this.peerConnections.get(peerId);
    if (connection && connection.queuedCandidates.length > 0) {
      await Promise.all(
        connection.queuedCandidates.map(candidate => pc.addIceCandidate(candidate))
      );
      connection.queuedCandidates = [];
    }
    if (connection) {
      await this.renegotiateIfRequested(connection);
    }
  }

  private async handleAnswer(peerId: string, sdp: RTCSessionDescriptionInit): Promise<void> {
    const connection = this.peerConnections.get(peerId);
    if (!connection) {
      console.warn(`Received answer from unknown peer: ${peerId}`);
      return;
    }

    await connection.pc.setRemoteDescription(new RTCSessionDescription(sdp));

    if (connection.queuedCandidates.length > 0) {
      await Promise.all(
        connection.queuedCandidates.map(candidate => connection.pc.addIceCandidate(candidate))
      );
      connection.queuedCandidates = [];
    }
    await this.renegotiateIfRequested(connection);
  }

  private async handleIceCandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const connection = this.peerConnections.get(peerId);
    if (!connection) {
      console.warn(`Received ICE candidate from unknown peer: ${peerId}`);
      return;
    }

    const iceCandidate = new RTCIceCandidate(candidate);

    if (connection.pc.remoteDescription) {
      try {
        await connection.pc.addIceCandidate(iceCandidate);
      } catch (error) {
        if (!connection.ignoringOffer) {
          throw error;
        }
      }
    } else {
      connection.queuedCandidates.push(iceCandidate);
    }
  }

  private handlePeerStateUpdate(message: WebRTCMessage): void {
    console.log('Peer state update:', message);
  }

  private handlePeerLeft(peerId: string): void {
    console.log(`[WebRTC] Peer left: ${peerId}`);

    const connection = this.peerConnections.get(peerId);
    if (!connection) {
      console.log(`[WebRTC] No connection found for peer: ${peerId}`);
      return;
    }

    if (connection.dataChannel) {
      connection.dataChannel.close();
    }

    connection.pc.close();

    this.peerConnections.delete(peerId);

    const streams = this._remoteStreams.value;
    streams.delete(peerId);
    this._remoteStreams.next(streams);

    this.updateDataChannelReadyState();

    console.log(`[WebRTC] Cleaned up connection for peer: ${peerId}`);
  }

  private async createPeerConnection(
    peerId: string,
    userId: number,
    username: string,
    role: PeerRole
  ): Promise<RTCPeerConnection> {
    const iceServers = this.signalling.iceServers;
    const config: WebRTCConfig = iceServers.length > 0
      ? { ...this.defaultConfig, iceServers }
      : this.defaultConfig;

    const pc = new RTCPeerConnection(config);

    const dataChannel = pc.createDataChannel('data', { ordered: true });
    this.setupDataChannelHandlers(dataChannel, peerId);

    this.setupPeerConnectionHandlers(pc, peerId);

    const connection: PeerConnection = {
      peerId,
      userId,
      username,
      pc,
      dataChannel,
      role,
      offered: false,
      answered: false,
      connected: false,
      queuedCandidates: []
    };

    this.peerConnections.set(peerId, connection);

    console.log(`Created peer connection for ${username} (${peerId})`);

    return pc;
  }

  private setupPeerConnectionHandlers(pc: RTCPeerConnection, peerId: string): void {
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.signalling.sendIceCandidate(peerId, event.candidate.toJSON());
      }
    };

    pc.ontrack = (event) => {
      console.log(`Received track from peer ${peerId}:`, event.track.kind);

      this.zone.run(() => {
        const connection = this.peerConnections.get(peerId);
        const stream = connection?.stream ?? new MediaStream();
        stream.getTracks()
          .filter(track => track.kind === event.track.kind && track !== event.track)
          .forEach(track => stream.removeTrack(track));
        if (!stream.getTracks().includes(event.track)) {
          stream.addTrack(event.track);
        }
        if (connection) {
          connection.stream = stream;
          this.applyPermissionsTo(connection);
        }

        const streams = this._remoteStreams.value;
        streams.set(peerId, stream);
        this._remoteStreams.next(streams);
      });
    };

    pc.onconnectionstatechange = () => {
      console.log(`Connection state with peer ${peerId}: ${pc.connectionState}`);

      this.zone.run(() => {
        const connection = this.peerConnections.get(peerId);
        if (!connection) return;

        if (pc.connectionState === 'connected') {
          connection.connected = true;
          this._connectionState.next('connected');
          this.signalling.sendPeerState(PeerConnectionState.CONNECTED);
          console.log(`[WebRTC] Peer connection established with ${peerId}, sent state update to backend`);
        } else if (pc.connectionState === 'connecting') {
          this.signalling.sendPeerState(PeerConnectionState.CONNECTING);
        } else if (pc.connectionState === 'failed') {
          this.signalling.sendPeerState(PeerConnectionState.FAILED);
          this.closePeerConnection(peerId);
        } else if (pc.connectionState === 'disconnected') {
          this.signalling.sendPeerState(PeerConnectionState.DISCONNECTED);
          this.closePeerConnection(peerId);
        }
      });
    };

    pc.ondatachannel = (event) => {
      const receivedChannel = event.channel;
      this.setupDataChannelHandlers(receivedChannel, peerId);

      const connection = this.peerConnections.get(peerId);
      if (connection) {
        connection.dataChannel = receivedChannel;
      }
    };
  }

  private setupDataChannelHandlers(dataChannel: RTCDataChannel, peerId: string): void {
    console.log(`[WebRTC] Setting up data channel for peer ${peerId}, current state: ${dataChannel.readyState}`);

    dataChannel.onopen = () => {
      console.log(`[WebRTC] Data channel opened with peer ${peerId}`);
      this.updateDataChannelReadyState();
    };

    dataChannel.onmessage = (event) => {
      console.log(`[WebRTC] Data received from peer ${peerId}:`, event.data);
      this.handleDataChannelMessage(event.data, peerId);
    };

    dataChannel.onclose = () => {
      console.log(`[WebRTC] Data channel closed with peer ${peerId}`);
      this.updateDataChannelReadyState();
    };

    dataChannel.onerror = (error) => {
      console.error(`[WebRTC] Data channel error with peer ${peerId}:`, error);
      this.updateDataChannelReadyState();
    };
  }

  private updateDataChannelReadyState(): void {
    const connections = Array.from(this.peerConnections.values());
    const hasOpenChannel = connections.some(
      conn => conn.dataChannel && conn.dataChannel.readyState === 'open'
    );

    console.log('[WebRTC] Data channel ready state check:', {
      totalConnections: connections.length,
      channelStates: connections.map(c => ({
        peerId: c.peerId,
        hasChannel: !!c.dataChannel,
        state: c.dataChannel?.readyState
      })),
      hasOpenChannel
    });

    this._dataChannelReady.next(hasOpenChannel);
  }

  private handleDataChannelMessage(data: string | ArrayBuffer, peerId: string): void {
    if (data instanceof ArrayBuffer) {
      return;
    }

    try {
      const message: DataChannelMessage = JSON.parse(data);

      this.zone.run(() => {
        switch (message.type) {
          case 'chat':
            this.receiveChatMessage(message.data as ChatMessage, peerId);
            break;

          case 'file_request':
            this.handleFileRequest(message.data as FileTransferRequest, peerId);
            break;

          case 'file_accept':
            this.handleFileAccept(message.data as FileTransferAccept, peerId);
            break;

          case 'file_chunk':
            this.handleFileChunk(message.data as FileChunk);
            break;

          case 'file_complete':
            this.handleFileComplete(message.data.fileId);
            break;

          case 'file_cancel':
            this.handleFileCancel(message.data.fileId);
            break;

          case 'ping':
            this.sendDataChannelMessage(peerId, { type: 'pong', data: {} });
            break;

          case 'pong':
            console.log(`Received pong from peer ${peerId}`);
            break;

          default:
            console.log('Unknown data channel message type:', message.type);
        }
      });
    } catch (error) {
      console.error('Error parsing data channel message:', error);
    }
  }

  private receiveChatMessage(chatMessage: ChatMessage, peerId: string): void {
    const sender = this.peerConnections.get(peerId);
    if (!sender || !this.signalling.permissionsFor(sender.userId).chat) {
      return;
    }
    const received: ChatMessage = {
      ...chatMessage,
      peerId,
      userId: sender.userId,
      username: sender.username
    };
    if (received.fileOffer) {
      this.receivedFileOffers.set(received.fileOffer.fileId, received.fileOffer);
    }
    this._chatMessages.next(received);
  }

  sendChatMessage(message: string): void {
    if (!this.signalling.ownPermissions.chat) {
      return;
    }
    const openConnections = Array.from(this.peerConnections.values()).filter(
      conn => conn.dataChannel && conn.dataChannel.readyState === 'open'
    );

    if (openConnections.length === 0) {
      console.warn('No open data channels available');
      return;
    }

    const chatMessage: ChatMessage = {
      type: 'chat',
      peerId: this.signalling.peerId || 'unknown',
      userId: 0,
      username: 'You',
      message: message,
      timestamp: new Date().toISOString()
    };

    const dataChannelMessage: DataChannelMessage = {
      type: 'chat',
      data: chatMessage
    };

    let sentCount = 0;
    this.peerConnections.forEach((conn) => {
      if (this.sendDataChannelMessage(conn.peerId, dataChannelMessage)) {
        sentCount++;
      }
    });

    if (sentCount > 0) {
      this._chatMessages.next(chatMessage);
    } else {
      console.warn('Failed to send message to any peer');
    }
  }

  private sendDataChannelMessage(peerId: string, message: DataChannelMessage): boolean {
    const connection = this.peerConnections.get(peerId);
    if (!connection || !connection.dataChannel) {
      console.warn(`No data channel available for peer ${peerId}`);
      return false;
    }

    if (connection.dataChannel.readyState !== 'open') {
      console.warn(`Data channel not open for peer ${peerId}, state: ${connection.dataChannel.readyState}`);
      return false;
    }

    try {
      connection.dataChannel.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error(`Error sending data channel message to peer ${peerId}:`, error);
      return false;
    }
  }

  private closePeerConnection(peerId: string): void {
    const connection = this.peerConnections.get(peerId);
    if (!connection) return;

    connection.pc.close();
    this.peerConnections.delete(peerId);

    const streams = this._remoteStreams.value;
    streams.delete(peerId);
    this._remoteStreams.next(streams);

    console.log(`Closed peer connection with ${peerId}`);
  }

  private async renegotiateConnection(peerId: string): Promise<void> {
    const connection = this.peerConnections.get(peerId);
    if (!connection) {
      console.log(`[WebRTC] No connection found for peer ${peerId} to renegotiate`);
      return;
    }

    if (connection.makingOffer || connection.pc.signalingState !== 'stable') {
      connection.renegotiateWhenStable = true;
      return;
    }

    try {
      connection.makingOffer = true;
      const offer = await connection.pc.createOffer();
      await connection.pc.setLocalDescription(offer);

      if (connection.pc.localDescription) {
        this.signalling.sendOffer(peerId, connection.pc.localDescription);
      }
    } catch (error) {
      console.error(`[WebRTC] Error renegotiating connection with ${peerId}:`, error);
    } finally {
      connection.makingOffer = false;
    }
  }

  private isPolite(peerId: string): boolean {
    return (this.signalling.peerId ?? '') > peerId;
  }

  private async renegotiateIfRequested(connection: PeerConnection): Promise<void> {
    if (connection.renegotiateWhenStable && connection.pc.signalingState === 'stable') {
      connection.renegotiateWhenStable = false;
      await this.renegotiateConnection(connection.peerId);
    }
  }

  private shouldInitiateConnection(targetPeerId: string, peerRole: PeerRole): boolean {
    const myPeerId = this.signalling.peerId;
    if (!myPeerId) {
      console.log('[WebRTC] No peer ID yet, cannot determine initiation');
      return false;
    }

    const shouldInitiate = myPeerId < targetPeerId;
    console.log(`[WebRTC] Connection initiation: myId(${myPeerId.substring(0, 8)}...) < targetId(${targetPeerId.substring(0, 8)}...) = ${shouldInitiate}`);
    console.log(`[WebRTC] Roles (for info only): My role: ${this.role}, Target role: ${peerRole}`);
    return shouldInitiate;
  }

  private updatePeerState(
    connectionState?: PeerConnectionState,
    hasVideo?: boolean,
    hasAudio?: boolean,
    hasScreenShare?: boolean
  ): void {
    this.signalling.sendPeerState(connectionState, hasVideo, hasAudio, hasScreenShare);
  }

  offerFile(file: File): void {
    if (!this.signalling.ownPermissions.chat) {
      return;
    }
    const fileId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const chunkSize = this.DEFAULT_CHUNK_SIZE;
    const totalChunks = Math.ceil(file.size / chunkSize);

    const fileOffer: FileOfferData = {
      fileId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      chunkSize,
      totalChunks
    };

    const fileTransfer: FileTransferState = {
      fileId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      file,
      chunks: new Map(),
      totalChunks,
      chunkSize,
      sentChunks: 0,
      receivedChunks: 0,
      status: 'pending',
      requestedBy: new Set()
    };

    this.fileTransfers.set(fileId, fileTransfer);

    const chatMessage: ChatMessage = {
      type: 'chat',
      peerId: this.signalling.peerId || 'unknown',
      userId: 0,
      username: 'You',
      message: `📎 ${file.name} (${this.formatFileSize(file.size)})`,
      timestamp: new Date().toISOString(),
      fileOffer
    };

    const dataChannelMessage: DataChannelMessage = {
      type: 'chat',
      data: chatMessage
    };

    this.peerConnections.forEach((conn) => {
      this.sendDataChannelMessage(conn.peerId, dataChannelMessage);
    });

    this._chatMessages.next(chatMessage);

    console.log('File offered:', fileOffer);
  }

  requestFile(fileId: string): void {
    const request: FileTransferRequest = {
      type: 'file_request',
      fileId,
      requesterId: this.signalling.peerId || 'unknown'
    };

    this.peerConnections.forEach((conn) => {
      this.sendDataChannelMessage(conn.peerId, {
        type: 'file_request',
        data: request
      });
    });

    console.log('File requested:', fileId);
  }

  private handleFileRequest(request: FileTransferRequest, fromPeerId: string): void {
    const transfer = this.fileTransfers.get(request.fileId);
    if (!transfer || !transfer.file) {
      console.warn('File not found for request:', request.fileId);
      return;
    }

    transfer.requestedBy.add(fromPeerId);
    transfer.status = 'transferring';

    const accept: FileTransferAccept = {
      type: 'file_accept',
      fileId: request.fileId,
      toPeerId: request.requesterId
    };

    this.sendDataChannelMessage(fromPeerId, {
      type: 'file_accept',
      data: accept
    });

    this.startSendingFile(request.fileId, fromPeerId);
  }

  private async handleFileAccept(accept: FileTransferAccept, fromPeerId: string): Promise<void> {
    const fileOffer = this.receivedFileOffers.get(accept.fileId);
    if (!fileOffer) {
      console.error('Cannot find file offer for accepted transfer:', accept.fileId);
      return;
    }

    const transfer: FileTransferState = {
      fileId: accept.fileId,
      fileName: fileOffer.fileName,
      fileSize: fileOffer.fileSize,
      fileType: fileOffer.fileType,
      chunks: new Map(),
      totalChunks: fileOffer.totalChunks,
      chunkSize: fileOffer.chunkSize,
      sentChunks: 0,
      receivedChunks: 0,
      status: 'transferring',
      requestedBy: new Set()
    };
    this.fileTransfers.set(accept.fileId, transfer);

    let downloadStream: WritableStream<Uint8Array>;
    try {
      downloadStream = await this.createFileDownloadStream(fileOffer.fileName);
    } catch (error) {
      console.error('Failed to create download stream, assembling in memory:', error);
      return;
    }

    const writer = downloadStream.getWriter();
    if (this.fileTransfers.get(accept.fileId) !== transfer) {
      writer.abort('Transfer finished before the file could be saved');
      return;
    }
    for (let index = 0; transfer.chunks.has(index); index++) {
      writer.write(new Uint8Array(transfer.chunks.get(index)!));
    }
    transfer.chunks.clear();
    transfer.downloadStream = downloadStream;
    transfer.streamWriter = writer;
  }

  private async createFileDownloadStream(fileName: string): Promise<WritableStream<Uint8Array>> {
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: fileName,
          types: [{
            description: 'File',
            accept: { '*/*': [] }
          }]
        });

        const writable = await handle.createWritable();
        return writable;
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          throw new Error('User cancelled file save');
        }
        throw error;
      }
    }

    return this.createStreamSaverFallback(fileName);
  }

  private createStreamSaverFallback(fileName: string): WritableStream<Uint8Array> {
    let chunks: Uint8Array[] = [];

    return new WritableStream<Uint8Array>({
      write(chunk) {
        chunks.push(chunk);
      },
      close() {
        const blob = new Blob(chunks as BlobPart[]);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        chunks = [];
      },
      abort(reason) {
        console.error('Stream aborted:', reason);
        chunks = [];
      }
    });
  }

  private async startSendingFile(fileId: string, toPeerId: string): Promise<void> {
    const transfer = this.fileTransfers.get(fileId);
    if (!transfer || !transfer.file) {
      console.error('File transfer not found:', fileId);
      return;
    }

    const file = transfer.file;
    let offset = 0;
    let chunkIndex = 0;

    while (offset < file.size) {
      const chunk = file.slice(offset, offset + transfer.chunkSize);
      const arrayBuffer = await chunk.arrayBuffer();

      const fileChunk: FileChunk = {
        type: 'file_chunk',
        fileId,
        chunkIndex,
        totalChunks: transfer.totalChunks,
        data: arrayBuffer,
        isLast: offset + transfer.chunkSize >= file.size
      };

      const base64Data = this.arrayBufferToBase64(arrayBuffer);

      this.sendDataChannelMessage(toPeerId, {
        type: 'file_chunk',
        data: {
          ...fileChunk,
          data: base64Data
        }
      });

      transfer.sentChunks++;
      offset += transfer.chunkSize;
      chunkIndex++;

      await new Promise(resolve => setTimeout(resolve, 10));
    }

    this.sendDataChannelMessage(toPeerId, {
      type: 'file_complete',
      data: { fileId }
    });

    console.log('File sending completed:', fileId);
  }

  private async handleFileChunk(chunk: any): Promise<void> {
    const fileId = chunk.fileId;
    let transfer = this.fileTransfers.get(fileId);

    if (!transfer) {
      console.warn('File transfer not found:', fileId);
      return;
    }

    const arrayBuffer = this.base64ToArrayBuffer(chunk.data);
    const uint8Array = new Uint8Array(arrayBuffer);

    if (transfer.streamWriter) {
      try {
        await transfer.streamWriter.write(uint8Array);
        console.log(`Streamed chunk ${chunk.chunkIndex + 1}/${transfer.totalChunks} directly to disk`);
      } catch (error) {
        console.error('Error writing to stream, falling back to in-memory:', error);
        transfer.streamWriter = undefined;
        transfer.chunks.set(chunk.chunkIndex, arrayBuffer);
      }
    } else {
      transfer.chunks.set(chunk.chunkIndex, arrayBuffer);
    }

    transfer.receivedChunks++;

    const progress: FileTransferProgress = {
      fileId,
      fileName: transfer.fileName,
      fileSize: transfer.fileSize,
      chunksReceived: transfer.receivedChunks,
      totalChunks: transfer.totalChunks,
      bytesReceived: transfer.receivedChunks * transfer.chunkSize,
      percentage: (transfer.receivedChunks / transfer.totalChunks) * 100
    };

    this.zone.run(() => {
      this._fileTransferProgress.next(progress);
    });
  }

  private async handleFileComplete(fileId: string): Promise<void> {
    const transfer = this.fileTransfers.get(fileId);
    if (!transfer) {
      console.warn('File transfer not found:', fileId);
      return;
    }

    transfer.status = 'completed';

    if (transfer.streamWriter) {
      try {
        await transfer.streamWriter.close();
        console.log('File streamed to disk successfully:', transfer.fileName);
      } catch (error) {
        console.error('Error closing stream:', error);
      }
    } else {
      const chunks: ArrayBuffer[] = [];
      for (let i = 0; i < transfer.totalChunks; i++) {
        const chunk = transfer.chunks.get(i);
        if (chunk) {
          chunks.push(chunk);
        }
      }

      const blob = new Blob(chunks, { type: transfer.fileType });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = transfer.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('File downloaded from memory:', transfer.fileName);
    }

    this.fileTransfers.delete(fileId);
  }

  private async handleFileCancel(fileId: string): Promise<void> {
    const transfer = this.fileTransfers.get(fileId);
    if (transfer) {
      transfer.status = 'failed';

      if (transfer.streamWriter) {
        try {
          await transfer.streamWriter.abort('Transfer cancelled');
        } catch (error) {
          console.error('Error aborting stream:', error);
        }
      }

      this.fileTransfers.delete(fileId);
      console.log('File transfer cancelled:', fileId);
    }
  }

  async cancelFileTransfer(fileId: string): Promise<void> {
    const transfer = this.fileTransfers.get(fileId);
    if (!transfer) return;

    if (transfer.streamWriter) {
      try {
        await transfer.streamWriter.abort('Transfer cancelled by user');
      } catch (error) {
        console.error('Error aborting stream:', error);
      }
    }

    this.peerConnections.forEach((conn) => {
      this.sendDataChannelMessage(conn.peerId, {
        type: 'file_cancel',
        data: { fileId }
      });
    });

    this.fileTransfers.delete(fileId);
    console.log('File transfer cancelled:', fileId);
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  get localMediaStream(): MediaStream | undefined {
    return this.localStream;
  }

  get isConnected(): boolean {
    return this._connectionState.value === 'connected';
  }

  get activePeerConnections(): PeerConnection[] {
    return Array.from(this.peerConnections.values());
  }
}
