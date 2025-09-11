import { RemoteSystemModel } from './base';

export interface TimeKeeper extends RemoteSystemModel {
  id: number;
  startTime: string;
  session?: number;
  sessionName?: string;
  step?: number;
  stepDescription?: string;
  user: number;
  userUsername?: string;
  started: boolean;
  currentDuration?: number;
  durationFormatted?: string;
}

export interface TimeKeeperCreateRequest {
  session?: number;
  step?: number;
  started?: boolean;
  currentDuration?: number;
  remoteId?: number;
  remoteHost?: number;
}

export interface TimeKeeperUpdateRequest {
  started?: boolean;
  currentDuration?: number;
}