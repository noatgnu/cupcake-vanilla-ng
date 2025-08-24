import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { 
  LabGroup, 
  LabGroupQueryResponse,
  LabGroupCreateRequest,
  LabGroupMember,
  LabGroupInvitation,
  LabGroupInvitationCreateRequest
} from '../../../models';
import { ApiService } from '../../../services/api';
import { ToastService } from '../../../services/toast';

@Component({
  selector: 'app-lab-groups',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbModule],
  templateUrl: './lab-groups.html',
  styleUrls: ['./lab-groups.scss']
})
export class LabGroupsComponent implements OnInit {
  searchForm: FormGroup;
  createGroupForm: FormGroup;
  inviteForm: FormGroup;
  
  // Signals for reactive state management
  private searchParams = signal({
    search: '',
    limit: 10,
    offset: 0
  });

  // State signals
  isLoading = signal(false);
  isCreatingGroup = signal(false);
  isInviting = signal(false);
  currentPage = signal(1);
  pageSize = signal(10);
  totalItems = signal(0);
  
  // Data signals
  labGroupsData = signal<LabGroupQueryResponse>({ count: 0, results: [] });
  selectedGroup = signal<LabGroup | null>(null);
  groupMembers = signal<LabGroupMember[]>([]);
  pendingInvitations = signal<LabGroupInvitation[]>([]);
  
  // UI state
  showCreateForm = signal(false);
  showInviteForm = signal(false);
  selectedGroupForMembers = signal<LabGroup | null>(null);

