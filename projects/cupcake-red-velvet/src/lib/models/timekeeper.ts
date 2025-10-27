import { RemoteSystemModel } from './base';

export interface TimeKeeperEvent {
  id: number;
  timeKeeper: number;
  eventType: 'started' | 'stopped' | 'reset';
  eventTime: string;
  durationAtEvent?: number;
  notes?: string;
}

export interface TimeKeeper extends RemoteSystemModel {
  id: number;
  name?: string;
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
  originalDuration?: number;
  originalDurationFormatted?: string;
  events?: TimeKeeperEvent[];
}

export interface TimeKeeperCreateRequest {
  name?: string;
  session?: number;
  step?: number;
  started?: boolean;
  currentDuration?: number;
  originalDuration?: number;
  remoteId?: number;
  remoteHost?: number;
}

export interface TimeKeeperUpdateRequest {
  name?: string;
  started?: boolean;
  currentDuration?: number;
  originalDuration?: number;
}