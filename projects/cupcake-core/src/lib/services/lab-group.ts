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
  LabGroupMember
} from '../models';

export interface LabGroupQueryParams {
  search?: string;
  limit?: number;
  offset?: number;
}

export interface LabGroupInvitationQueryParams {
  labGroup?: number;
  status?: string;
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

  getLabGroupMembers(id: number): Observable<LabGroupMember[]> {
    return this.get<LabGroupMember[]>(`${this.apiUrl}/lab-groups/${id}/members/`);
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
}