  // Computed values
  hasLabGroups = computed(() => this.labGroupsData().results.length > 0);
  showPagination = computed(() => this.labGroupsData().count > this.pageSize());

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private modalService: NgbModal,
    private toastService: ToastService
  ) {
    this.searchForm = this.fb.group({
      search: ['']
    });

    this.createGroupForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      allow_member_invites: [true]
    });

    this.inviteForm = this.fb.group({
      invited_email: ['', [Validators.required, Validators.email]],
      message: ['']
    });

    // Effect to automatically reload lab groups when search params change
    effect(() => {
      const params = this.searchParams();
      this.loadLabGroupsWithParams(params);
    });
  }

  ngOnInit() {
    this.setupSearch();
    this.loadInitialData();
  }

  private loadInitialData() {
    this.searchParams.set({
      search: '',
      limit: this.pageSize(),
      offset: 0
    });
  }

  private setupSearch() {
    this.searchForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(formValue => {
      this.currentPage.set(1);
      
      this.searchParams.set({
        search: formValue.search || '',
        limit: this.pageSize(),
        offset: 0
      });
    });
  }

  private loadLabGroupsWithParams(params: any) {
    this.isLoading.set(true);
    
    this.apiService.getLabGroups({
      search: params.search || undefined,
      limit: params.limit,
      offset: params.offset
    }).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.totalItems.set(response.count);
        this.labGroupsData.set(response);
      },
      error: (error) => {
        this.isLoading.set(false);
        console.error('Error loading lab groups:', error);
        this.labGroupsData.set({ count: 0, results: [] });
      }
    });
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.searchParams.update(params => ({
      ...params,
      offset: (page - 1) * this.pageSize()
    }));
  }

  toggleCreateForm() {
    this.showCreateForm.update(show => !show);
    if (!this.showCreateForm()) {
      this.createGroupForm.reset({
        name: '',
        description: '',
        allow_member_invites: true
      });
    }
  }

  createLabGroup() {
    if (this.createGroupForm.valid) {
      this.isCreatingGroup.set(true);
      const formValue = this.createGroupForm.value as LabGroupCreateRequest;
      
      this.apiService.createLabGroup(formValue).subscribe({
        next: (newGroup) => {
          this.isCreatingGroup.set(false);
          console.log('Lab group created:', newGroup);
          this.toastService.success(`Lab group "${newGroup.name}" created successfully!`);
          this.toggleCreateForm();
          this.refreshLabGroups();
        },
        error: (error) => {
          this.isCreatingGroup.set(false);
          console.error('Error creating lab group:', error);
          const errorMsg = error?.error?.detail || error?.message || 'Failed to create lab group. Please try again.';
          this.toastService.error(errorMsg);
        }
      });
    }
  }

  viewGroupMembers(group: LabGroup) {
    this.selectedGroupForMembers.set(group);
    this.loadGroupMembers(group.id);
    this.loadPendingInvitations(group.id);
  }

  private loadGroupMembers(groupId: number) {
    this.apiService.getLabGroupMembers(groupId).subscribe({
      next: (members) => {
        this.groupMembers.set(members);
      },
      error: (error) => {
        console.error('Error loading group members:', error);
        this.groupMembers.set([]);
      }
    });
  }

  private loadPendingInvitations(groupId: number) {
    this.apiService.getLabGroupInvitations({
      lab_group: groupId,
      status: 'pending'
    }).subscribe({
      next: (response) => {
        this.pendingInvitations.set(response.results);
      },
      error: (error) => {
        console.error('Error loading pending invitations:', error);
        this.pendingInvitations.set([]);
      }
    });
  }

  toggleInviteForm() {
    this.showInviteForm.update(show => !show);
    if (!this.showInviteForm()) {
      this.inviteForm.reset();
    }
  }

  inviteMember() {
    if (this.inviteForm.valid && this.selectedGroupForMembers()) {
      this.isInviting.set(true);
      const groupId = this.selectedGroupForMembers()!.id;
      
      this.apiService.inviteUserToLabGroup(groupId, {
        lab_group: groupId,
        invited_email: this.inviteForm.value.invited_email,
        message: this.inviteForm.value.message || undefined
      }).subscribe({
        next: (invitation) => {
          this.isInviting.set(false);
          console.log('Invitation sent:', invitation);
          this.toastService.success(`Invitation sent to ${invitation.invited_email}!`);
          this.toggleInviteForm();
          this.loadPendingInvitations(groupId);
        },
        error: (error) => {
          this.isInviting.set(false);
          console.error('Error sending invitation:', error);
          const errorMsg = error?.error?.detail || error?.message || 'Failed to send invitation. Please try again.';
          this.toastService.error(errorMsg);
        }
      });
    }
  }

  removeMember(userId: number) {
    const group = this.selectedGroupForMembers();
    if (!group) return;

    const confirmMessage = `Are you sure you want to remove this member from "${group.name}"?`;
    
    if (confirm(confirmMessage)) {
      this.apiService.removeMemberFromLabGroup(group.id, userId).subscribe({
        next: (response) => {
          console.log(response.message);
          this.loadGroupMembers(group.id);
        },
        error: (error) => {
          console.error('Error removing member:', error);
          const errorMsg = error?.error?.detail || error?.message || 'Failed to remove member. Please try again.';
          this.toastService.error(errorMsg);
        }
      });
    }
  }

  cancelInvitation(invitationId: number) {
    const confirmMessage = 'Are you sure you want to cancel this invitation?';
    
    if (confirm(confirmMessage)) {
      this.apiService.cancelLabGroupInvitation(invitationId).subscribe({
        next: (response) => {
          console.log(response.message);
          const group = this.selectedGroupForMembers();
          if (group) {
            this.loadPendingInvitations(group.id);
          }
        },
        error: (error) => {
          console.error('Error canceling invitation:', error);
          const errorMsg = error?.error?.detail || error?.message || 'Failed to cancel invitation. Please try again.';
          this.toastService.error(errorMsg);
        }
      });
    }
  }

  leaveGroup(group: LabGroup) {
    const confirmMessage = `Are you sure you want to leave "${group.name}"?`;
    
    if (confirm(confirmMessage)) {
      this.apiService.leaveLabGroup(group.id).subscribe({
        next: (response) => {
          console.log(response.message);
          this.refreshLabGroups();
          this.selectedGroupForMembers.set(null);
        },
        error: (error) => {
          console.error('Error leaving group:', error);
          const errorMsg = error?.error?.detail || error?.message || 'Failed to leave group. Please try again.';
          this.toastService.error(errorMsg);
        }
      });
    }
  }

  deleteGroup(group: LabGroup) {
    const confirmMessage = `Are you sure you want to delete the lab group "${group.name}"?\n\nThis action cannot be undone.`;
    
    if (confirm(confirmMessage)) {
      this.apiService.deleteLabGroup(group.id).subscribe({
        next: () => {
          console.log('Lab group deleted successfully');
          this.refreshLabGroups();
          this.selectedGroupForMembers.set(null);
        },
        error: (error) => {
          console.error('Error deleting lab group:', error);
          const errorMsg = error?.error?.detail || error?.message || 'Failed to delete lab group. Please try again.';
          this.toastService.error(errorMsg);
        }
      });
    }
  }

  private refreshLabGroups() {
    this.searchParams.update(params => ({ ...params }));
  }

  closeGroupDetails() {
    this.selectedGroupForMembers.set(null);
    this.groupMembers.set([]);
    this.pendingInvitations.set([]);
    this.showInviteForm.set(false);
  }
}
