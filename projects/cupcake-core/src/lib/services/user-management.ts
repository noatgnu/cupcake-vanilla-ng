import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { ApiService } from './api';
import { AuthService } from './auth';
import { 
  User, 
  UserCreateRequest, 
  UserProfileUpdateRequest,
  PasswordChangeRequest,
  EmailChangeRequest,
  PaginatedResponse,
  UserResponse,
  AdminPasswordResetRequest,
  PasswordChangeResponse
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class UserManagementService {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  private usersSubject = new BehaviorSubject<User[]>([]);
  public users$ = this.usersSubject.asObservable();

  private totalUsersSubject = new BehaviorSubject<number>(0);
  public totalUsers$ = this.totalUsersSubject.asObservable();

  constructor() { }

  getUserProfile(): Observable<{user: User}> {
    return this.apiService.getUserProfile();
  }

  updateProfile(profileData: UserProfileUpdateRequest): Observable<UserResponse> {
    return this.apiService.updateProfile(profileData);
  }

  changePassword(passwordData: PasswordChangeRequest): Observable<{message: string}> {
    return this.apiService.changePassword(passwordData);
  }

  requestEmailChange(emailData: EmailChangeRequest): Observable<{message: string; new_email: string}> {
    return this.apiService.requestEmailChange(emailData);
  }

  getUsers(params?: {
    isStaff?: boolean;
    isActive?: boolean;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Observable<PaginatedResponse<User>> {
    return this.apiService.getUsers(params);
  }

  getUser(id: number): Observable<User> {
    return this.apiService.getUser(id);
  }

  createUser(userData: UserCreateRequest): Observable<UserResponse> {
    return this.apiService.createUser(userData);
  }

  updateUser(id: number, userData: Partial<User>): Observable<User> {
    return this.apiService.updateUser(id, userData);
  }

  deleteUser(id: number): Observable<void> {
    return this.apiService.deleteUser(id);
  }

  resetUserPassword(userId: number, passwordData: AdminPasswordResetRequest): Observable<PasswordChangeResponse> {
    return this.apiService.resetUserPassword(userId, passwordData);
  }

  getUserDisplayName(user: User | null): string {
    if (!user) return '';
    
    if (user.firstName || user.lastName) {
      return `${user.firstName} ${user.lastName}`.trim();
    }
    
    return user.username || user.email || 'User';
  }

  formatDate(dateString?: string): string {
    return dateString ? new Date(dateString).toLocaleDateString() : 'Never';
  }

  isCurrentUserAdmin(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.isStaff || false;
  }

  isCurrentUserSuperuser(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.isSuperuser || false;
  }

  updateUsersState(users: User[], total: number): void {
    this.usersSubject.next(users);
    this.totalUsersSubject.next(total);
  }

  getCurrentUsers(): User[] {
    return this.usersSubject.getValue();
  }

  getCurrentTotalUsers(): number {
    return this.totalUsersSubject.getValue();
  }
}