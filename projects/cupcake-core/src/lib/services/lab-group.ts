import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { BaseApiService } from './base-api';

import {
  LabGroup,
  LabGroupCreateRequest,
  LabGroupQueryResponse,
  LabGroupInvitation,
  LabGroupInvitationQueryResponse,
  LabGroupInvitationCreateRequest,
  LabGroupMember,
  LabGroupPermission,
  LabGroupPermissionCreateRequest,
  LabGroupPermissionUpdateRequest,
  LabGroupPermissionQueryResponse
} from '../models';

export interface LabGroupQueryParams {
  search?: string;
  parentGroup?: number;
  parentGroup__isnull?: string;
  limit?: number;
  offset?: number;
}

export interface LabGroupInvitationQueryParams {
  labGroup?: number;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface LabGroupPermissionQueryParams {
  labGroup?: number;
  user?: number;
  canView?: boolean;
  canInvite?: boolean;
  canManage?: boolean;
  limit?: number;
  offset?: number;
}

@Injectable({
  providedIn: 'root'
})
export class LabGroupService extends BaseApiService {

  // LAB GROUPS
  getLabGroups(params?: LabGroupQueryParams): Observable<LabGroupQueryResponse> {
    const httpParams = this.buildHttpParams(params);
    return this.get<LabGroupQueryResponse>(`${this.apiUrl}/lab-groups/`, { params: httpParams });
  }

  getMyLabGroups(params?: LabGroupQueryParams): Observable<LabGroupQueryResponse> {
    const httpParams = this.buildHttpParams(params);
    return this.get<LabGroupQueryResponse>(`${this.apiUrl}/lab-groups/my_groups/`, { params: httpParams });
  }

  createLabGroup(labGroup: LabGroupCreateRequest): Observable<LabGroup> {
    return this.post<LabGroup>(`${this.apiUrl}/lab-groups/`, labGroup);
  }

  updateLabGroup(id: number, labGroup: Partial<LabGroup>): Observable<LabGroup> {
    return this.patch<LabGroup>(`${this.apiUrl}/lab-groups/${id}/`, labGroup);
  }

  deleteLabGroup(id: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/lab-groups/${id}/`);
  }

  getLabGroupMembers(id: number, params?: { directOnly?: boolean; pageSize?: number; limit?: number; offset?: number }): Observable<{count: number; next: string | null; previous: string | null; results: LabGroupMember[]}> {
    const httpParams = this.buildHttpParams({
      direct_only: params?.directOnly?.toString(),
      page_size: params?.pageSize?.toString(),
      limit: params?.limit?.toString(),
      offset: params?.offset?.toString()
    });
    return this.get<{count: number; next: string | null; previous: string | null; results: LabGroupMember[]}>(`${this.apiUrl}/lab-groups/${id}/members/`, { params: httpParams });
  }

  inviteUserToLabGroup(id: number, invitation: LabGroupInvitationCreateRequest): Observable<LabGroupInvitation> {
    return this.post<LabGroupInvitation>(`${this.apiUrl}/lab-groups/${id}/invite_user/`, invitation);
  }

  leaveLabGroup(id: number): Observable<{message: string}> {
    return this.post<{message: string}>(`${this.apiUrl}/lab-groups/${id}/leave/`, {});
  }

  removeMemberFromLabGroup(id: number, userId: number): Observable<{message: string}> {
    return this.post<{message: string}>(`${this.apiUrl}/lab-groups/${id}/remove_member/`, { userId });
  }

  /**
   * Check if a user is a member of a lab group
   * @param id Lab group ID
   * @param userId User ID to check (optional, defaults to current user)
   * @returns Membership status including direct and indirect membership
   */
  checkMembership(id: number, userId?: number): Observable<{
    isMember: boolean;
    isDirectMember: boolean;
    userId: number;
    userUsername: string;
  }> {
    const params = userId ? { user_id: userId.toString() } : {};
    const httpParams = this.buildHttpParams(params);
    return this.get(`${this.apiUrl}/lab-groups/${id}/check_membership/`, { params: httpParams });
  }

  getRootLabGroups(params?: Omit<LabGroupQueryParams, 'parentGroup'>): Observable<LabGroupQueryResponse> {
    const httpParams = this.buildHttpParams({ ...params, parentGroup__isnull: 'true' });
    return this.get<LabGroupQueryResponse>(`${this.apiUrl}/lab-groups/`, { params: httpParams });
  }

  getSubGroups(parentGroupId: number, params?: Omit<LabGroupQueryParams, 'parentGroup'>): Observable<LabGroupQueryResponse> {
    return this.getLabGroups({ ...params, parentGroup: parentGroupId });
  }

  // LAB GROUP INVITATIONS
  getLabGroupInvitations(params?: LabGroupInvitationQueryParams): Observable<LabGroupInvitationQueryResponse> {
    const httpParams = this.buildHttpParams(params);
    return this.get<LabGroupInvitationQueryResponse>(`${this.apiUrl}/lab-group-invitations/`, { params: httpParams });
  }

  getMyPendingInvitations(): Observable<LabGroupInvitation[]> {
    return this.get<LabGroupInvitation[]>(`${this.apiUrl}/lab-group-invitations/my_pending_invitations/`);
  }

  acceptLabGroupInvitation(id: number): Observable<{message: string, invitation: LabGroupInvitation}> {
    return this.post<{message: string, invitation: LabGroupInvitation}>(`${this.apiUrl}/lab-group-invitations/${id}/accept_invitation/`, {});
  }

  rejectLabGroupInvitation(id: number): Observable<{message: string, invitation: LabGroupInvitation}> {
    return this.post<{message: string, invitation: LabGroupInvitation}>(`${this.apiUrl}/lab-group-invitations/${id}/reject_invitation/`, {});
  }

  cancelLabGroupInvitation(id: number): Observable<{message: string}> {
    return this.post<{message: string}>(`${this.apiUrl}/lab-group-invitations/${id}/cancel_invitation/`, {});
  }

  // LAB GROUP PERMISSIONS
  getLabGroupPermissions(params?: LabGroupPermissionQueryParams): Observable<LabGroupPermissionQueryResponse> {
    const httpParams = this.buildHttpParams(params);
    return this.get<LabGroupPermissionQueryResponse>(`${this.apiUrl}/lab-group-permissions/`, { params: httpParams });
  }

  getLabGroupPermission(id: number): Observable<LabGroupPermission> {
    return this.get<LabGroupPermission>(`${this.apiUrl}/lab-group-permissions/${id}/`);
  }

  createLabGroupPermission(permission: LabGroupPermissionCreateRequest): Observable<LabGroupPermission> {
    return this.post<LabGroupPermission>(`${this.apiUrl}/lab-group-permissions/`, permission);
  }

  updateLabGroupPermission(id: number, permission: LabGroupPermissionUpdateRequest): Observable<LabGroupPermission> {
    return this.patch<LabGroupPermission>(`${this.apiUrl}/lab-group-permissions/${id}/`, permission);
  }

  deleteLabGroupPermission(id: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/lab-group-permissions/${id}/`);
  }

  getLabGroupPermissionsForLabGroup(labGroupId: number): Observable<LabGroupPermissionQueryResponse> {
    return this.getLabGroupPermissions({ labGroup: labGroupId });
  }

  getLabGroupPermissionsForUser(userId: number): Observable<LabGroupPermissionQueryResponse> {
    return this.getLabGroupPermissions({ user: userId });
  }
}