import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { debounceTime } from 'rxjs';
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
  searchTerm = signal('');
  staffFilter = signal('');
  activeFilter = signal('');
  
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

  // Computed signals
  totalPages = computed(() => Math.ceil(this.totalUsers() / this.pageSize()));
  
  pages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    
    // Show up to 5 pages around current page
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  });

  showingFrom = computed(() => ((this.currentPage() - 1) * this.pageSize()) + 1);
  
  showingTo = computed(() => Math.min(this.currentPage() * this.pageSize(), this.totalUsers()));

  hasResults = computed(() => this.users().length > 0);

  canGoToPreviousPage = computed(() => this.currentPage() > 1);
  
  canGoToNextPage = computed(() => this.currentPage() < this.totalPages());

  // Additional computed signals for UI state
  isAnyActionInProgress = computed(() => 
    this.isCreatingUser() || 
    this.isUpdatingUser() || 
    this.isDeletingUser() || 
    this.isResettingPassword()
  );

  selectedUserDisplayName = computed(() => {
    const user = this.selectedUser();
    return user ? this.getUserDisplayName(user) : '';
  });

  // Computed signal for modal states
  hasSelectedUser = computed(() => this.selectedUser() !== null);

  // Computed signals for form states
  canCreateUser = computed(() => !this.isCreatingUser());
  canUpdateUser = computed(() => !this.isUpdatingUser());
  canResetPassword = computed(() => !this.isResettingPassword());

  constructor() {
    this.searchForm = this.fb.group({
      search: [''],
      isStaff: [''],
      isActive: ['']
    });
  }

  ngOnInit() {
    this.loadUsers();
    
    // Subscribe to search form changes with debounce
    this.searchForm.valueChanges.pipe(
      debounceTime(300)
    ).subscribe((values) => {
      this.searchTerm.set(values.search || '');
      this.staffFilter.set(values.isStaff || '');
      this.activeFilter.set(values.isActive || '');
      this.currentPage.set(1);
    });
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const searchParams = {
      search: this.searchTerm() || undefined,
      isStaff: this.staffFilter() !== '' ? this.staffFilter() === 'true' : undefined,
      isActive: this.activeFilter() !== '' ? this.activeFilter() === 'true' : undefined,
      page: this.currentPage(),
      pageSize: this.pageSize()
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
    
    const newStatus = !user.isActive;
    const action = newStatus ? 'activate' : 'deactivate';
    
    if (confirm(`Are you sure you want to ${action} user "${user.username}"?`)) {
      this.updateUser(user.id, { isActive: newStatus });
    }
  }

  toggleStaffStatus(user: User): void {
    if (!user.id) return;
    
    const newStatus = !user.isStaff;
    const action = newStatus ? 'grant staff privileges to' : 'revoke staff privileges from';
    
    if (confirm(`Are you sure you want to ${action} user "${user.username}"?`)) {
      this.updateUser(user.id, { isStaff: newStatus });
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


  formatDate(dateString?: string): string {
    return this.userManagementService.formatDate(dateString);
  }

  getUserDisplayName(user: User): string {
    return this.userManagementService.getUserDisplayName(user);
  }
}