import { BaseTimestampedModel } from './base';
import { InvitationStatus } from './enums';

export interface LabGroupPathItem {
  id: number;
  name: string;
}

export interface LabGroup extends BaseTimestampedModel {
  id: number;
  name: string;
  description?: string;
  parentGroup?: number;
  parentGroupName?: string;
  fullPath: LabGroupPathItem[];
  creator: number;
  creatorName?: string;
  isActive: boolean;
  allowMemberInvites: boolean;
  allowProcessJobs: boolean;
  memberCount: number;
  subGroupsCount: number;
  isCreator: boolean;
  isMember: boolean;
  canInvite: boolean;
  canManage: boolean;
  canProcessJobs: boolean;
}

export interface LabGroupInvitation extends BaseTimestampedModel {
  id: number;
  labGroup: number;
  labGroupName?: string;
  inviter: number;
  inviterName?: string;
  invitedUser?: number;
  invitedEmail: string;
  status: InvitationStatus;
  message?: string;
  invitationToken: string;
  expiresAt: string;
  respondedAt?: string;
  canAccept: boolean;
}

export interface LabGroupCreateRequest {
  name: string;
  description?: string;
  parentGroup?: number;
  allowMemberInvites?: boolean;
  allowProcessJobs?: boolean;
}

export interface LabGroupUpdateRequest {
  name?: string;
  description?: string;
  parentGroup?: number;
  isActive?: boolean;
  allowMemberInvites?: boolean;
  allowProcessJobs?: boolean;
}

export interface LabGroupInviteRequest {
  emails: string[];
  message?: string;
}

export interface InvitationResponseRequest {
  accept: boolean;
}

export interface LabGroupMember {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isStaff: boolean;
  isSuperuser: boolean;
  isActive: boolean;
  dateJoined: string;
  lastLogin?: string;
  hasOrcid: boolean;
  orcidId?: string;
}

export interface LabGroupQueryResponse {
  count: number;
  next?: string;
  previous?: string;
  results: LabGroup[];
}

export interface LabGroupInvitationQueryResponse {
  count: number;
  next?: string;
  previous?: string;
  results: LabGroupInvitation[];
}

export interface LabGroupInvitationCreateRequest {
  labGroup: number;
  invitedEmail: string;
  message?: string;
}

export interface LabGroupPermission extends BaseTimestampedModel {
  id: number;
  user: number;
  userUsername?: string;
  userDisplayName?: string;
  labGroup: number;
  labGroupName?: string;
  canView: boolean;
  canInvite: boolean;
  canManage: boolean;
  canProcessJobs: boolean;
}

export interface LabGroupPermissionCreateRequest {
  user: number;
  labGroup: number;
  canView?: boolean;
  canInvite?: boolean;
  canManage?: boolean;
  canProcessJobs?: boolean;
}

export interface LabGroupPermissionUpdateRequest {
  canView?: boolean;
  canInvite?: boolean;
  canManage?: boolean;
  canProcessJobs?: boolean;
}

export interface LabGroupPermissionQueryResponse {
  count: number;
  next?: string;
  previous?: string;
  results: LabGroupPermission[];
}