export interface User {
  id?: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  isStaff?: boolean;
  isSuperuser?: boolean;
  is_active?: boolean;
  date_joined?: string;
  last_login?: string;
  orcid_id?: string;
}

export interface UserCreateRequest {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
  isStaff?: boolean;
  isSuperuser?: boolean;
  is_active?: boolean;
}

export interface UserRegistrationRequest {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
}

export interface UserResponse {
  message: string;
  user: User;
}

export interface UserListResponse {
  count: number;
  next?: string;
  previous?: string;
  results: User[];
}

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface AdminPasswordResetRequest {
  new_password: string;
  confirm_password: string;
  force_password_change?: boolean;
  reason?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  uid: string;
  token: string;
  new_password: string;
  confirm_password: string;
}

export interface PasswordChangeResponse {
  message: string;
}

export interface UserProfileUpdateRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  current_password?: string;
}

export interface EmailChangeRequest {
  new_email: string;
  current_password: string;
}

export interface EmailChangeConfirm {
  token: string;
}