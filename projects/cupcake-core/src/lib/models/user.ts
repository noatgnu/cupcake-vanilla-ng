import { BaseTimestampedModel } from './base';

export interface User {
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

export interface UserCreateRequest {
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  password: string;
  passwordConfirm: string;
  isStaff?: boolean;
  isSuperuser?: boolean;
  isActive?: boolean;
}

export interface UserRegistrationRequest {
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  password: string;
  passwordConfirm: string;
}

export interface UserOrcidProfile extends BaseTimestampedModel {
  user: number;
  userUsername?: string;
  userEmail?: string;
  orcidId: string;
  orcidName?: string;
  orcidEmail?: string;
  verified: boolean;
  linkedAt: string;
}

export interface AccountMergeRequest extends BaseTimestampedModel {
  id: number;
  primaryUser: number;
  primaryUserUsername?: string;
  duplicateUser: number;
  duplicateUserUsername?: string;
  requestedBy: number;
  requestedByUsername?: string;
  reason?: string;
  status: string;
  reviewedBy?: number;
  reviewedByUsername?: string;
  adminNotes?: string;
  completedAt?: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UserProfileUpdateRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  currentPassword: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  token: string;
  password: string;
  passwordConfirm: string;
}

export interface EmailChangeRequest {
  newEmail: string;
  currentPassword: string;
}

export interface EmailChangeConfirmRequest {
  token: string;
}

export interface UserResponse {
  user: User;
  message?: string;
}

export interface PasswordChangeResponse {
  message: string;
}

export interface AdminPasswordResetRequest {
  userId: number;
  newPassword: string;
  confirmPassword: string;
  forcePasswordChange?: boolean;
  reason?: string;
}

export interface EmailChangeConfirmResponse {
  message: string;
}

export interface UserListResponse {
  count: number;
  next?: string;
  previous?: string;
  results: User[];
}