import { BaseTimestampedModel } from './base';
import { InvitationStatus } from './enums';

export interface LabGroup extends BaseTimestampedModel {
  id: number;
  name: string;
  description?: string;
  creator: number;
  creatorName?: string;
  isActive: boolean;
  allowMemberInvites: boolean;
  memberCount: number;
  isCreator: boolean;
  isMember: boolean;
  canInvite: boolean;
  canManage: boolean;
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
  allowMemberInvites?: boolean;
}

export interface LabGroupUpdateRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
  allowMemberInvites?: boolean;
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