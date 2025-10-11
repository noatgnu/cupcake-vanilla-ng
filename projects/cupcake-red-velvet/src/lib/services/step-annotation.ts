import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@noatgnu/cupcake-core';

import {
  StepAnnotation,
  PaginatedResponse
} from '../models';

export interface StepAnnotationQueryParams {
  session?: number;
  step?: number;
  annotationType?: string;
  limit?: number;
  offset?: number;
  ordering?: string;
}

export interface StepAnnotationCreateRequest {
  session: number;
  step: number;
  annotation?: number;
  annotationType?: string;
}

export interface StepAnnotationUpdateRequest {
  annotation?: number;
  annotationType?: string;
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

  getAnnotationsForSession(sessionId: number): Observable<PaginatedResponse<StepAnnotation>> {
    return this.getStepAnnotations({ session: sessionId });
  }

  getAnnotationsForStep(stepId: number): Observable<PaginatedResponse<StepAnnotation>> {
    return this.getStepAnnotations({ step: stepId });
  }

  getAnnotationsForSessionAndStep(sessionId: number, stepId: number): Observable<PaginatedResponse<StepAnnotation>> {
    return this.getStepAnnotations({ session: sessionId, step: stepId });
  }
}
