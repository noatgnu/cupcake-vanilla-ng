import { ResourceRole } from './enums';
import { BaseTimestampedModel } from './base';

export interface ResourcePermission extends BaseTimestampedModel {
  id: number;
  user: number;
  userUsername?: string;
  userDisplayName?: string;
  resourceContentType: number;
  resourceTypeName?: string;
  resourceModel?: string;
  resourceObjectId: number;
  role: ResourceRole;
  grantedBy?: number;
  grantedByUsername?: string;
  grantedAt: string;
}

export interface ResourcePermissionCreateRequest {
  user: number;
  resourceContentType: number;
  resourceObjectId: number;
  role: ResourceRole;
}

export interface ResourcePermissionUpdateRequest {
  role: ResourceRole;
}

export interface BulkPermissionRequest {
  users: number[];
  role: ResourceRole;
  resourceContentType: number;
  resourceObjectId: number;
}