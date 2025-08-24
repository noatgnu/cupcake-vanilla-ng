import { BaseResource } from './resource';

export interface LabGroup extends BaseResource {
  id: number;
  name: string;
  description?: string;
  allow_member_invites: boolean;
  member_count: number;
  is_creator: boolean;
  is_member: boolean;
  can_invite: boolean;
  can_manage: boolean;
  created_at: string;
  updated_at: string;
}

export interface LabGroupQueryResponse {
  count: number;
  next?: string;
  previous?: string;
  results: LabGroup[];
}

export interface LabGroupCreateRequest {
  name: string;
  description?: string;
  allow_member_invites?: boolean;
}

export interface LabGroupInvitation {
  id: number;
  lab_group: number;
  lab_group_name: string;
  inviter: number;
  inviter_name: string;
  invited_user?: number;
  invited_user_name?: string;
  invited_email: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  message?: string;
  invitation_token: string;
  expires_at: string;
  responded_at?: string;
  can_accept: boolean;
  is_expired: boolean;
  created_at: string;
  updated_at: string;
}

export interface LabGroupInvitationQueryResponse {
  count: number;
  next?: string;
  previous?: string;
  results: LabGroupInvitation[];
}

export interface LabGroupInvitationCreateRequest {
  lab_group: number;
  invited_email: string;
  message?: string;
}

export interface LabGroupMember {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_creator: boolean;
}
