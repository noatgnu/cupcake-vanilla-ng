import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from '../../../services/api';
import { AuthService } from '../../../services/auth';
import { User, UserProfileUpdateRequest, PasswordChangeRequest, EmailChangeRequest } from '../../../models';
import { UserManagementService } from '../../../services/user-management';

@Component({
  selector: 'ccc-user-profile',
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
  activeTab = signal<'profile' | 'password' | 'email' | 'account'>('profile');
  isUpdatingProfile = signal(false);
  isChangingPassword = signal(false);
  isChangingEmail = signal(false);
  
  // Success/error messages
  profileMessage = signal<string>('');
  passwordMessage = signal<string>('');
  emailMessage = signal<string>('');
  errorMessage = signal<string>('');

  // Computed signals for derived values
  fullName = computed(() => {
    const user = this.currentUser();
    return user ? `${user.firstName} ${user.lastName}`.trim() : '';
  });

  isStaff = computed(() => this.currentUser()?.isStaff || false);

  joinDate = computed(() => {
    const user = this.currentUser();
    return user?.dateJoined ? new Date(user.dateJoined).toLocaleDateString() : '';
  });

  lastLogin = computed(() => {
    const user = this.currentUser();
    return user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never';
  });

  constructor() {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.maxLength(30)]],
      lastName: ['', [Validators.required, Validators.maxLength(30)]],
      currentPassword: ['', [Validators.required]]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    this.emailChangeForm = this.fb.group({
      newEmail: ['', [Validators.required, Validators.email]],
      currentPassword: ['', [Validators.required]]
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
          firstName: response.user.firstName,
          lastName: response.user.lastName
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
        firstName: this.profileForm.get('firstName')?.value,
        lastName: this.profileForm.get('lastName')?.value,
        currentPassword: this.profileForm.get('currentPassword')?.value
      };

      this.userManagementService.updateProfile(profileData).subscribe({
        next: (response) => {
          this.profileMessage.set('Profile updated successfully');
          this.currentUser.set(response.user);
          this.profileForm.get('currentPassword')?.setValue('');
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
        currentPassword: this.passwordForm.get('currentPassword')?.value,
        newPassword: this.passwordForm.get('newPassword')?.value,
        confirmPassword: this.passwordForm.get('confirmPassword')?.value
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
        newEmail: this.emailChangeForm.get('newEmail')?.value,
        currentPassword: this.emailChangeForm.get('currentPassword')?.value
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
    this.activeTab.set(tab);
    // Clear messages when switching tabs
    this.profileMessage.set('');
    this.passwordMessage.set('');
    this.emailMessage.set('');
    this.errorMessage.set('');
  }

  private passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

}