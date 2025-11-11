import { BaseTimestampedModel } from './base';
import { User } from '@noatgnu/cupcake-core';

export enum WebRTCSessionType {
  VIDEO_CALL = 'video_call',
  AUDIO_CALL = 'audio_call',
  SCREEN_SHARE = 'screen_share',
  DATA_CHANNEL = 'data_channel'
}

export enum WebRTCSessionStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  ENDED = 'ended'
}

export enum PeerRole {
  HOST = 'host',
  VIEWER = 'viewer',
  PARTICIPANT = 'participant'
}

export enum PeerConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  FAILED = 'failed'
}

export enum SignalType {
  OFFER = 'offer',
  ANSWER = 'answer',
  ICE_CANDIDATE = 'ice_candidate',
  CHECK = 'check'
}

export interface WebRTCSession extends BaseTimestampedModel {
  id: string;
  name?: string;
  isDefault: boolean;
  sessionType: WebRTCSessionType;
  sessionStatus: WebRTCSessionStatus;
  initiatedBy: number;
  initiatedByUsername?: string;
  initiatedByDetails?: User;
  participantsList?: WebRTCPeer[];
  participantsCount?: number;
  canEdit?: boolean;
  canDelete?: boolean;
  startedAt: string;
  endedAt?: string;
}

export interface WebRTCPeer extends BaseTimestampedModel {
  id: string;
  session: string;
  user: number;
  username?: string;
  userDetails?: User;
  channelId: string;
  peerRole: PeerRole;
  connectionState: PeerConnectionState;
  hasVideo: boolean;
  hasAudio: boolean;
  hasScreenShare: boolean;
  joinedAt: string;
  lastSeenAt: string;
}

export interface WebRTCSessionCreate {
  name?: string;
  sessionType: WebRTCSessionType;
  ccrvSessionIds?: number[];
}

export interface WebRTCSessionUpdate {
  name?: string;
  sessionType?: WebRTCSessionType;
  sessionStatus?: WebRTCSessionStatus;
  isDefault?: boolean;
}

export interface WebRTCSessionQueryParams {
  sessionType?: WebRTCSessionType;
  sessionStatus?: WebRTCSessionStatus;
  ccrvSessionId?: number;
  limit?: number;
  offset?: number;
}

export interface WebRTCSignal extends BaseTimestampedModel {
  id: string;
  session: string;
  fromPeer: string;
  toPeer?: string;
  signalType: SignalType;
  signalData: any;
  delivered: boolean;
}

export interface PeerInfo {
  id: string;
  userId: number;
  username: string;
  peerRole: PeerRole;
  connectionState: PeerConnectionState;
  hasVideo: boolean;
  hasAudio: boolean;
  hasScreenShare: boolean;
}

export interface WebRTCMessage {
  type: 'connection.established' | 'check.response' | 'peer.check' | 'offer' | 'answer' | 'ice_candidate' | 'peer.state_update' | 'peer.joined' | 'peer.left' | 'heartbeat.response' | 'error';
  message?: string;
  peerId?: string;
  clientPeerId?: string;
  sessionId?: string;
  userId?: number;
  username?: string;
  fromPeerId?: string;
  fromUserId?: number;
  fromUsername?: string;
  toPeerId?: string;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  peers?: PeerInfo[];
  peerRole?: PeerRole;
  connectionState?: PeerConnectionState;
  hasVideo?: boolean;
  hasAudio?: boolean;
  hasScreenShare?: boolean;
  iceServers?: RTCIceServer[];
  timestamp?: string;
  isReconnection?: boolean;
}

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
  iceCandidatePoolSize?: number;
  iceTransportPolicy?: RTCIceTransportPolicy;
  bundlePolicy?: RTCBundlePolicy;
  rtcpMuxPolicy?: RTCRtcpMuxPolicy;
}

export interface MediaConstraintsConfig {
  video?: boolean | MediaTrackConstraints;
  audio?: boolean | MediaTrackConstraints;
}

export interface PeerConnection {
  peerId: string;
  userId: number;
  username: string;
  pc: RTCPeerConnection;
  dataChannel?: RTCDataChannel;
  stream?: MediaStream;
  role: PeerRole;
  offered: boolean;
  answered: boolean;
  connected: boolean;
  queuedCandidates: RTCIceCandidate[];
}

export interface ChatMessage {
  type: 'chat';
  peerId: string;
  userId: number;
  username: string;
  message: string;
  timestamp: string;
  fileOffer?: FileOfferData;
}

export interface FileOfferData {
  fileId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  chunkSize: number;
  totalChunks: number;
}

export interface FileTransferRequest {
  type: 'file_request';
  fileId: string;
  requesterId: string;
}

export interface FileTransferAccept {
  type: 'file_accept';
  fileId: string;
  toPeerId: string;
}

export interface FileChunk {
  type: 'file_chunk';
  fileId: string;
  chunkIndex: number;
  totalChunks: number;
  data: ArrayBuffer;
  isLast: boolean;
}

export interface FileTransferProgress {
  fileId: string;
  fileName: string;
  fileSize: number;
  chunksReceived: number;
  totalChunks: number;
  bytesReceived: number;
  percentage: number;
}

export interface FileTransferState {
  fileId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  file?: File;
  chunks: Map<number, ArrayBuffer>;
  totalChunks: number;
  chunkSize: number;
  sentChunks: number;
  receivedChunks: number;
  status: 'pending' | 'transferring' | 'completed' | 'failed';
  requestedBy: Set<string>;
  streamWriter?: WritableStreamDefaultWriter<Uint8Array>;
  downloadStream?: WritableStream<Uint8Array>;
}

export interface DataChannelMessage {
  type: 'chat' | 'ping' | 'pong' | 'file_request' | 'file_accept' | 'file_chunk' | 'file_complete' | 'file_cancel';
  data: any;
}
