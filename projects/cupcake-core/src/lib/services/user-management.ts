import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { ApiService } from './api';
import { AuthService } from './auth';
import { 
  User, 
  UserCreateRequest, 
  UserListResponse,
  UserProfileUpdateRequest,
  PasswordChangeRequest,
  EmailChangeRequest,
  AdminPasswordResetRequest,
  PasswordChangeResponse
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class UserManagementService {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  // User management state
  private usersSubject = new BehaviorSubject<User[]>([]);
  public users$ = this.usersSubject.asObservable();

  private totalUsersSubject = new BehaviorSubject<number>(0);
  public totalUsers$ = this.totalUsersSubject.asObservable();

  constructor() { }

  // ========================================
  // USER PROFILE METHODS (for all users)
  // ========================================

  /**
   * Get current user profile
   */
  getUserProfile(): Observable<{user: User}> {
    return this.apiService.getUserProfile();
  }

  /**
   * Update user profile
   */
  updateProfile(profileData: UserProfileUpdateRequest): Observable<{user: User; message: string}> {
    return this.apiService.updateProfile(profileData);
  }

  /**
   * Change password
   */
  changePassword(passwordData: PasswordChangeRequest): Observable<PasswordChangeResponse> {
    return this.apiService.changePassword(passwordData);
  }

  /**
   * Request email change
   */
  requestEmailChange(emailData: EmailChangeRequest): Observable<{message: string, new_email: string}> {
    return this.apiService.requestEmailChange(emailData);
  }

  // ========================================
  // ADMIN USER MANAGEMENT METHODS
  // ========================================

  /**
   * Get users with filtering and pagination
   */
  getUsers(params?: {
    is_staff?: boolean;
    is_active?: boolean;
    search?: string;
    page?: number;
    page_size?: number;
  }): Observable<UserListResponse> {
    return this.apiService.getUsers(params);
  }

  /**
   * Get specific user by ID
   */
  getUser(id: number): Observable<User> {
    return this.apiService.getUser(id);
  }

  /**
   * Create new user (admin only)
   */
  createUser(userData: UserCreateRequest): Observable<{user: User; message: string}> {
    return this.apiService.createUser(userData);
  }

  /**
   * Update user (admin only)
   */
  updateUser(id: number, userData: Partial<User>): Observable<User> {
    return this.apiService.updateUser(id, userData);
  }

  /**
   * Delete user (admin only)
   */
  deleteUser(id: number): Observable<void> {
    return this.apiService.deleteUser(id);
  }

  /**
   * Reset user password (admin only)
   */
  resetUserPassword(userId: number, passwordData: AdminPasswordResetRequest): Observable<PasswordChangeResponse> {
    return this.apiService.resetUserPassword(userId, passwordData);
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Get user display name
   */
  getUserDisplayName(user: User | null): string {
    if (!user) return '';
    
    if (user.first_name || user.last_name) {
      return `${user.first_name} ${user.last_name}`.trim();
    }
    
    return user.username || user.email || 'User';
  }

  /**
   * Format date for display
   */
  formatDate(dateString?: string): string {
    return dateString ? new Date(dateString).toLocaleDateString() : 'Never';
  }

  /**
   * Check if current user is admin/staff
   */
  isCurrentUserAdmin(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.is_staff || false;
  }

  /**
   * Check if current user is superuser
   */
  isCurrentUserSuperuser(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.is_superuser || false;
  }

  /**
   * Update users state (for admin components)
   */
  updateUsersState(users: User[], total: number): void {
    this.usersSubject.next(users);
    this.totalUsersSubject.next(total);
  }

  /**
   * Get current users state
   */
  getCurrentUsers(): User[] {
    return this.usersSubject.getValue();
  }

  /**
   * Get current total users count
   */
  getCurrentTotalUsers(): number {
    return this.totalUsersSubject.getValue();
  }
}