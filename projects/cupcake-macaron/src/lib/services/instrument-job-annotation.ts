import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@noatgnu/cupcake-core';
import {
  InstrumentJobAnnotation,
  InstrumentJobAnnotationCreateRequest,
  InstrumentJobAnnotationUpdateRequest,
  InstrumentJobAnnotationQueryResponse,
  InstrumentJobAnnotationRole
} from '../models';

export interface InstrumentJobAnnotationQueryParams {
  instrumentJob?: number;
  folder?: number;
  role?: InstrumentJobAnnotationRole;
  search?: string;
  ordering?: string;
  limit?: number;
  offset?: number;
}

@Injectable({
  providedIn: 'root'
})
export class InstrumentJobAnnotationService extends BaseApiService {

  getInstrumentJobAnnotations(params?: InstrumentJobAnnotationQueryParams): Observable<InstrumentJobAnnotationQueryResponse> {
    const httpParams = this.buildHttpParams(params);
    return this.get<InstrumentJobAnnotationQueryResponse>(`${this.apiUrl}/instrument-job-annotations/`, { params: httpParams });
  }

  getInstrumentJobAnnotation(id: number): Observable<InstrumentJobAnnotation> {
    return this.get<InstrumentJobAnnotation>(`${this.apiUrl}/instrument-job-annotations/${id}/`);
  }

  createInstrumentJobAnnotation(annotation: InstrumentJobAnnotationCreateRequest): Observable<InstrumentJobAnnotation> {
    return this.post<InstrumentJobAnnotation>(`${this.apiUrl}/instrument-job-annotations/`, annotation);
  }

  updateInstrumentJobAnnotation(id: number, annotation: InstrumentJobAnnotationUpdateRequest): Observable<InstrumentJobAnnotation> {
    return this.patch<InstrumentJobAnnotation>(`${this.apiUrl}/instrument-job-annotations/${id}/`, annotation);
  }

  deleteInstrumentJobAnnotation(id: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/instrument-job-annotations/${id}/`);
  }

  /**
   * Get annotations for a specific instrument job
   */
  getAnnotationsForJob(jobId: number, params?: Omit<InstrumentJobAnnotationQueryParams, 'instrumentJob'>): Observable<InstrumentJobAnnotationQueryResponse> {
    return this.getInstrumentJobAnnotations({ ...params, instrumentJob: jobId });
  }

  /**
   * Get annotations in a specific folder
   */
  getAnnotationsInFolder(folderId: number, params?: Omit<InstrumentJobAnnotationQueryParams, 'folder'>): Observable<InstrumentJobAnnotationQueryResponse> {
    return this.getInstrumentJobAnnotations({ ...params, folder: folderId });
  }

  /**
   * Get user annotations for a specific instrument job
   */
  getUserAnnotationsForJob(jobId: number, params?: Omit<InstrumentJobAnnotationQueryParams, 'instrumentJob' | 'role'>): Observable<InstrumentJobAnnotationQueryResponse> {
    return this.getInstrumentJobAnnotations({ ...params, instrumentJob: jobId, role: 'user' });
  }

  /**
   * Get staff annotations for a specific instrument job
   */
  getStaffAnnotationsForJob(jobId: number, params?: Omit<InstrumentJobAnnotationQueryParams, 'instrumentJob' | 'role'>): Observable<InstrumentJobAnnotationQueryResponse> {
    return this.getInstrumentJobAnnotations({ ...params, instrumentJob: jobId, role: 'staff' });
  }

  /**
   * Create a user annotation (job owner context)
   */
  createUserAnnotation(annotation: Omit<InstrumentJobAnnotationCreateRequest, 'role'>): Observable<InstrumentJobAnnotation> {
    return this.createInstrumentJobAnnotation({ ...annotation, role: 'user' });
  }

  /**
   * Create a staff annotation (assigned staff context)
   */
  createStaffAnnotation(annotation: Omit<InstrumentJobAnnotationCreateRequest, 'role'>): Observable<InstrumentJobAnnotation> {
    return this.createInstrumentJobAnnotation({ ...annotation, role: 'staff' });
  }

  /**
   * Retrigger transcription and translation for audio/video annotation
   * Only available to staff/admin users
   */
  retriggerTranscription(id: number): Observable<{ message: string; annotation_id: number }> {
    return this.post<{ message: string; annotation_id: number }>(`${this.apiUrl}/instrument-job-annotations/${id}/retrigger_transcription/`, {});
  }
}
