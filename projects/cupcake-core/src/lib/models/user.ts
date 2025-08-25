/**
 * User model representing a system user
 * @example
 * ```typescript
 * const user: User = {
 *   id: 1,
 *   username: 'john_doe',
 *   email: 'john@example.com',
 *   first_name: 'John',
 *   last_name: 'Doe',
 *   is_staff: false,
 *   is_superuser: false,
 *   is_active: true,
 *   date_joined: '2024-01-01T00:00:00Z',
 *   last_login: '2024-01-15T10:30:00Z',
 *   orcid_id: '0000-0000-0000-0000'
 * };
 * ```
 */
export interface User {
  /** Unique user identifier */
  id?: number;
  /** Unique username for authentication */
  username: string;
  /** User's email address */
  email: string;
  /** User's first name */
  first_name: string;
  /** User's last name */
  last_name: string;
  /** Whether user has staff privileges */
  is_staff?: boolean;
  /** Whether user has superuser privileges */
  is_superuser?: boolean;
  /** Whether user account is active */
  is_active?: boolean;
  /** ISO date string when user joined */
  date_joined?: string;
  /** ISO date string of last login */
  last_login?: string;
  /** ORCID identifier if linked */
  orcid_id?: string;
}

/**
 * Request payload for creating a new user (admin only)
 * @example
 * ```typescript
 * const createRequest: UserCreateRequest = {
 *   username: 'new_user',
 *   email: 'newuser@example.com',
 *   first_name: 'New',
 *   last_name: 'User',
 *   password: 'securePassword123',
 *   password_confirm: 'securePassword123',
 *   is_staff: false,
 *   is_active: true
 * };
 * 
 * this.apiService.createUser(createRequest).subscribe({
 *   next: (user) => console.log('User created:', user.username),
 *   error: (error) => console.error('Creation failed:', error)
 * });
 * ```
 */
export interface UserCreateRequest {
  /** Desired username */
  username: string;
  /** User's email address */
  email: string;
  /** User's first name */
  first_name: string;
  /** User's last name */
  last_name: string;
  /** User's password */
  password: string;
  /** Password confirmation (must match password) */
  password_confirm: string;
  /** Grant staff privileges */
  is_staff?: boolean;
  /** Grant superuser privileges */
  is_superuser?: boolean;
  /** Set account as active */
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