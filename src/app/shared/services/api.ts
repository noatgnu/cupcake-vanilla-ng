import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
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
  MetadataTableTemplateQueryResponse
} from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl || 'http://localhost:8000/api/v1';

  constructor(private http: HttpClient) {}

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
    return this.http.get<LabGroupQueryResponse>(`${this.apiUrl}/lab-groups/`, { params: httpParams });
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
    return this.http.get<LabGroupQueryResponse>(`${this.apiUrl}/lab-groups/my_groups/`, { params: httpParams });
  }

  createLabGroup(labGroup: LabGroupCreateRequest): Observable<LabGroup> {
    return this.http.post<LabGroup>(`${this.apiUrl}/lab-groups/`, labGroup);
  }

  updateLabGroup(id: number, labGroup: Partial<LabGroup>): Observable<LabGroup> {
    return this.http.patch<LabGroup>(`${this.apiUrl}/lab-groups/${id}/`, labGroup);
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
    is_public?: boolean;
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
    return this.http.get<MetadataTableTemplateQueryResponse>(`${this.apiUrl}/metadata-table-templates/`, { params: httpParams });
  }

  getMetadataTableTemplate(id: number): Observable<MetadataTableTemplate> {
    return this.http.get<MetadataTableTemplate>(`${this.apiUrl}/metadata-table-templates/${id}/`);
  }

  createMetadataTableTemplate(template: Partial<MetadataTableTemplate>): Observable<MetadataTableTemplate> {
    return this.http.post<MetadataTableTemplate>(`${this.apiUrl}/metadata-table-templates/`, template);
  }

  updateMetadataTableTemplate(id: number, template: Partial<MetadataTableTemplate>): Observable<MetadataTableTemplate> {
    return this.http.patch<MetadataTableTemplate>(`${this.apiUrl}/metadata-table-templates/${id}/`, template);
  }

  deleteMetadataTableTemplate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/metadata-table-templates/${id}/`);
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
    creator_id?: number;
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
    return this.http.get<MetadataTableQueryResponse>(`${this.apiUrl}/metadata-tables/`, { params: httpParams });
  }

  getMetadataTable(id: number): Observable<MetadataTable> {
    return this.http.get<MetadataTable>(`${this.apiUrl}/metadata-tables/${id}/`);
  }

  createMetadataTable(table: MetadataTableCreateRequest): Observable<MetadataTable> {
    return this.http.post<MetadataTable>(`${this.apiUrl}/metadata-tables/`, table);
  }

  updateMetadataTable(id: number, table: Partial<MetadataTable>): Observable<MetadataTable> {
    return this.http.patch<MetadataTable>(`${this.apiUrl}/metadata-tables/${id}/`, table);
  }

  deleteMetadataTable(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/metadata-tables/${id}/`);
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

    return this.http.post(`${this.apiUrl}/metadata-tables/import_sdrf_file/`, formData);
  }

  exportSdrfFile(data: {
    metadata_column_ids: number[];
    sample_number: number;
    export_format?: 'excel' | 'csv' | 'sdrf';
    include_pools?: boolean;
    pool_ids?: number[];
    lab_group_id?: number;
  }): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/metadata-tables/export_sdrf_file/`, data, {
      responseType: 'blob'
    });
  }
}
