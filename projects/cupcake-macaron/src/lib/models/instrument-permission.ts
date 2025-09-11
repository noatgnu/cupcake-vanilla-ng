import { BaseTimestampedModel } from './base';

export interface InstrumentPermission extends BaseTimestampedModel {
  id: number;
  user: number;
  userUsername?: string;
  instrument: number;
  instrumentName?: string;
  canView: boolean;
  canBook: boolean;
  canManage: boolean;
}

export interface InstrumentPermissionCreateRequest {
  user: number;
  instrument: number;
  canView?: boolean;
  canBook?: boolean;
  canManage?: boolean;
}

export interface InstrumentPermissionUpdateRequest {
  canView?: boolean;
  canBook?: boolean;
  canManage?: boolean;
}