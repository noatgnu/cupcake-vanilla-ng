import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ResourceService } from './resource';
import {
  MetadataColumn,
  MetadataColumnTemplate,
  FavouriteMetadataOption,
  LabGroup,
  LabGroupQueryResponse,
  LabGroupCreateRequest,
  LabGroupInvitation,
  LabGroupInvitationQueryResponse,
  LabGroupInvitationCreateRequest,
  LabGroupMember,
  MetadataTable,
  MetadataTableQueryResponse,
  MetadataTableCreateRequest,
  MetadataTableTemplate,
  MetadataTableTemplateQueryResponse,
  OntologySuggestion,
  OntologySuggestionResponse,
  SamplePool,
  SamplePoolCreateRequest,
  SiteConfig,
  AuthConfig,
  RegistrationStatus,
  User,
  UserCreateRequest,
  UserRegistrationRequest,
  UserResponse,
  UserListResponse,
  PasswordChangeRequest,
  PasswordChangeResponse,
  AdminPasswordResetRequest,
  PasswordResetRequest,
  PasswordResetConfirm,
  UserProfileUpdateRequest,
  EmailChangeRequest,
  EmailChangeConfirm
} from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl || 'http://localhost:8000/api/v1';
  private resourceService = inject(ResourceService);

  constructor(private http: HttpClient) {}

  get baseUrl(): string {
    return this.apiUrl;
  }

  // User Profile
  getUserProfile(): Observable<{user: any}> {
    return this.http.get<{user: any}>(`${this.apiUrl}/auth/profile/`);
  }

  // Lab Groups
  getLabGroups(params?: {
    search?: string;
    limit?: number;
    offset?: number;
  }): Observable<LabGroupQueryResponse> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof typeof params];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    return this.http.get<any>(`${this.apiUrl}/lab-groups/`, { params: httpParams }).pipe(
      map(response => ({
        ...response,
        results: response.results.map((labGroup: any) => this.resourceService.transformLegacyResource(labGroup))
      }))
    );
  }

  // Get lab groups that the current user is a member of
  getMyLabGroups(params?: {
    search?: string;
    limit?: number;
    offset?: number;
  }): Observable<LabGroupQueryResponse> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof typeof params];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    return this.http.get<any>(`${this.apiUrl}/lab-groups/my_groups/`, { params: httpParams }).pipe(
      map(response => ({
        ...response,
        results: response.results.map((labGroup: any) => this.resourceService.transformLegacyResource(labGroup))
      }))
    );
  }

  createLabGroup(labGroup: LabGroupCreateRequest): Observable<LabGroup> {
    return this.http.post<any>(`${this.apiUrl}/lab-groups/`, labGroup).pipe(
      map(response => this.resourceService.transformLegacyResource(response))
    );
  }

  updateLabGroup(id: number, labGroup: Partial<LabGroup>): Observable<LabGroup> {
    const preparedData = this.resourceService.prepareForAPI(labGroup);
    return this.http.patch<any>(`${this.apiUrl}/lab-groups/${id}/`, preparedData).pipe(
      map(response => this.resourceService.transformLegacyResource(response))
    );
  }

  deleteLabGroup(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/lab-groups/${id}/`);
  }

  getLabGroupMembers(id: number): Observable<LabGroupMember[]> {
    return this.http.get<LabGroupMember[]>(`${this.apiUrl}/lab-groups/${id}/members/`);
  }

  inviteUserToLabGroup(id: number, invitation: LabGroupInvitationCreateRequest): Observable<LabGroupInvitation> {
    return this.http.post<LabGroupInvitation>(`${this.apiUrl}/lab-groups/${id}/invite_user/`, invitation);
  }

  removeMemberFromLabGroup(id: number, userId: number): Observable<{message: string}> {
    return this.http.post<{message: string}>(`${this.apiUrl}/lab-groups/${id}/remove_member/`, { user_id: userId });
  }

  leaveLabGroup(id: number): Observable<{message: string}> {
    return this.http.post<{message: string}>(`${this.apiUrl}/lab-groups/${id}/leave_group/`, {});
  }

  // Lab Group Invitations
  getLabGroupInvitations(params?: {
    lab_group?: number;
    status?: string;
    limit?: number;
    offset?: number;
  }): Observable<LabGroupInvitationQueryResponse> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof typeof params];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    return this.http.get<LabGroupInvitationQueryResponse>(`${this.apiUrl}/lab-group-invitations/`, { params: httpParams });
  }

  getMyPendingInvitations(): Observable<LabGroupInvitation[]> {
    return this.http.get<LabGroupInvitation[]>(`${this.apiUrl}/lab-group-invitations/my_pending_invitations/`);
  }

  acceptLabGroupInvitation(id: number): Observable<{message: string, invitation: LabGroupInvitation}> {
    return this.http.post<{message: string, invitation: LabGroupInvitation}>(`${this.apiUrl}/lab-group-invitations/${id}/accept_invitation/`, {});
  }

  rejectLabGroupInvitation(id: number): Observable<{message: string, invitation: LabGroupInvitation}> {
    return this.http.post<{message: string, invitation: LabGroupInvitation}>(`${this.apiUrl}/lab-group-invitations/${id}/reject_invitation/`, {});
  }

  cancelLabGroupInvitation(id: number): Observable<{message: string}> {
    return this.http.post<{message: string}>(`${this.apiUrl}/lab-group-invitations/${id}/cancel_invitation/`, {});
  }

  // Metadata Table Templates
  getMetadataTableTemplates(params?: {
    search?: string;
    lab_group_id?: number;
    user_id?: number;
    visibility?: string;
    is_default?: boolean;
    limit?: number;
    offset?: number;
  }): Observable<MetadataTableTemplateQueryResponse> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof typeof params];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    return this.http.get<any>(`${this.apiUrl}/metadata-table-templates/`, { params: httpParams }).pipe(
      map(response => ({
        ...response,
        results: response.results.map((template: any) => this.resourceService.transformLegacyResource(template))
      }))
    );
  }

  getMetadataTableTemplate(id: number): Observable<MetadataTableTemplate> {
    return this.http.get<any>(`${this.apiUrl}/metadata-table-templates/${id}/`).pipe(
      map(response => this.resourceService.transformLegacyResource(response))
    );
  }

  createMetadataTableTemplate(template: Partial<MetadataTableTemplate>): Observable<MetadataTableTemplate> {
    const preparedData = this.resourceService.prepareForAPI(template);
    return this.http.post<any>(`${this.apiUrl}/metadata-table-templates/`, preparedData).pipe(
      map(response => this.resourceService.transformLegacyResource(response))
    );
  }

  updateMetadataTableTemplate(id: number, template: Partial<MetadataTableTemplate>): Observable<MetadataTableTemplate> {
    const preparedData = this.resourceService.prepareForAPI(template);
    return this.http.patch<any>(`${this.apiUrl}/metadata-table-templates/${id}/`, preparedData).pipe(
      map(response => this.resourceService.transformLegacyResource(response))
    );
  }

  deleteMetadataTableTemplate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/metadata-table-templates/${id}/`);
  }

  // Add column to template with automatic reordering
  addColumnWithAutoReorderToTemplate(templateId: number, columnData: {
    column_data: Partial<MetadataColumn>;
    position?: number;
    auto_reorder?: boolean;
  }): Observable<{
    message: string;
    column: MetadataColumn;
    reordered: boolean;
    schema_ids_used: number[];
  }> {
    return this.http.post<{
      message: string;
      column: MetadataColumn;
      reordered: boolean;
      schema_ids_used: number[];
    }>(`${this.apiUrl}/metadata-table-templates/${templateId}/add_column_with_auto_reorder/`, columnData);
  }

  // Schema-based template creation
  getAvailableSchemas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/schemas/available/`);
  }

  // Schema management
  getSchemas(params?: {
    search?: string;
    is_builtin?: boolean;
    is_active?: boolean;
    is_public?: boolean;
    tags?: string;
    limit?: number;
    offset?: number;
  }): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof typeof params];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    return this.http.get<any>(`${this.apiUrl}/schemas/`, { params: httpParams });
  }

  getSchema(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/schemas/${id}/`);
  }

  createMetadataTableTemplateFromSchema(data: {
    name: string;
    schema_ids?: number[];
    schemas?: string[]; // Legacy support
    description?: string;
    lab_group_id?: number;
    is_public?: boolean;
    is_default?: boolean;
  }): Observable<MetadataTableTemplate> {
    return this.http.post<MetadataTableTemplate>(`${this.apiUrl}/metadata-table-templates/create_from_schema/`, data);
  }

  // Column Templates
  getColumnTemplates(params?: {
    lab_group_id?: number;
    is_global?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }): Observable<{count: number, results: MetadataColumnTemplate[]}> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof typeof params];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    return this.http.get<{count: number, results: MetadataColumnTemplate[]}>(`${this.apiUrl}/column-templates/`, { params: httpParams });
  }

  createColumnTemplate(template: Partial<MetadataColumnTemplate>): Observable<MetadataColumnTemplate> {
    return this.http.post<MetadataColumnTemplate>(`${this.apiUrl}/column-templates/`, template);
  }

  updateColumnTemplate(id: number, template: Partial<MetadataColumnTemplate>): Observable<MetadataColumnTemplate> {
    return this.http.patch<MetadataColumnTemplate>(`${this.apiUrl}/column-templates/${id}/`, template);
  }

  deleteColumnTemplate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/column-templates/${id}/`);
  }

  // Metadata Tables
  getMetadataTables(params?: {
    search?: string;
    lab_group_id?: number;
    owner_id?: number;
    is_locked?: boolean;
    is_published?: boolean;
    limit?: number;
    offset?: number;
  }): Observable<MetadataTableQueryResponse> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof typeof params];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    return this.http.get<any>(`${this.apiUrl}/metadata-tables/`, { params: httpParams }).pipe(
      map(response => ({
        ...response,
        results: response.results.map((table: any) => this.resourceService.transformLegacyResource(table))
      }))
    );
  }

  getMetadataTable(id: number): Observable<MetadataTable> {
    return this.http.get<any>(`${this.apiUrl}/metadata-tables/${id}/`).pipe(
      map(response => this.resourceService.transformLegacyResource(response))
    );
  }

  createMetadataTable(table: MetadataTableCreateRequest): Observable<MetadataTable> {
    const preparedData = this.resourceService.prepareForAPI(table);
    return this.http.post<any>(`${this.apiUrl}/metadata-tables/`, preparedData).pipe(
      map(response => this.resourceService.transformLegacyResource(response))
    );
  }

  updateMetadataTable(id: number, table: Partial<MetadataTable>): Observable<MetadataTable> {
    const preparedData = this.resourceService.prepareForAPI(table);
    return this.http.patch<any>(`${this.apiUrl}/metadata-tables/${id}/`, preparedData).pipe(
      map(response => this.resourceService.transformLegacyResource(response))
    );
  }

  deleteMetadataTable(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/metadata-tables/${id}/`);
  }

  // Add column with automatic reordering
  addColumnWithAutoReorder(tableId: number, columnData: {
    column_data: Partial<MetadataColumn>;
    position?: number;
    auto_reorder?: boolean;
  }): Observable<{
    message: string;
    column: MetadataColumn;
    reordered: boolean;
    schema_ids_used: number[];
  }> {
    return this.http.post<{
      message: string;
      column: MetadataColumn;
      reordered: boolean;
      schema_ids_used: number[];
    }>(`${this.apiUrl}/metadata-tables/${tableId}/add_column_with_auto_reorder/`, columnData);
  }

  // Sample Pool Management
  getSamplePool(id: number): Observable<SamplePool> {
    return this.http.get<SamplePool>(`${this.apiUrl}/sample-pools/${id}/`);
  }

  createSamplePool(data: SamplePoolCreateRequest): Observable<SamplePool> {
    return this.http.post<SamplePool>(`${this.apiUrl}/sample-pools/`, data);
  }

  updateSamplePool(id: number, pool: Partial<SamplePool>): Observable<SamplePool> {
    return this.http.patch<SamplePool>(`${this.apiUrl}/sample-pools/${id}/`, pool);
  }

  deleteSamplePool(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/sample-pools/${id}/`);
  }

  // Create metadata table from template
  createMetadataTableFromTemplate(data: {
    name: string;
    template_id: number;
    sample_count?: number;
    description?: string;
    lab_group_id?: number;
  }): Observable<MetadataTable> {
    return this.http.post<MetadataTable>(`${this.apiUrl}/metadata-table-templates/create_table_from_template/`, data);
  }

  // Create metadata table from schemas
  createMetadataTableFromSchemas(data: {
    name: string;
    schema_ids?: number[];
    schemas?: string[]; // Legacy support
    sample_count?: number;
    description?: string;
    lab_group_id?: number;
  }): Observable<MetadataTable> {
    return this.http.post<MetadataTable>(`${this.apiUrl}/metadata-table-templates/create_table_from_schemas/`, data);
  }

  // SDRF Import/Export
  importSdrfFile(data: {
    file: File;
    metadata_table_id: number;
    import_type?: 'user_metadata' | 'staff_metadata' | 'both';
    create_pools?: boolean;
    replace_existing?: boolean;
  }): Observable<any> {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('metadata_table_id', data.metadata_table_id.toString());
    if (data.import_type) formData.append('import_type', data.import_type);
    if (data.create_pools !== undefined) formData.append('create_pools', data.create_pools.toString());
    if (data.replace_existing !== undefined) formData.append('replace_existing', data.replace_existing.toString());

    return this.http.post(`${this.apiUrl}/metadata-management/import_sdrf_file/`, formData);
  }

  importExcelFile(data: {
    file: File;
    metadata_table_id: number;
    import_type?: 'user_metadata' | 'staff_metadata' | 'both';
    create_pools?: boolean;
    replace_existing?: boolean;
  }): Observable<any> {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('metadata_table_id', data.metadata_table_id.toString());
    if (data.import_type) formData.append('import_type', data.import_type);
    if (data.create_pools !== undefined) formData.append('create_pools', data.create_pools.toString());
    if (data.replace_existing !== undefined) formData.append('replace_existing', data.replace_existing.toString());

    return this.http.post(`${this.apiUrl}/metadata-management/import_excel_file/`, formData);
  }

  exportExcelTemplate(data: {
    metadata_table_id: number;
    metadata_column_ids: number[];
    sample_number: number;
    export_format?: 'excel' | 'sdrf';
    include_pools?: boolean;
    pool_ids?: number[];
    lab_group_ids?: number[];
  }): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/metadata-management/export_excel_template/`, data, {
      responseType: 'blob'
    });
  }

  exportSdrfFile(data: {
    metadata_table_id: number;
    metadata_column_ids: number[];
    sample_number: number;
    export_format?: 'excel' | 'sdrf';
    include_pools?: boolean;
    pool_ids?: number[];
    lab_group_id?: number;
  }): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/metadata-management/export_sdrf_file/`, data, {
      responseType: 'blob'
    });
  }

  // Ontology Suggestions for existing metadata columns
  getMetadataColumnOntologySuggestions(columnId: number, params?: {
    search?: string;
    limit?: number;
    search_type?: 'icontains' | 'istartswith' | 'exact';
  }): Observable<any> {
    let httpParams = new HttpParams();
    httpParams = httpParams.set('column_id', columnId.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.search_type) httpParams = httpParams.set('search_type', params.search_type);

    return this.http.get<any>(`${this.apiUrl}/metadata-columns/ontology_suggestions/`,
      { params: httpParams });
  }

  // Delete metadata column
  deleteMetadataColumn(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/metadata-columns/${id}/`);
  }

  // Ontology Suggestions for metadata column templates (for the modal)
  getColumnTemplateOntologySuggestions(templateId: number, params?: {
    search?: string;
    limit?: number;
    search_type?: 'icontains' | 'istartswith';
  }): Observable<any> {
    let httpParams = new HttpParams();
    httpParams = httpParams.set('template_id', templateId.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.search_type) httpParams = httpParams.set('search_type', params.search_type);

    return this.http.get<any>(`${this.apiUrl}/column-templates/ontology_suggestions/`,
      { params: httpParams });
  }

  // Favourite Metadata Options
  getFavouriteMetadataOptions(params?: {
    name?: string;
    type?: string;
    user_id?: number;
    lab_group_id?: number;
    is_global?: boolean;
    limit?: number;
    offset?: number;
  }): Observable<{count: number, results: FavouriteMetadataOption[]}> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof typeof params];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    return this.http.get<{count: number, results: FavouriteMetadataOption[]}>(`${this.apiUrl}/favourite-options/`, { params: httpParams });
  }

  createFavouriteMetadataOption(option: Partial<FavouriteMetadataOption>): Observable<FavouriteMetadataOption> {
    return this.http.post<FavouriteMetadataOption>(`${this.apiUrl}/favourite-options/`, option);
  }

  updateFavouriteMetadataOption(id: number, option: Partial<FavouriteMetadataOption>): Observable<FavouriteMetadataOption> {
    return this.http.patch<FavouriteMetadataOption>(`${this.apiUrl}/favourite-options/${id}/`, option);
  }

  deleteFavouriteMetadataOption(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/favourite-options/${id}/`);
  }

  // Update metadata column value with automatic modifier calculation
  updateMetadataColumnValue(columnId: number, data: {
    value: string;
    sample_indices?: number[];
    value_type?: 'default' | 'sample_specific' | 'replace_all';
  }): Observable<{
    message: string;
    changes: {
      old_default: string;
      new_default: string;
      old_modifiers: any[];
      new_modifiers: any[];
      updated_samples: number[];
    };
    column: MetadataColumn;
    value_type: string;
  }> {
    return this.http.post<{
      message: string;
      changes: {
        old_default: string;
        new_default: string;
        old_modifiers: any[];
        new_modifiers: any[];
        updated_samples: number[];
      };
      column: MetadataColumn;
      value_type: string;
    }>(`${this.apiUrl}/metadata-columns/${columnId}/update_column_value/`, data);
  }

  updateMetadataColumn(columnId: number, data: Partial<MetadataColumn>): Observable<MetadataColumn> {
    return this.http.patch<MetadataColumn>(`${this.apiUrl}/metadata-columns/${columnId}/`, data);
  }

  // ===================================================================
  // SITE CONFIGURATION METHODS
  // ===================================================================

  getSiteConfig(): Observable<SiteConfig[]> {
    return this.http.get<SiteConfig[]>(`${this.apiUrl}/site_config/`);
  }

  updateSiteConfig(id: number, config: Partial<SiteConfig>): Observable<SiteConfig> {
    return this.http.patch<SiteConfig>(`${this.apiUrl}/site_config/${id}/`, config);
  }

  // ===================================================================
  // USER MANAGEMENT METHODS
  // ===================================================================

  // Admin-only user management
  getUsers(params?: {
    is_staff?: boolean;
    is_active?: boolean;
    search?: string;
    page?: number;
    page_size?: number;
  }): Observable<UserListResponse> {
    let httpParams = new HttpParams();
    if (params?.is_staff !== undefined) httpParams = httpParams.set('is_staff', params.is_staff.toString());
    if (params?.is_active !== undefined) httpParams = httpParams.set('is_active', params.is_active.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.page_size) httpParams = httpParams.set('page_size', params.page_size.toString());

    return this.http.get<UserListResponse>(`${this.apiUrl}/users/`, { params: httpParams });
  }

  getUser(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}/`);
  }

  createUser(userData: UserCreateRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.apiUrl}/users/admin_create/`, userData);
  }

  updateUser(id: number, userData: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/users/${id}/`, userData);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${id}/`);
  }

  // Public user registration
  registerUser(userData: UserRegistrationRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.apiUrl}/users/register/`, userData);
  }

  // Authentication configuration
  getAuthConfig(): Observable<AuthConfig> {
    return this.http.get<AuthConfig>(`${this.apiUrl}/users/auth_config/`);
  }

  getRegistrationStatus(): Observable<RegistrationStatus> {
    return this.http.get<RegistrationStatus>(`${this.apiUrl}/users/registration_status/`);
  }

  // ===================================================================
  // PASSWORD MANAGEMENT METHODS
  // ===================================================================

  // User password change (authenticated user)
  changePassword(passwordData: PasswordChangeRequest): Observable<PasswordChangeResponse> {
    return this.http.post<PasswordChangeResponse>(`${this.apiUrl}/users/change_password/`, passwordData);
  }

  // User profile update
  updateProfile(profileData: UserProfileUpdateRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.apiUrl}/users/update_profile/`, profileData);
  }

  // Email change with verification
  requestEmailChange(emailData: EmailChangeRequest): Observable<{message: string, new_email: string}> {
    return this.http.post<{message: string, new_email: string}>(`${this.apiUrl}/users/request_email_change/`, emailData);
  }

  confirmEmailChange(confirmData: EmailChangeConfirm): Observable<{message: string}> {
    return this.http.post<{message: string}>(`${this.apiUrl}/users/confirm_email_change/`, confirmData);
  }

  // Admin password reset
  resetUserPassword(userId: number, passwordData: AdminPasswordResetRequest): Observable<PasswordChangeResponse> {
    return this.http.post<PasswordChangeResponse>(`${this.apiUrl}/users/${userId}/reset_password/`, passwordData);
  }

  // Password reset request (forgot password)
  requestPasswordReset(resetData: PasswordResetRequest): Observable<PasswordChangeResponse> {
    return this.http.post<PasswordChangeResponse>(`${this.apiUrl}/users/request_password_reset/`, resetData);
  }

  // Confirm password reset with token
  confirmPasswordReset(confirmData: PasswordResetConfirm): Observable<PasswordChangeResponse> {
    return this.http.post<PasswordChangeResponse>(`${this.apiUrl}/users/confirm_password_reset/`, confirmData);
  }

  // ===================================================================
  // ACCOUNT LINKING METHODS
  // ===================================================================

  // Link ORCID to current user account
  linkOrcid(orcidData: { orcid_id: string; verification_code?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/users/link_orcid/`, orcidData);
  }

  // Unlink ORCID from current user account
  unlinkOrcid(): Observable<PasswordChangeResponse> {
    return this.http.delete<PasswordChangeResponse>(`${this.apiUrl}/users/unlink_orcid/`);
  }

  // Detect duplicate accounts
  detectDuplicateAccounts(searchData: {
    email?: string;
    orcid_id?: string;
    first_name?: string;
    last_name?: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/users/detect_duplicates/`, searchData);
  }

  // Request account merge
  requestAccountMerge(mergeData: {
    duplicate_user_id: number;
    reason: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/users/request_merge/`, mergeData);
  }
}
