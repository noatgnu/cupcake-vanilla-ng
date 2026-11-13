import { Injectable, NgZone, Inject, Optional } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { BehaviorSubject, Subject, Subscription, timer } from 'rxjs';
import { AuthService, CUPCAKE_CORE_CONFIG, CupcakeCoreConfig } from '@noatgnu/cupcake-core';
import {
  WebRTCMessage,
  PeerInfo,
  PeerRole,
  PeerConnectionState,
  WebRTCPermissions,
  WebRTCPermissionOverrides,
  WebRTCPermissionChange
} from '../models/webrtc';

const PERMISSION_FIELDS: Record<keyof WebRTCPermissions, string> = {
  audio: 'audio',
  video: 'video',
  screenShare: 'screen_share',
  chat: 'chat'
};

function fromServer<T>(flags: Record<string, T>): Record<keyof WebRTCPermissions, T> {
  return {
    audio: flags['audio'],
    video: flags['video'],
    screenShare: flags['screen_share'],
    chat: flags['chat']
  };
}

@Injectable({
  providedIn: 'root'
})
export class WebRTCSignallingService {
  private ws?: WebSocketSubject<WebRTCMessage>;
  private wsSubscription?: Subscription;
  private baseUrl: string = '';
  private clientPeerId: string | null = null;
  private readonly CLIENT_PEER_ID_KEY = 'webrtc_client_peer_id';
  private shouldReconnect: boolean = true;

  private _connected = new BehaviorSubject<boolean>(false);
  private _peerId = new BehaviorSubject<string | null>(null);
  private _sessionId = new BehaviorSubject<string | null>(null);
  private _peers = new BehaviorSubject<PeerInfo[]>([]);
  private _messages = new Subject<WebRTCMessage>();
  private _iceServers = new BehaviorSubject<RTCIceServer[]>([]);
  private _userId = new BehaviorSubject<number | null>(null);
  private _readOnly = new BehaviorSubject<boolean>(false);
  private _canModerate = new BehaviorSubject<boolean>(false);
  private _permissions = new BehaviorSubject<Map<number, WebRTCPermissions>>(new Map());
  private _overrides = new BehaviorSubject<Map<number, WebRTCPermissionOverrides>>(new Map());
  private _permissionChanges = new Subject<WebRTCPermissionChange>();

  connected$ = this._connected.asObservable();
  peerId$ = this._peerId.asObservable();
  sessionId$ = this._sessionId.asObservable();
  peers$ = this._peers.asObservable();
  messages$ = this._messages.asObservable();
  iceServers$ = this._iceServers.asObservable();
  readOnly$ = this._readOnly.asObservable();
  canModerate$ = this._canModerate.asObservable();
  permissions$ = this._permissions.asObservable();
  overrides$ = this._overrides.asObservable();
  permissionChanges$ = this._permissionChanges.asObservable();

  constructor(
    private authService: AuthService,
    private zone: NgZone,
    @Optional() @Inject(CUPCAKE_CORE_CONFIG) private config: CupcakeCoreConfig | null
  ) {}

