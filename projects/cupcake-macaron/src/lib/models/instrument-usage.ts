import { BaseTimestampedModel } from './base';

export interface InstrumentUsage extends BaseTimestampedModel {
  id: number;
  user: number;
  userUsername?: string;
  instrument: number;
  instrumentName?: string;
  timeStarted?: string;
  timeEnded?: string;
  usageHours?: number;
  description?: string;
  approved: boolean;
  maintenance: boolean;
  approvedBy?: number;
  approvedByUsername?: string;
  remoteId?: number;
  remoteHost?: number;
}

export interface InstrumentUsageCreateRequest {
  instrument: number;
  timeStarted?: string;
  timeEnded?: string;
  description?: string;
  maintenance?: boolean;
  remoteId?: number;
  remoteHost?: number;
}

export interface InstrumentUsageUpdateRequest {
  timeStarted?: string;
  timeEnded?: string;
  description?: string;
  approved?: boolean;
  maintenance?: boolean;
}