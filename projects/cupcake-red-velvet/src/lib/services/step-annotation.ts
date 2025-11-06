import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@noatgnu/cupcake-core';

import {
  StepAnnotation,
  StepAnnotationCreateRequest,
  StepAnnotationUpdateRequest,
  PaginatedResponse
} from '../models';

export interface StepAnnotationQueryParams {
  session?: number;
  step?: number;
  annotation?: number;
  scratched?: boolean;
  limit?: number;
  offset?: number;
  ordering?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StepAnnotationService extends BaseApiService {

  getStepAnnotations(params?: StepAnnotationQueryParams): Observable<PaginatedResponse<StepAnnotation>> {
    const httpParams = this.buildHttpParams(params);
    return this.get<PaginatedResponse<StepAnnotation>>(`${this.apiUrl}/step-annotations/`, { params: httpParams });
  }

  getStepAnnotation(id: number): Observable<StepAnnotation> {
    return this.get<StepAnnotation>(`${this.apiUrl}/step-annotations/${id}/`);
  }

  createStepAnnotation(annotation: StepAnnotationCreateRequest): Observable<StepAnnotation> {
    return this.post<StepAnnotation>(`${this.apiUrl}/step-annotations/`, annotation);
  }

  updateStepAnnotation(id: number, annotation: StepAnnotationUpdateRequest): Observable<StepAnnotation> {
    return this.put<StepAnnotation>(`${this.apiUrl}/step-annotations/${id}/`, annotation);
  }

  patchStepAnnotation(id: number, annotation: Partial<StepAnnotationUpdateRequest>): Observable<StepAnnotation> {
    return this.patch<StepAnnotation>(`${this.apiUrl}/step-annotations/${id}/`, annotation);
  }

  deleteStepAnnotation(id: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/step-annotations/${id}/`);
  }

  getAnnotationsForSession(sessionId: number, params?: Omit<StepAnnotationQueryParams, 'session'>): Observable<PaginatedResponse<StepAnnotation>> {
    return this.getStepAnnotations({ session: sessionId, ...params });
  }

  getAnnotationsForStep(stepId: number, params?: Omit<StepAnnotationQueryParams, 'step'>): Observable<PaginatedResponse<StepAnnotation>> {
    return this.getStepAnnotations({ step: stepId, ...params });
  }

  getAnnotationsForSessionAndStep(sessionId: number, stepId: number, params?: Omit<StepAnnotationQueryParams, 'session' | 'step'>): Observable<PaginatedResponse<StepAnnotation>> {
    return this.getStepAnnotations({ session: sessionId, step: stepId, ...params });
  }

  /**
   * Get all step annotations for a specific annotation
   */
  getStepAnnotationsForAnnotation(annotationId: number, params?: Omit<StepAnnotationQueryParams, 'annotation'>): Observable<PaginatedResponse<StepAnnotation>> {
    return this.getStepAnnotations({ annotation: annotationId, ...params });
  }

  /**
   * Retrigger transcription and translation for audio/video annotation
   * Only available to staff/admin users
   */
  retriggerTranscription(id: number): Observable<{ message: string; annotation_id: number }> {
    return this.post<{ message: string; annotation_id: number }>(`${this.apiUrl}/step-annotations/${id}/retrigger_transcription/`, {});
  }
}