  private getBaseUrl(): string {
    if (this.config?.websocketUrl) {
      return this.config.websocketUrl.replace(/\/$/, '');
    }
    const api = new URL(this.config?.apiUrl || '/', window.location.href);
    const protocol = api.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${api.host}`;
  }

  connect(sessionId: string): void {
    this.disconnect();
    this.shouldReconnect = true;

    const token = this.authService.getAccessToken();
    if (!token) {
      console.error('No authentication token available');
      return;
    }

    this.clientPeerId = this.getClientPeerId();
    this.baseUrl = this.getBaseUrl();

    const wsPath = this.baseUrl.endsWith('/ws') ? '' : '/ws';
    let wsUrl = `${this.baseUrl}${wsPath}/ccmc/webrtc/${sessionId}/?token=${token}`;

    if (this.clientPeerId) {
      wsUrl += `&client_peer_id=${this.clientPeerId}`;
      console.log('[Signalling] Reconnecting with client peer ID:', this.clientPeerId);
    } else {
      console.log('[Signalling] First connection, no client peer ID');
    }

    console.log('[Signalling] Base URL:', this.baseUrl);
    console.log('[Signalling] Connecting to WebSocket URL:', wsUrl.replace(/token=[^&]+/, 'token=***'));

    this.ws = webSocket<WebRTCMessage>({
      url: wsUrl,
      openObserver: {
        next: () => {
          console.log('WebRTC signalling connection opened');
          this.zone.run(() => {
            this._connected.next(true);
          });
        }
      },
      closeObserver: {
        next: (event: CloseEvent) => {
          console.log(`WebRTC signalling connection closed: ${event.code} ${event.reason}`);

          if (event.code === 4001) {
            console.error('WebRTC authentication failed - token invalid, please re-login');
            this.shouldReconnect = false;
            this.zone.run(() => {
              this.authService.logout().subscribe({
                next: () => {
                  console.log('Logged out due to WebRTC authentication failure');
                },
                error: (err) => {
                  console.error('Error during logout, forcing logout:', err);
                }
              });
            });
            return;
          } else if (event.code === 4003) {
            console.error('WebRTC permission denied');
            this.shouldReconnect = false;
          }

          this.zone.run(() => {
            this._connected.next(false);
            this._peerId.next(null);
          });
        }
      },
      deserializer: msg => {
        try {
          return JSON.parse(msg.data);
        } catch (e) {
          console.error('Error parsing WebSocket message:', e);
          return msg.data;
        }
      }
    });

    this.wsSubscription = this.ws.subscribe({
      next: (message: WebRTCMessage) => {
        this.zone.run(() => {
          this.handleMessage(message);
        });
      },
      error: (error) => {
        console.error('WebRTC signalling error:', error);
        console.error('Error details:', {
          message: error?.message,
          code: error?.code,
          type: error?.type,
          target: error?.target?.url
        });
        this.zone.run(() => {
          this._connected.next(false);
        });

        if (this.shouldReconnect && this._sessionId.value) {
          console.log('Attempting to reconnect in 5 seconds...');
          timer(5000).subscribe(() => {
            if (this.shouldReconnect && this._sessionId.value) {
              console.log('Reconnecting to WebRTC signalling...');
              this.connect(this._sessionId.value);
            }
          });
        } else {
          console.log('Reconnection disabled due to authentication error');
        }
      },
      complete: () => {
        console.log('WebRTC signalling connection completed');
        this.zone.run(() => {
          this._connected.next(false);
        });
      }
    });
  }

  disconnect(): void {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
      this.wsSubscription = undefined;
    }

    if (this.ws) {
      this.ws.complete();
      this.ws = undefined;
    }

    this._connected.next(false);
    this._peerId.next(null);
    this._sessionId.next(null);
    this._peers.next([]);
    this._userId.next(null);
    this._readOnly.next(false);
    this._canModerate.next(false);
    this._permissions.next(new Map());
    this._overrides.next(new Map());
  }

  setPermissions(userId: number, changes: Partial<WebRTCPermissionOverrides>): void {
    const message: Record<string, unknown> = { type: 'set_permissions', user_id: userId };
    (Object.keys(changes) as (keyof WebRTCPermissions)[]).forEach(kind => {
      message[PERMISSION_FIELDS[kind]] = changes[kind];
    });
    this.send(message);
  }

  permissionsFor(userId: number): WebRTCPermissions {
    return this._permissions.value.get(userId) ?? { audio: true, video: true, screenShare: true, chat: true };
  }

  overridesFor(userId: number): WebRTCPermissionOverrides {
    return this._overrides.value.get(userId) ?? { audio: null, video: null, screenShare: null, chat: null };
  }

  get ownPermissions(): WebRTCPermissions {
    const userId = this._userId.value;
    return userId === null ? { audio: true, video: true, screenShare: true, chat: true } : this.permissionsFor(userId);
  }

  get readOnly(): boolean {
    return this._readOnly.value;
  }

  get canModerate(): boolean {
    return this._canModerate.value;
  }

  private storePermissions(userId: number, permissions: Record<string, boolean>, overrides?: Record<string, boolean | null>): void {
    const allPermissions = new Map(this._permissions.value);
    allPermissions.set(userId, fromServer(permissions));
    this._permissions.next(allPermissions);
    if (overrides) {
      const allOverrides = new Map(this._overrides.value);
      allOverrides.set(userId, fromServer(overrides));
      this._overrides.next(allOverrides);
    }
  }

  sendCheck(peerRole: PeerRole = PeerRole.PARTICIPANT): void {
    console.log('[Signalling] Sending check with role:', peerRole);
    this.send({
      type: 'check',
      peer_role: peerRole
    } as any);
  }

  sendOffer(toPeerId: string, sdp: RTCSessionDescriptionInit): void {
    this.send({
      type: 'offer',
      to_peer_id: toPeerId,
      sdp: sdp
    } as any);
  }

  sendAnswer(toPeerId: string, sdp: RTCSessionDescriptionInit): void {
    this.send({
      type: 'answer',
      to_peer_id: toPeerId,
      sdp: sdp
    } as any);
  }

  sendIceCandidate(toPeerId: string, candidate: RTCIceCandidateInit): void {
    this.send({
      type: 'ice_candidate',
      to_peer_id: toPeerId,
      candidate: candidate
    } as any);
  }

  sendPeerState(
    connectionState?: PeerConnectionState,
    hasVideo?: boolean,
    hasAudio?: boolean,
    hasScreenShare?: boolean
  ): void {
    this.send({
      type: 'peer_state',
      connection_state: connectionState,
      has_video: hasVideo,
      has_audio: hasAudio,
      has_screen_share: hasScreenShare
    } as any);
  }

  private send(message: any): void {
    if (!this.ws) {
      console.error('WebSocket not connected');
      return;
    }

    try {
      this.ws.next(message);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  private handleMessage(message: WebRTCMessage): void {
    console.log('[Signalling] Received message:', message.type, message);
    switch (message.type) {
      case 'connection.established':
        this.handleConnectionEstablished(message);
        break;

      case 'check.response':
        this.handleCheckResponse(message);
        break;

      case 'peer.joined':
        this.handlePeerJoined(message);
        break;

      case 'peer.left':
        this.handlePeerLeft(message);
        break;

      case 'peer.check':
      case 'offer':
      case 'answer':
      case 'ice_candidate':
        console.log('[Signalling] Forwarding message to WebRTC service:', message.type);
        this._messages.next(message);
        break;

      case 'peer.state_update':
        this.handlePeerStateUpdate(message);
        break;

      case 'peer.permissions':
        this.handlePeerPermissions(message);
        break;

      case 'error':
        console.error('WebRTC signalling error:', message.message);
        break;

      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  private handleConnectionEstablished(message: any): void {
    const peerId = message.peer_id || message.peerId;
    const sessionId = message.session_id || message.sessionId;
    const clientPeerId = message.client_peer_id || message.clientPeerId;
    const isReconnection = message.is_reconnection !== undefined ? message.is_reconnection : message.isReconnection;
    const iceServers = message.ice_servers || message.iceServers;

    if (peerId) {
      this._peerId.next(peerId);
      console.log('[Signalling] Peer ID assigned:', peerId);
    }
    if (sessionId) {
      this._sessionId.next(sessionId);
      console.log('[Signalling] Session ID assigned:', sessionId);
    }
    if (clientPeerId) {
      this.setClientPeerId(clientPeerId);
      console.log('[Signalling] Client Peer ID received:', clientPeerId);
    }
    if (isReconnection !== undefined) {
      console.log('[Signalling] Is reconnection:', isReconnection);
    }
    if (iceServers) {
      this._iceServers.next(iceServers);
      console.log('[Signalling] ICE servers received:', iceServers);
    }
    if (message.user_id !== undefined) {
      this._userId.next(message.user_id);
    }
    this._readOnly.next(message.read_only === true);
    this._canModerate.next(message.can_moderate === true);
    if (message.permissions) {
      const permissions = new Map<number, WebRTCPermissions>();
      Object.entries(message.permissions as Record<string, Record<string, boolean>>).forEach(([userId, flags]) => {
        permissions.set(Number(userId), fromServer(flags));
      });
      this._permissions.next(permissions);
    }
    console.log('[Signalling] WebRTC connection established:', message);
  }

  private handleCheckResponse(message: WebRTCMessage): void {
    console.log('[Signalling] Received check.response with peers:', message.peers);
    if (message.peers) {
      const normalizedPeers = message.peers
        .map((peer: any) => ({
          id: peer.id,
          userId: peer.user_id || peer.userId,
          username: peer.username,
          peerRole: peer.peer_role || peer.peerRole,
          connectionState: peer.connection_state || peer.connectionState,
          hasVideo: peer.has_video !== undefined ? peer.has_video : peer.hasVideo,
          hasAudio: peer.has_audio !== undefined ? peer.has_audio : peer.hasAudio,
          hasScreenShare: peer.has_screen_share !== undefined ? peer.has_screen_share : peer.hasScreenShare
        }))
        .filter(peer => {
          if (peer.id === this._peerId.value) {
            console.log('[Signalling] Filtering out self from peer list:', peer.id);
            return false;
          }
          if (peer.connectionState === 'disconnected') {
            console.log('[Signalling] Filtering out disconnected peer:', peer.username, peer.id);
            return false;
          }
          return true;
        });

      this._peers.next(normalizedPeers);
      console.log('[Signalling] Peer list updated, active count:', normalizedPeers.length);

      normalizedPeers.forEach(peer => {
        console.log('[Signalling] Discovered peer from check.response:', peer.username, peer.id, 'userId:', peer.userId, 'role:', peer.peerRole, 'state:', peer.connectionState);
        const peerCheckMessage: WebRTCMessage = {
          type: 'peer.check',
          fromPeerId: peer.id,
          fromUserId: peer.userId,
          fromUsername: peer.username,
          peerRole: peer.peerRole
        };
        this._messages.next(peerCheckMessage);
      });
    } else {
      console.log('[Signalling] No peers in check.response');
    }
  }

  private handlePeerJoined(message: any): void {
    const peerId = message.peer_id || message.peerId;
    const userId = message.user_id || message.userId;
    const username = message.username;

    console.log('[Signalling] Peer joined:', username, peerId, 'userId:', userId);

    const newPeer: PeerInfo = {
      id: peerId,
      userId: userId,
      username: username,
      peerRole: PeerRole.PARTICIPANT,
      connectionState: PeerConnectionState.CONNECTING,
      hasVideo: false,
      hasAudio: false,
      hasScreenShare: false
    };

    if (message.permissions) {
      this.storePermissions(userId, message.permissions);
    }

    const currentPeers = this._peers.value;
    if (!currentPeers.find(p => p.id === peerId)) {
      this._peers.next([...currentPeers, newPeer]);
    }

    const peerCheckMessage: WebRTCMessage = {
      type: 'peer.check',
      fromPeerId: peerId,
      fromUserId: userId,
      fromUsername: username,
      peerRole: PeerRole.PARTICIPANT
    };
    this._messages.next(peerCheckMessage);
  }

  private handlePeerLeft(message: any): void {
    const peerId = message.peer_id || message.peerId;
    const userId = message.user_id || message.userId;
    const username = message.username;

    console.log('[Signalling] Peer left:', username, peerId, 'userId:', userId);

    const currentPeers = this._peers.value;
    const filteredPeers = currentPeers.filter(p => p.id !== peerId);
    if (filteredPeers.length !== currentPeers.length) {
      this._peers.next(filteredPeers);
    }

    this._messages.next({
      type: 'peer.left',
      fromPeerId: peerId,
      fromUserId: userId,
      fromUsername: username
    });
  }

  private handlePeerStateUpdate(message: any): void {
    const peerId = message.peer_id || message.from_peer_id || message.fromPeerId || message.peerId;
    const connectionState = message.connection_state || message.connectionState;
    const hasVideo = message.has_video !== undefined ? message.has_video : message.hasVideo;
    const hasAudio = message.has_audio !== undefined ? message.has_audio : message.hasAudio;
    const hasScreenShare = message.has_screen_share !== undefined ? message.has_screen_share : message.hasScreenShare;

    console.log('[Signalling] Peer state update for peer:', peerId, {connectionState, hasVideo, hasAudio, hasScreenShare});

    if (!peerId) {
      console.error('[Signalling] No peer ID in state update message:', message);
      return;
    }

    const currentPeers = this._peers.value;
    const updatedPeers = currentPeers.map(peer => {
      if (peer.id === peerId) {
        return {
          ...peer,
          connectionState: connectionState !== undefined ? connectionState : peer.connectionState,
          hasVideo: hasVideo !== undefined ? hasVideo : peer.hasVideo,
          hasAudio: hasAudio !== undefined ? hasAudio : peer.hasAudio,
          hasScreenShare: hasScreenShare !== undefined ? hasScreenShare : peer.hasScreenShare
        };
      }
      return peer;
    });

    this._peers.next(updatedPeers);
    this._messages.next(message);
  }

  private handlePeerPermissions(message: any): void {
    const userId: number = message.user_id;
    this.storePermissions(userId, message.permissions, message.overrides);
    this._permissionChanges.next({
      userId,
      permissions: fromServer(message.permissions),
      overrides: fromServer(message.overrides),
      changedBy: message.changed_by
    });
  }

  get peerId(): string | null {
    return this._peerId.value;
  }

  get sessionId(): string | null {
    return this._sessionId.value;
  }

  get connected(): boolean {
    return this._connected.value;
  }

  get peers(): PeerInfo[] {
    return this._peers.value;
  }

  get iceServers(): RTCIceServer[] {
    return this._iceServers.value;
  }

  private getClientPeerId(): string | null {
    try {
      return sessionStorage.getItem(this.CLIENT_PEER_ID_KEY);
    } catch (error) {
      console.error('[Signalling] Error reading client peer ID from sessionStorage:', error);
      return null;
    }
  }

  private setClientPeerId(clientPeerId: string): void {
    try {
      sessionStorage.setItem(this.CLIENT_PEER_ID_KEY, clientPeerId);
      this.clientPeerId = clientPeerId;
    } catch (error) {
      console.error('[Signalling] Error saving client peer ID to sessionStorage:', error);
    }
  }

  clearClientPeerId(): void {
    try {
      sessionStorage.removeItem(this.CLIENT_PEER_ID_KEY);
      this.clientPeerId = null;
      console.log('[Signalling] Client peer ID cleared from sessionStorage');
    } catch (error) {
      console.error('[Signalling] Error clearing client peer ID from sessionStorage:', error);
    }
  }
}
