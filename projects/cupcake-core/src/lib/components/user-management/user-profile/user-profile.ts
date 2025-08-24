import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from '../../../services/api';
import { AuthService } from '../../../services/auth';
import { User, UserProfileUpdateRequest, PasswordChangeRequest, EmailChangeRequest } from '../../../models';
import { UserManagementService } from '../../../services/user-management';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbModule],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.scss'
})
export class UserProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userManagementService = inject(UserManagementService);
  private authService = inject(AuthService);

  // User data
  currentUser = signal<User | null>(null);
  isLoading = signal(false);
  
  // Forms
  profileForm: FormGroup;
  passwordForm: FormGroup;
  emailChangeForm: FormGroup;
  
  // UI state
  activeTab: 'profile' | 'password' | 'email' | 'account' = 'profile';
  isUpdatingProfile = signal(false);
  isChangingPassword = signal(false);
  isChangingEmail = signal(false);
  
  // Success/error messages
  profileMessage = signal<string>('');
  passwordMessage = signal<string>('');
  emailMessage = signal<string>('');
  errorMessage = signal<string>('');

  constructor() {
    this.profileForm = this.fb.group({
      first_name: ['', [Validators.required, Validators.maxLength(30)]],
      last_name: ['', [Validators.required, Validators.maxLength(30)]],
      current_password: ['', [Validators.required]]
    });

    this.passwordForm = this.fb.group({
      current_password: ['', [Validators.required]],
      new_password: ['', [Validators.required, Validators.minLength(8)]],
      confirm_password: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    this.emailChangeForm = this.fb.group({
      new_email: ['', [Validators.required, Validators.email]],
      current_password: ['', [Validators.required]]
    });
  }

  ngOnInit() {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.isLoading.set(true);
    this.userManagementService.getUserProfile().subscribe({
      next: (response) => {
        this.currentUser.set(response.user);
        this.profileForm.patchValue({
          first_name: response.user.first_name,
          last_name: response.user.last_name
        });
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set('Failed to load user profile');
        this.isLoading.set(false);
      }
    });
  }

  updateProfile(): void {
    if (this.profileForm.valid) {
      this.isUpdatingProfile.set(true);
      this.profileMessage.set('');
      this.errorMessage.set('');

      const profileData: UserProfileUpdateRequest = {
        first_name: this.profileForm.get('first_name')?.value,
        last_name: this.profileForm.get('last_name')?.value,
        current_password: this.profileForm.get('current_password')?.value
      };

      this.userManagementService.updateProfile(profileData).subscribe({
        next: (response) => {
          this.profileMessage.set('Profile updated successfully');
          this.currentUser.set(response.user);
          this.profileForm.get('current_password')?.setValue('');
          this.isUpdatingProfile.set(false);
        },
        error: (error) => {
          this.errorMessage.set(error.error?.message || 'Failed to update profile');
          this.isUpdatingProfile.set(false);
        }
      });
    }
  }

  changePassword(): void {
    if (this.passwordForm.valid) {
      this.isChangingPassword.set(true);
      this.passwordMessage.set('');
      this.errorMessage.set('');

      const passwordData: PasswordChangeRequest = {
        current_password: this.passwordForm.get('current_password')?.value,
        new_password: this.passwordForm.get('new_password')?.value,
        confirm_password: this.passwordForm.get('confirm_password')?.value
      };

      this.userManagementService.changePassword(passwordData).subscribe({
        next: (response) => {
          this.passwordMessage.set('Password changed successfully');
          this.passwordForm.reset();
          this.isChangingPassword.set(false);
        },
        error: (error) => {
          this.errorMessage.set(error.error?.message || 'Failed to change password');
          this.isChangingPassword.set(false);
        }
      });
    }
  }

  requestEmailChange(): void {
    if (this.emailChangeForm.valid) {
      this.isChangingEmail.set(true);
      this.emailMessage.set('');
      this.errorMessage.set('');

      const emailData: EmailChangeRequest = {
        new_email: this.emailChangeForm.get('new_email')?.value,
        current_password: this.emailChangeForm.get('current_password')?.value
      };

      this.userManagementService.requestEmailChange(emailData).subscribe({
        next: (response) => {
          this.emailMessage.set(`Verification email sent to ${response.new_email}. Please check your inbox and follow the instructions.`);
          this.emailChangeForm.reset();
          this.isChangingEmail.set(false);
        },
        error: (error) => {
          this.errorMessage.set(error.error?.message || 'Failed to request email change');
          this.isChangingEmail.set(false);
        }
      });
    }
  }

  setActiveTab(tab: 'profile' | 'password' | 'email' | 'account'): void {
    this.activeTab = tab;
    // Clear messages when switching tabs
    this.profileMessage.set('');
    this.passwordMessage.set('');
    this.emailMessage.set('');
    this.errorMessage.set('');
  }

  private passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('new_password');
    const confirmPassword = form.get('confirm_password');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  get fullName(): string {
    const user = this.currentUser();
    return user ? `${user.first_name} ${user.last_name}`.trim() : '';
  }

  get isStaff(): boolean {
    return this.currentUser()?.is_staff || false;
  }

  get joinDate(): string {
    const user = this.currentUser();
    return user?.date_joined ? new Date(user.date_joined).toLocaleDateString() : '';
  }

  get lastLogin(): string {
    const user = this.currentUser();
    return user?.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never';
  }
}