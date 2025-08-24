import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../../services/auth';
import { UserManagementService } from '../../../services/user-management';
import { 
  User, 
  UserCreateRequest, 
  UserListResponse, 
  AdminPasswordResetRequest 
} from '../../../models';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgbModule],
  templateUrl: './user-management.html',
  styleUrl: './user-management.scss'
})
export class UserManagementComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userManagementService = inject(UserManagementService);
  private authService = inject(AuthService);
  private modalService = inject(NgbModal);

  // Data
  users = signal<User[]>([]);
  totalUsers = signal(0);
  isLoading = signal(false);
  
  // Search and filters
  searchForm: FormGroup;
  
  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);
  
  // UI state
  selectedUser = signal<User | null>(null);
  isCreatingUser = signal(false);
  isUpdatingUser = signal(false);
  isDeletingUser = signal(false);
  isResettingPassword = signal(false);
  
  // Messages
  successMessage = signal<string>('');
  errorMessage = signal<string>('');

  // Make Math available in template
  Math = Math;

  constructor() {
    this.searchForm = this.fb.group({
      search: [''],
      is_staff: [''],
      is_active: ['']
    });
  }

  ngOnInit() {
    this.loadUsers();
    
    // Subscribe to search form changes
    this.searchForm.valueChanges.subscribe(() => {
      this.currentPage.set(1);
      this.loadUsers();
    });
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const searchParams = {
      search: this.searchForm.get('search')?.value || undefined,
      is_staff: this.searchForm.get('is_staff')?.value !== '' ? this.searchForm.get('is_staff')?.value === 'true' : undefined,
      is_active: this.searchForm.get('is_active')?.value !== '' ? this.searchForm.get('is_active')?.value === 'true' : undefined,
      page: this.currentPage(),
      page_size: this.pageSize()
    };

    this.userManagementService.getUsers(searchParams).subscribe({
      next: (response: UserListResponse) => {
        this.users.set(response.results);
        this.totalUsers.set(response.count);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set('Failed to load users');
        this.isLoading.set(false);
      }
    });
  }

  openCreateUserModal(content: any): void {
    this.selectedUser.set(null);
    this.modalService.open(content, { size: 'lg' });
  }

  openEditUserModal(content: any, user: User): void {
    this.selectedUser.set(user);
    this.modalService.open(content, { size: 'lg' });
  }

  openPasswordResetModal(content: any, user: User): void {
    this.selectedUser.set(user);
    this.modalService.open(content);
  }

  createUser(userData: UserCreateRequest): void {
    this.isCreatingUser.set(true);
    this.errorMessage.set('');

    this.userManagementService.createUser(userData).subscribe({
      next: (response) => {
        this.successMessage.set(`User ${userData.username} created successfully`);
        this.loadUsers();
        this.isCreatingUser.set(false);
        this.modalService.dismissAll();
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || 'Failed to create user');
        this.isCreatingUser.set(false);
      }
    });
  }

  updateUser(userId: number, userData: Partial<User>): void {
    this.isUpdatingUser.set(true);
    this.errorMessage.set('');

    this.userManagementService.updateUser(userId, userData).subscribe({
      next: (updatedUser) => {
        this.successMessage.set(`User ${updatedUser.username} updated successfully`);
        this.loadUsers();
        this.isUpdatingUser.set(false);
        this.modalService.dismissAll();
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || 'Failed to update user');
        this.isUpdatingUser.set(false);
      }
    });
  }

  deleteUser(user: User): void {
    if (!user.id) return;
    
    if (confirm(`Are you sure you want to delete user "${user.username}"? This action cannot be undone.`)) {
      this.isDeletingUser.set(true);
      this.errorMessage.set('');

      this.userManagementService.deleteUser(user.id).subscribe({
        next: () => {
          this.successMessage.set(`User ${user.username} deleted successfully`);
          this.loadUsers();
          this.isDeletingUser.set(false);
        },
        error: (error) => {
          this.errorMessage.set(error.error?.message || 'Failed to delete user');
          this.isDeletingUser.set(false);
        }
      });
    }
  }

  resetUserPassword(userId: number, passwordData: AdminPasswordResetRequest): void {
    this.isResettingPassword.set(true);
    this.errorMessage.set('');

    this.userManagementService.resetUserPassword(userId, passwordData).subscribe({
      next: (response) => {
        this.successMessage.set(response.message || 'Password reset successfully');
        this.isResettingPassword.set(false);
        this.modalService.dismissAll();
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || 'Failed to reset password');
        this.isResettingPassword.set(false);
      }
    });
  }

  toggleUserStatus(user: User): void {
    if (!user.id) return;
    
    const newStatus = !user.is_active;
    const action = newStatus ? 'activate' : 'deactivate';
    
    if (confirm(`Are you sure you want to ${action} user "${user.username}"?`)) {
      this.updateUser(user.id, { is_active: newStatus });
    }
  }

  toggleStaffStatus(user: User): void {
    if (!user.id) return;
    
    const newStatus = !user.is_staff;
    const action = newStatus ? 'grant staff privileges to' : 'revoke staff privileges from';
    
    if (confirm(`Are you sure you want to ${action} user "${user.username}"?`)) {
      this.updateUser(user.id, { is_staff: newStatus });
    }
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadUsers();
  }

  clearMessages(): void {
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  get totalPages(): number {
    return Math.ceil(this.totalUsers() / this.pageSize());
  }

  get pages(): number[] {
    const total = this.totalPages;
    const current = this.currentPage();
    const pages: number[] = [];
    
    // Show up to 5 pages around current page
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  formatDate(dateString?: string): string {
    return this.userManagementService.formatDate(dateString);
  }

  getUserDisplayName(user: User): string {
    return this.userManagementService.getUserDisplayName(user);
  }
}