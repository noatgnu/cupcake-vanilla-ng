import { BaseTimestampedModel } from './base';

export interface RemoteHost extends BaseTimestampedModel {
  id: number;
  hostName: string;
  hostPort: number;
  hostProtocol: string;
  hostDescription?: string;
  hostToken?: string;
}

export interface RemoteHostCreateRequest {
  hostName: string;
  hostPort?: number;
  hostProtocol?: string;
  hostDescription?: string;
  hostToken?: string;
}

export interface RemoteHostUpdateRequest {
  hostName?: string;
  hostPort?: number;
  hostProtocol?: string;
  hostDescription?: string;
  hostToken?: string;
}