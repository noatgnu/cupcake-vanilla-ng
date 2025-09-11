import { BaseTimestampedModel } from './base';
import { StorageObjectType } from './enums';

export interface StorageObject extends BaseTimestampedModel {
  id: number;
  objectType: StorageObjectType;
  objectName: string;
  objectDescription?: string;
  storedAt?: number;
  storedAtName?: string;
  remoteId?: number;
  remoteHost?: number;
  canDelete?: boolean;
  pngBase64?: string;
  user?: number;
  userUsername?: string;
  accessLabGroups?: number[];
  isVaulted: boolean;
}

export interface StorageObjectCreateRequest {
  objectType: StorageObjectType;
  objectName: string;
  objectDescription?: string;
  storedAt?: number;
  remoteId?: number;
  remoteHost?: number;
  pngBase64?: string;
  accessLabGroups?: number[];
}

export interface StorageObjectUpdateRequest {
  objectType?: StorageObjectType;
  objectName?: string;
  objectDescription?: string;
  storedAt?: number;
  pngBase64?: string;
  accessLabGroups?: number[];
  isVaulted?: boolean;
}