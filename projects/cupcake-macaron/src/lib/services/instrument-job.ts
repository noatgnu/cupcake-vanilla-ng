import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@noatgnu/cupcake-core';
import { MetadataTable, MetadataColumn, MetadataColumnCreateRequest } from '@noatgnu/cupcake-vanilla';

import {
  InstrumentJob,
  InstrumentJobCreateRequest,
  InstrumentJobUpdateRequest,
  PaginatedResponse,
  JobType,
  Status,
  SampleType
} from '../models';

export interface InstrumentJobQueryParams {
  search?: string;
  jobType?: JobType;
  status?: Status;
  sampleType?: SampleType;
  assigned?: boolean;
  user?: number;
  instrument?: number;
  metadataTable?: number;
  project?: number;
  limit?: number;
  offset?: number;
  ordering?: string;
}

@Injectable({
  providedIn: 'root'
})
export class InstrumentJobService extends BaseApiService {

  /**
   * Get all instrument jobs with optional filtering
   */
  getInstrumentJobs(params?: InstrumentJobQueryParams): Observable<PaginatedResponse<InstrumentJob>> {
    const httpParams = this.buildHttpParams(params);
    return this.get<PaginatedResponse<InstrumentJob>>(`${this.apiUrl}/instrument-jobs/`, { params: httpParams });
  }

  /**
   * Get a single instrument job by ID
   */
  getInstrumentJob(id: number): Observable<InstrumentJob> {
    return this.get<InstrumentJob>(`${this.apiUrl}/instrument-jobs/${id}/`);
  }

  /**
   * Create a new instrument job
   */
  createInstrumentJob(job: InstrumentJobCreateRequest): Observable<InstrumentJob> {
    return this.post<InstrumentJob>(`${this.apiUrl}/instrument-jobs/`, job);
  }

  /**
   * Update an existing instrument job
   */
  updateInstrumentJob(id: number, job: InstrumentJobUpdateRequest): Observable<InstrumentJob> {
    return this.put<InstrumentJob>(`${this.apiUrl}/instrument-jobs/${id}/`, job);
  }

  /**
   * Partially update an instrument job
   */
  patchInstrumentJob(id: number, job: Partial<InstrumentJobUpdateRequest>): Observable<InstrumentJob> {
    return this.patch<InstrumentJob>(`${this.apiUrl}/instrument-jobs/${id}/`, job);
  }

  /**
   * Delete an instrument job
   */
  deleteInstrumentJob(id: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/instrument-jobs/${id}/`);
  }

  /**
   * Submit a job for processing
   */
  submitJob(id: number): Observable<{ message: string; job: InstrumentJob }> {
    return this.post<{ message: string; job: InstrumentJob }>(`${this.apiUrl}/instrument-jobs/${id}/submit/`, {});
  }

  /**
   * Mark a job as completed
   */
  completeJob(id: number): Observable<{ message: string; job: InstrumentJob }> {
    return this.post<{ message: string; job: InstrumentJob }>(`${this.apiUrl}/instrument-jobs/${id}/complete/`, {});
  }

  /**
   * Cancel a job
   */
  cancelJob(id: number): Observable<{ message: string; job: InstrumentJob }> {
    return this.post<{ message: string; job: InstrumentJob }>(`${this.apiUrl}/instrument-jobs/${id}/cancel/`, {});
  }

  /**
   * Get current user's jobs
   */
  getMyJobs(): Observable<PaginatedResponse<InstrumentJob>> {
    return this.get<PaginatedResponse<InstrumentJob>>(`${this.apiUrl}/instrument-jobs/my_jobs/`);
  }

  /**
   * Get jobs assigned to current user (for staff)
   */
  getAssignedJobs(): Observable<PaginatedResponse<InstrumentJob>> {
    return this.get<PaginatedResponse<InstrumentJob>>(`${this.apiUrl}/instrument-jobs/assigned_jobs/`);
  }

  /**
   * Create a metadata table for this job from an existing template
   */
  createMetadataFromTemplate(
    id: number,
    params: {
      templateId: number;
      name?: string;
      description?: string;
      sampleCount?: number;
      labGroupId?: number;
    }
  ): Observable<{
    message: string;
    metadataTable: MetadataTable;
    jobId: number;
  }> {
    return this.post<{
      message: string;
      metadataTable: MetadataTable;
      jobId: number;
    }>(`${this.apiUrl}/instrument-jobs/${id}/create_metadata_from_template/`, {
      template_id: params.templateId,
      name: params.name,
      description: params.description,
      sample_count: params.sampleCount,
      lab_group_id: params.labGroupId,
    });
  }

  /**
   * Get jobs by status
   */
  getJobsByStatus(status: Status): Observable<PaginatedResponse<InstrumentJob>> {
    return this.getInstrumentJobs({ status });
  }

  /**
   * Get jobs by type
   */
  getJobsByType(jobType: JobType): Observable<PaginatedResponse<InstrumentJob>> {
    return this.getInstrumentJobs({ jobType });
  }

  /**
   * Get jobs for a specific instrument
   */
  getJobsForInstrument(instrumentId: number): Observable<PaginatedResponse<InstrumentJob>> {
    return this.getInstrumentJobs({ instrument: instrumentId });
  }

  /**
   * Get jobs for a specific project
   */
  getJobsForProject(projectId: number): Observable<PaginatedResponse<InstrumentJob>> {
    return this.getInstrumentJobs({ project: projectId });
  }

  /**
   * Search jobs by name or details
   */
  searchInstrumentJobs(query: string): Observable<PaginatedResponse<InstrumentJob>> {
    return this.getInstrumentJobs({ search: query });
  }

  /**
   * Get assigned jobs
   */
  getAssignedInstrumentJobs(): Observable<PaginatedResponse<InstrumentJob>> {
    return this.getInstrumentJobs({ assigned: true });
  }

  /**
   * Get autocomplete values for funder and cost_center from user's existing jobs
   */
  getAutocompleteFields(): Observable<{ funders: string[]; cost_centers: string[] }> {
    return this.get<{ funders: string[]; cost_centers: string[] }>(`${this.apiUrl}/instrument-jobs/autocomplete_fields/`);
  }
}