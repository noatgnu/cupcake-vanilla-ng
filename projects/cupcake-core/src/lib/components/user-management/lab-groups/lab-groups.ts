import { Component, OnInit, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, NonNullableFormBuilder, FormGroup, Validators } from '@angular/forms';
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
import { LabGroupService } from '../../../services/lab-group';
import { ToastService } from '../../../services/toast';

@Component({
  selector: 'ccc-lab-groups',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbModule],
  templateUrl: './lab-groups.html',
  styleUrls: ['./lab-groups.scss']
})
export class LabGroupsComponent implements OnInit {
  // Inject services using modern inject() syntax
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly labGroupService = inject(LabGroupService);
  private readonly modalService = inject(NgbModal);
  private readonly toastService = inject(ToastService);

  // Forms
  searchForm: FormGroup;
  createGroupForm: FormGroup;
  inviteForm: FormGroup;
  
  // Signals for reactive state management
  private searchParams = signal<{
    search: string;
    limit: number;
    offset: number;
  }>({
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
  totalPages = computed(() => Math.ceil(this.labGroupsData().count / this.pageSize()));
  hasSearchValue = computed(() => (this.searchForm?.get('search')?.value || '').trim().length > 0);
  hasGroupMembers = computed(() => this.groupMembers().length > 0);
  hasPendingInvitations = computed(() => this.pendingInvitations().length > 0);
  canInviteToCurrentGroup = computed(() => this.selectedGroupForMembers()?.canInvite || false);
  canManageCurrentGroup = computed(() => this.selectedGroupForMembers()?.canManage || false);
  currentGroupName = computed(() => this.selectedGroupForMembers()?.name || '');
  groupMembersCount = computed(() => this.groupMembers().length);
  pendingInvitationsCount = computed(() => this.pendingInvitations().length);

  constructor() {
    this.searchForm = this.fb.group({
      search: ['']
    });

    this.createGroupForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      allowMemberInvites: [true]
    });

    this.inviteForm = this.fb.group({
      invitedEmail: ['', [Validators.required, Validators.email]],
      message: ['']
    });

    // Effect to automatically reload lab groups when search params change
    effect(() => {
      const params = this.searchParams();
      this.loadLabGroupsWithParams(params);
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    this.setupSearch();
    this.loadInitialData();
  }

  private loadInitialData(): void {
    this.searchParams.set({
      search: '',
      limit: this.pageSize(),
      offset: 0
    });
  }

  private setupSearch(): void {
    this.searchForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(formValue => {
      this.currentPage.set(1);
      
      this.searchParams.set({
        search: formValue.search?.trim() || '',
        limit: this.pageSize(),
        offset: 0
      });
    });
  }

  private loadLabGroupsWithParams(params: { search: string; limit: number; offset: number }): void {
    this.isLoading.set(true);
    
    this.labGroupService.getLabGroups({
      search: params.search || undefined,
      limit: params.limit,
      offset: params.offset
    }).subscribe({
      next: (response: LabGroupQueryResponse) => {
        this.isLoading.set(false);
        this.totalItems.set(response.count);
        this.labGroupsData.set(response);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.labGroupsData.set({ count: 0, results: [] });
        console.error('Error loading lab groups:', error);
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.searchParams.update(params => ({
      ...params,
      offset: (page - 1) * this.pageSize()
    }));
  }

  toggleCreateForm(): void {
    this.showCreateForm.update(show => !show);
    if (!this.showCreateForm()) {
      this.createGroupForm.reset({
        name: '',
        description: '',
        allowMemberInvites: true
      });
    }
  }

  createLabGroup(): void {
    if (this.createGroupForm.valid) {
      this.isCreatingGroup.set(true);
      const formValue = this.createGroupForm.value as LabGroupCreateRequest;
      
      this.labGroupService.createLabGroup(formValue).subscribe({
        next: (newGroup: LabGroup) => {
          this.isCreatingGroup.set(false);
          this.toastService.success(`Lab group "${newGroup.name}" created successfully!`);
          this.toggleCreateForm();
          this.refreshLabGroups();
        },
        error: (error) => {
          this.isCreatingGroup.set(false);
          const errorMsg = error?.error?.detail || error?.message || 'Failed to create lab group. Please try again.';
          this.toastService.error(errorMsg);
          console.error('Error creating lab group:', error);
        }
      });
    }
  }

  viewGroupMembers(group: LabGroup): void {
    this.selectedGroupForMembers.set(group);
    this.loadGroupMembers(group.id);
    this.loadPendingInvitations(group.id);
  }

  private loadGroupMembers(groupId: number): void {
    this.labGroupService.getLabGroupMembers(groupId).subscribe({
      next: (members: LabGroupMember[]) => {
        this.groupMembers.set(members);
      },
      error: (error) => {
        this.groupMembers.set([]);
        console.error('Error loading group members:', error);
      }
    });
  }

  private loadPendingInvitations(groupId: number): void {
    this.labGroupService.getLabGroupInvitations({
      labGroup: groupId,
      status: 'pending'
    }).subscribe({
      next: (response) => {
        this.pendingInvitations.set(response.results);
      },
      error: (error) => {
        this.pendingInvitations.set([]);
        console.error('Error loading pending invitations:', error);
      }
    });
  }

  toggleInviteForm(): void {
    this.showInviteForm.update(show => !show);
    if (!this.showInviteForm()) {
      this.inviteForm.reset();
    }
  }

  inviteMember(): void {
    if (this.inviteForm.valid && this.selectedGroupForMembers()) {
      this.isInviting.set(true);
      const groupId = this.selectedGroupForMembers()!.id;
      
      const inviteData: LabGroupInvitationCreateRequest = {
        labGroup: groupId,
        invitedEmail: this.inviteForm.value.invitedEmail,
        message: this.inviteForm.value.message || undefined
      };
      
      this.labGroupService.inviteUserToLabGroup(groupId, inviteData).subscribe({
        next: (invitation: LabGroupInvitation) => {
          this.isInviting.set(false);
          this.toastService.success(`Invitation sent to ${invitation.invitedEmail}!`);
          this.toggleInviteForm();
          this.loadPendingInvitations(groupId);
        },
        error: (error) => {
          this.isInviting.set(false);
          const errorMsg = error?.error?.detail || error?.message || 'Failed to send invitation. Please try again.';
          this.toastService.error(errorMsg);
          console.error('Error sending invitation:', error);
        }
      });
    }
  }

  removeMember(userId: number): void {
    const group = this.selectedGroupForMembers();
    if (!group) return;

    const confirmMessage = `Are you sure you want to remove this member from "${group.name}"?`;
    
    if (confirm(confirmMessage)) {
      this.labGroupService.removeMemberFromLabGroup(group.id, userId).subscribe({
        next: (response: {message: string}) => {
          this.loadGroupMembers(group.id);
          this.toastService.success('Member removed successfully!');
        },
        error: (error) => {
          const errorMsg = error?.error?.detail || error?.message || 'Failed to remove member. Please try again.';
          this.toastService.error(errorMsg);
          console.error('Error removing member:', error);
        }
      });
    }
  }

  cancelInvitation(invitationId: number): void {
    const confirmMessage = 'Are you sure you want to cancel this invitation?';
    
    if (confirm(confirmMessage)) {
      this.labGroupService.cancelLabGroupInvitation(invitationId).subscribe({
        next: (response) => {
          const group = this.selectedGroupForMembers();
          if (group) {
            this.loadPendingInvitations(group.id);
          }
          this.toastService.success('Invitation cancelled successfully!');
        },
        error: (error) => {
          const errorMsg = error?.error?.detail || error?.message || 'Failed to cancel invitation. Please try again.';
          this.toastService.error(errorMsg);
          console.error('Error cancelling invitation:', error);
        }
      });
    }
  }

  leaveGroup(group: LabGroup): void {
    const confirmMessage = `Are you sure you want to leave "${group.name}"?`;
    
    if (confirm(confirmMessage)) {
      this.labGroupService.leaveLabGroup(group.id).subscribe({
        next: (response) => {
          this.refreshLabGroups();
          this.selectedGroupForMembers.set(null);
          this.toastService.success(`Successfully left "${group.name}"!`);
        },
        error: (error) => {
          const errorMsg = error?.error?.detail || error?.message || 'Failed to leave group. Please try again.';
          this.toastService.error(errorMsg);
          console.error('Error leaving group:', error);
        }
      });
    }
  }

  deleteGroup(group: LabGroup): void {
    const confirmMessage = `Are you sure you want to delete the lab group "${group.name}"?\n\nThis action cannot be undone.`;
    
    if (confirm(confirmMessage)) {
      this.labGroupService.deleteLabGroup(group.id).subscribe({
        next: () => {
          this.refreshLabGroups();
          this.selectedGroupForMembers.set(null);
          this.toastService.success(`Lab group "${group.name}" deleted successfully!`);
        },
        error: (error) => {
          const errorMsg = error?.error?.detail || error?.message || 'Failed to delete lab group. Please try again.';
          this.toastService.error(errorMsg);
          console.error('Error deleting group:', error);
        }
      });
    }
  }

  private refreshLabGroups(): void {
    this.searchParams.update(params => ({ ...params }));
  }

  closeGroupDetails(): void {
    this.selectedGroupForMembers.set(null);
    this.groupMembers.set([]);
    this.pendingInvitations.set([]);
    this.showInviteForm.set(false);
  }
}
