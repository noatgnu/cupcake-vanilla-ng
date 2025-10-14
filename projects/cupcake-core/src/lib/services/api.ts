import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResourceService } from './resource';
import {
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
  PasswordResetConfirmRequest,
  UserProfileUpdateRequest,
  EmailChangeRequest,
  EmailChangeConfirmRequest,
  Annotation,
  AnnotationFolder,
  AnnotationCreateRequest,
  AnnotationUpdateRequest,
  AnnotationFolderCreateRequest,
  AnnotationFolderUpdateRequest,
  ResourcePermission,
  ResourcePermissionCreateRequest,
  ResourcePermissionUpdateRequest,
  BulkPermissionRequest,
  RemoteHost,
  RemoteHostCreateRequest,
  RemoteHostUpdateRequest
} from '../models';
import { CUPCAKE_CORE_CONFIG } from './auth';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private config = inject(CUPCAKE_CORE_CONFIG);
  private apiUrl = this.config.apiUrl;
  private resourceService = inject(ResourceService);

  constructor(private http: HttpClient) {}

  // ===== SYSTEMATIC CASE TRANSFORMATION METHODS =====

  /**
   * Transform camelCase object to snake_case for API requests
   */
  private transformToSnakeCase(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.transformToSnakeCase(item));
    }

    const transformed: any = {};
    Object.entries(obj).forEach(([key, value]) => {
      // Convert camelCase to snake_case
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      transformed[snakeKey] = this.transformToSnakeCase(value);
    });

    return transformed;
  }

  /**
   * Transform snake_case object to camelCase for TypeScript interfaces
   */
  private transformToCamelCase(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.transformToCamelCase(item));
    }

    const transformed: any = {};
    Object.entries(obj).forEach(([key, value]) => {
      // Convert snake_case to camelCase
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      transformed[camelKey] = this.transformToCamelCase(value);
    });

    return transformed;
  }

  /**
   * Make HTTP GET request with automatic snake_case to camelCase transformation
   */
  public get<T>(url: string, options?: any): Observable<T> {
    return this.http.get(url, options).pipe(
      map(response => this.transformToCamelCase(response) as T)
    );
  }

  /**
   * Make HTTP POST request with automatic camelCase to snake_case transformation
   */
  public post<T>(url: string, body: any, options?: any): Observable<T> {
    const transformedBody = this.transformToSnakeCase(body);
    return this.http.post(url, transformedBody, options).pipe(
      map(response => this.transformToCamelCase(response) as T)
    );
  }

  /**
   * Make HTTP PUT request with automatic camelCase to snake_case transformation
   */
  public put<T>(url: string, body: any, options?: any): Observable<T> {
    const transformedBody = this.transformToSnakeCase(body);
    return this.http.put(url, transformedBody, options).pipe(
      map(response => this.transformToCamelCase(response) as T)
    );
  }

  /**
   * Make HTTP PATCH request with automatic camelCase to snake_case transformation
   */
  public patch<T>(url: string, body: any, options?: any): Observable<T> {
    const transformedBody = this.transformToSnakeCase(body);
    return this.http.patch(url, transformedBody, options).pipe(
      map(response => this.transformToCamelCase(response) as T)
    );
  }

  /**
   * Make HTTP DELETE request with automatic snake_case to camelCase transformation
   */
  public delete<T>(url: string, options?: any): Observable<T> {
    return this.http.delete(url, options).pipe(
      map(response => this.transformToCamelCase(response) as T)
    );
  }

  // USER PROFILE
  getUserProfile(): Observable<{user: any}> {
    return this.http.get<{user: any}>(`${this.apiUrl}/auth/profile/`);
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
    isStaff?: boolean;
    isActive?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }): Observable<UserListResponse> {
    let httpParams = new HttpParams();
    if (params?.isStaff !== undefined) httpParams = httpParams.set('is_staff', params.isStaff.toString());
    if (params?.isActive !== undefined) httpParams = httpParams.set('is_active', params.isActive.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.offset !== undefined) httpParams = httpParams.set('offset', params.offset.toString());

    return this.http.get<UserListResponse>(`${this.apiUrl}/users/`, { params: httpParams });
  }

  getUser(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}/`);
  }

  createUser(userData: UserCreateRequest): Observable<UserResponse> {
    return this.post<UserResponse>(`${this.apiUrl}/users/admin_create/`, userData);
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

  confirmEmailChange(confirmData: EmailChangeConfirmRequest): Observable<{message: string}> {
    return this.http.post<{message: string}>(`${this.apiUrl}/users/confirm_email_change/`, confirmData);
  }

  // Admin password reset
  resetUserPassword(userId: number, passwordData: AdminPasswordResetRequest): Observable<PasswordChangeResponse> {
    const apiData = {
      user_id: passwordData.userId,
      new_password: passwordData.newPassword,
      confirm_password: passwordData.confirmPassword,
      force_password_change: passwordData.forcePasswordChange,
      reason: passwordData.reason
    };
    return this.http.post<PasswordChangeResponse>(`${this.apiUrl}/users/${userId}/reset_password/`, apiData);
  }

  // Password reset request (forgot password)
  requestPasswordReset(resetData: PasswordResetRequest): Observable<PasswordChangeResponse> {
    return this.http.post<PasswordChangeResponse>(`${this.apiUrl}/users/request_password_reset/`, resetData);
  }

  // Confirm password reset with token
  confirmPasswordReset(confirmData: PasswordResetConfirmRequest): Observable<PasswordChangeResponse> {
    return this.http.post<PasswordChangeResponse>(`${this.apiUrl}/users/confirm_password_reset/`, confirmData);
  }

  // ===================================================================
  // ACCOUNT LINKING METHODS
  // ===================================================================

  // Link ORCID to current user account
  linkOrcid(orcidData: { orcidId: string; verificationCode?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/users/link_orcid/`, orcidData);
  }

  // Unlink ORCID from current user account
  unlinkOrcid(): Observable<PasswordChangeResponse> {
    return this.http.delete<PasswordChangeResponse>(`${this.apiUrl}/users/unlink_orcid/`);
  }

  // Detect duplicate accounts
  detectDuplicateAccounts(searchData: {
    email?: string;
    orcidId?: string;
    firstName?: string;
    lastName?: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/users/detect_duplicates/`, searchData);
  }

  // Request account merge
  requestAccountMerge(mergeData: {
    duplicateUserId: number;
    reason: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/users/request_merge/`, mergeData);
  }

  // ANNOTATION MANAGEMENT

  getAnnotationFolders(params?: {
    search?: string;
    parentFolder?: number;
    isSharedDocumentFolder?: boolean;
    labGroup?: number;
    limit?: number;
    offset?: number;
  }): Observable<{count: number, results: AnnotationFolder[]}> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof typeof params];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    return this.http.get<any>(`${this.apiUrl}/annotation-folders/`, { params: httpParams }).pipe(
      map(response => ({
        ...response,
        results: response.results.map((folder: any) => this.resourceService.transformLegacyResource(folder))
      }))
    );
  }

  getAnnotationFolder(id: number): Observable<AnnotationFolder> {
    return this.http.get<any>(`${this.apiUrl}/annotation-folders/${id}/`).pipe(
      map(response => this.resourceService.transformLegacyResource(response))
    );
  }

  createAnnotationFolder(folderData: AnnotationFolderCreateRequest): Observable<AnnotationFolder> {
    const preparedData = this.resourceService.prepareForAPI(folderData);
    return this.http.post<any>(`${this.apiUrl}/annotation-folders/`, preparedData).pipe(
      map(response => this.resourceService.transformLegacyResource(response))
    );
  }

  updateAnnotationFolder(id: number, folderData: AnnotationFolderUpdateRequest): Observable<AnnotationFolder> {
    const preparedData = this.resourceService.prepareForAPI(folderData);
    return this.http.patch<any>(`${this.apiUrl}/annotation-folders/${id}/`, preparedData).pipe(
      map(response => this.resourceService.transformLegacyResource(response))
    );
  }

  deleteAnnotationFolder(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/annotation-folders/${id}/`);
  }

  /**
   * WARNING: This method accesses the base annotation endpoint and should only be used
   * for standalone annotations that are NOT attached to parent resources.
   *
   * For annotations attached to parent resources, use the specialized services instead:
   * - Instrument annotations: Use InstrumentService from @noatgnu/cupcake-macaron
   * - StoredReagent annotations: Use ReagentService from @noatgnu/cupcake-macaron
   * - Session annotations: Use SessionService from @noatgnu/cupcake-red-velvet
   *
   * These specialized services ensure proper permission checking through parent resources.
   */
  getAnnotations(params?: {
    search?: string;
    annotationType?: string;
    folder?: number;
    transcribed?: boolean;
    scratched?: boolean;
    labGroup?: number;
    limit?: number;
    offset?: number;
  }): Observable<{count: number, results: Annotation[]}> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof typeof params];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    return this.http.get<any>(`${this.apiUrl}/annotations/`, { params: httpParams }).pipe(
      map(response => ({
        ...response,
        results: response.results.map((annotation: any) => this.resourceService.transformLegacyResource(annotation))
      }))
    );
  }

  /**
   * WARNING: This method accesses the base annotation endpoint and should only be used
   * for standalone annotations that are NOT attached to parent resources.
   *
   * For annotations attached to parent resources, use the specialized services instead:
   * - Instrument annotations: Use InstrumentService.getInstrumentAnnotation()
   * - StoredReagent annotations: Use ReagentService.getStoredReagentAnnotation()
   * - Session annotations: Use SessionService (session folder annotations)
   *
   * The backend enforces parent resource permissions, but using specialized services
   * provides cleaner access control and better context.
   */
  getAnnotation(id: number): Observable<Annotation> {
    return this.http.get<any>(`${this.apiUrl}/annotations/${id}/`).pipe(
      map(response => this.resourceService.transformLegacyResource(response))
    );
  }

  /**
   * WARNING: This method accesses the base annotation endpoint and should only be used
   * for standalone annotations that are NOT attached to parent resources.
   *
   * For creating annotations attached to parent resources, use specialized upload methods:
   * - Instrument annotations: Use InstrumentService.uploadAnnotation()
   * - StoredReagent annotations: Use ReagentService.uploadAnnotation()
   * - Session/Step annotations: Use the appropriate chunked upload service
   *
   * These specialized methods provide chunked upload support, progress tracking,
   * and automatic binding to parent resources with proper permission enforcement.
   */
  createAnnotation(annotationData: AnnotationCreateRequest): Observable<Annotation> {
    const formData = new FormData();
    Object.keys(annotationData).forEach(key => {
      const value = (annotationData as any)[key];
      if (value !== undefined && value !== null) {
        if (key === 'file' && value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, value.toString());
        }
      }
    });
    return this.http.post<any>(`${this.apiUrl}/annotations/`, formData).pipe(
      map(response => this.resourceService.transformLegacyResource(response))
    );
  }

  /**
   * WARNING: This method accesses the base annotation endpoint and should only be used
   * for standalone annotations that are NOT attached to parent resources.
   *
   * For annotations attached to parent resources, the backend enforces parent resource
   * permissions. However, using specialized services provides better context and access control.
   */
  updateAnnotation(id: number, annotationData: AnnotationUpdateRequest): Observable<Annotation> {
    const preparedData = this.resourceService.prepareForAPI(annotationData);
    return this.http.patch<any>(`${this.apiUrl}/annotations/${id}/`, preparedData).pipe(
      map(response => this.resourceService.transformLegacyResource(response))
    );
  }

  /**
   * WARNING: This method accesses the base annotation endpoint and should only be used
   * for standalone annotations that are NOT attached to parent resources.
   *
   * For deleting annotations attached to parent resources, use specialized services:
   * - Instrument annotations: Use InstrumentService.deleteInstrumentAnnotation()
   * - StoredReagent annotations: Use ReagentService.deleteStoredReagentAnnotation()
   * - Session annotations: Use appropriate session/step annotation delete methods
   *
   * The backend enforces parent resource permissions, but using specialized services
   * provides clearer intent and better access control context.
   */
  deleteAnnotation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/annotations/${id}/`);
  }

  // RESOURCE PERMISSIONS

  getResourcePermissions(params?: {
    user?: number;
    resourceContentType?: number;
    resourceObjectId?: number;
    role?: string;
    limit?: number;
    offset?: number;
  }): Observable<{count: number, results: ResourcePermission[]}> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof typeof params];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    return this.http.get<any>(`${this.apiUrl}/resource-permissions/`, { params: httpParams }).pipe(
      map(response => ({
        ...response,
        results: response.results.map((permission: any) => this.resourceService.transformLegacyResource(permission))
      }))
    );
  }

  getResourcePermission(id: number): Observable<ResourcePermission> {
    return this.http.get<any>(`${this.apiUrl}/resource-permissions/${id}/`).pipe(
      map(response => this.resourceService.transformLegacyResource(response))
    );
  }

  createResourcePermission(permissionData: ResourcePermissionCreateRequest): Observable<ResourcePermission> {
    const preparedData = this.resourceService.prepareForAPI(permissionData);
    return this.http.post<any>(`${this.apiUrl}/resource-permissions/`, preparedData).pipe(
      map(response => this.resourceService.transformLegacyResource(response))
    );
  }

  updateResourcePermission(id: number, permissionData: ResourcePermissionUpdateRequest): Observable<ResourcePermission> {
    const preparedData = this.resourceService.prepareForAPI(permissionData);
    return this.http.patch<any>(`${this.apiUrl}/resource-permissions/${id}/`, preparedData).pipe(
      map(response => this.resourceService.transformLegacyResource(response))
    );
  }

  deleteResourcePermission(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/resource-permissions/${id}/`);
  }

  createBulkPermissions(bulkData: BulkPermissionRequest): Observable<{created: ResourcePermission[], errors: any[]}> {
    const preparedData = this.resourceService.prepareForAPI(bulkData);
    return this.http.post<any>(`${this.apiUrl}/resource-permissions/bulk_create/`, preparedData).pipe(
      map(response => ({
        ...response,
        created: response.created.map((permission: any) => this.resourceService.transformLegacyResource(permission))
      }))
    );
  }

  getResourcePermissionsByResource(resourceContentType: number, resourceObjectId: number): Observable<ResourcePermission[]> {
    const httpParams = new HttpParams()
      .set('resourceContentType', resourceContentType.toString())
      .set('resourceObjectId', resourceObjectId.toString());
    return this.http.get<any[]>(`${this.apiUrl}/resource-permissions/by_resource/`, { params: httpParams }).pipe(
      map(permissions => permissions.map(permission => this.resourceService.transformLegacyResource(permission)))
    );
  }

  // REMOTE HOST MANAGEMENT

  getRemoteHosts(params?: {
    search?: string;
    hostName?: string;
    hostProtocol?: string;
    limit?: number;
    offset?: number;
  }): Observable<{count: number, results: RemoteHost[]}> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof typeof params];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    return this.http.get<any>(`${this.apiUrl}/remote-hosts/`, { params: httpParams }).pipe(
      map(response => ({
        ...response,
        results: response.results.map((host: any) => this.resourceService.transformLegacyResource(host))
      }))
    );
  }

  getRemoteHost(id: number): Observable<RemoteHost> {
    return this.http.get<any>(`${this.apiUrl}/remote-hosts/${id}/`).pipe(
      map(response => this.resourceService.transformLegacyResource(response))
    );
  }

  createRemoteHost(hostData: RemoteHostCreateRequest): Observable<RemoteHost> {
    const preparedData = this.resourceService.prepareForAPI(hostData);
    return this.http.post<any>(`${this.apiUrl}/remote-hosts/`, preparedData).pipe(
      map(response => this.resourceService.transformLegacyResource(response))
    );
  }

  updateRemoteHost(id: number, hostData: RemoteHostUpdateRequest): Observable<RemoteHost> {
    const preparedData = this.resourceService.prepareForAPI(hostData);
    return this.http.patch<any>(`${this.apiUrl}/remote-hosts/${id}/`, preparedData).pipe(
      map(response => this.resourceService.transformLegacyResource(response))
    );
  }

  deleteRemoteHost(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/remote-hosts/${id}/`);
  }

  testRemoteHostConnection(id: number): Observable<{success: boolean, message: string}> {
    return this.http.post<{success: boolean, message: string}>(`${this.apiUrl}/remote-hosts/${id}/test_connection/`, {});
  }
}
