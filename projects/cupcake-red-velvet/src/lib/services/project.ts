import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@cupcake/core';

import {
  Project,
  ProjectCreateRequest,
  ProjectUpdateRequest,
  PaginatedResponse,
  Session
} from '../models';

export interface ProjectQueryParams {
  search?: string;
  owner?: number;
  isVaulted?: boolean;
  visibility?: string;
  labGroup?: number;
  limit?: number;
  offset?: number;
  ordering?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService extends BaseApiService {

  /**
   * Get all projects with optional filtering
   */
  getProjects(params?: ProjectQueryParams): Observable<PaginatedResponse<Project>> {
    const httpParams = this.buildHttpParams(params);
    return this.get<PaginatedResponse<Project>>(`${this.apiUrl}/projects/`, { params: httpParams });
  }

  /**
   * Get a single project by ID
   */
  getProject(id: number): Observable<Project> {
    return this.get<Project>(`${this.apiUrl}/projects/${id}/`);
  }

  /**
   * Create a new project
   */
  createProject(project: ProjectCreateRequest): Observable<Project> {
    return this.post<Project>(`${this.apiUrl}/projects/`, project);
  }

  /**
   * Update an existing project
   */
  updateProject(id: number, project: ProjectUpdateRequest): Observable<Project> {
    return this.put<Project>(`${this.apiUrl}/projects/${id}/`, project);
  }

  /**
   * Partially update a project
   */
  patchProject(id: number, project: Partial<ProjectUpdateRequest>): Observable<Project> {
    return this.patch<Project>(`${this.apiUrl}/projects/${id}/`, project);
  }

  /**
   * Delete a project
   */
  deleteProject(id: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/projects/${id}/`);
  }

  /**
   * Get all sessions for a project
   */
  getProjectSessions(id: number): Observable<Session[]> {
    return this.get<Session[]>(`${this.apiUrl}/projects/${id}/sessions/`);
  }

  /**
   * Get projects owned by current user
   */
  getMyProjects(): Observable<Project[]> {
    return this.get<Project[]>(`${this.apiUrl}/projects/my_projects/`);
  }

  /**
   * Get vaulted/imported projects for current user
   */
  getVaultedProjects(): Observable<Project[]> {
    return this.get<Project[]>(`${this.apiUrl}/projects/vaulted_projects/`);
  }

  /**
   * Search projects by name or description
   */
  searchProjects(query: string): Observable<PaginatedResponse<Project>> {
    return this.getProjects({ search: query });
  }

  /**
   * Get projects by owner
   */
  getProjectsByOwner(ownerId: number): Observable<PaginatedResponse<Project>> {
    return this.getProjects({ owner: ownerId });
  }

  /**
   * Get projects by lab group
   */
  getProjectsByLabGroup(labGroupId: number): Observable<PaginatedResponse<Project>> {
    return this.getProjects({ labGroup: labGroupId });
  }

  /**
   * Get public projects
   */
  getPublicProjects(): Observable<PaginatedResponse<Project>> {
    return this.getProjects({ visibility: 'public' });
  }

  /**
   * Get private projects
   */
  getPrivateProjects(): Observable<PaginatedResponse<Project>> {
    return this.getProjects({ visibility: 'private' });
  }
}