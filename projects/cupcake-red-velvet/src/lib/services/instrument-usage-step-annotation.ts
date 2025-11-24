import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@noatgnu/cupcake-core';

import {
  InstrumentUsageStepAnnotation,
  PaginatedResponse
} from '../models';

export interface InstrumentUsageStepAnnotationQueryParams {
  stepAnnotation?: number;
  instrumentUsage?: number;
  limit?: number;
  offset?: number;
  ordering?: string;
}

export interface InstrumentUsageStepAnnotationCreateRequest {
  stepAnnotation: number;
  instrumentUsage: number;
}

@Injectable({
  providedIn: 'root'
})
export class InstrumentUsageStepAnnotationService extends BaseApiService {

  getInstrumentUsageStepAnnotations(params?: InstrumentUsageStepAnnotationQueryParams): Observable<PaginatedResponse<InstrumentUsageStepAnnotation>> {
    const httpParams = this.buildHttpParams(params);
    return this.get<PaginatedResponse<InstrumentUsageStepAnnotation>>(`${this.apiUrl}/instrument-usage-step-annotations/`, { params: httpParams });
  }

  getInstrumentUsageStepAnnotation(id: number): Observable<InstrumentUsageStepAnnotation> {
    return this.get<InstrumentUsageStepAnnotation>(`${this.apiUrl}/instrument-usage-step-annotations/${id}/`);
  }

  getByStepAnnotation(stepAnnotationId: number): Observable<PaginatedResponse<InstrumentUsageStepAnnotation>> {
    return this.getInstrumentUsageStepAnnotations({ stepAnnotation: stepAnnotationId });
  }

  getByInstrumentUsage(instrumentUsageId: number): Observable<PaginatedResponse<InstrumentUsageStepAnnotation>> {
    return this.getInstrumentUsageStepAnnotations({ instrumentUsage: instrumentUsageId });
  }

  createInstrumentUsageStepAnnotation(request: InstrumentUsageStepAnnotationCreateRequest): Observable<InstrumentUsageStepAnnotation> {
    return this.post<InstrumentUsageStepAnnotation>(`${this.apiUrl}/instrument-usage-step-annotations/`, request);
  }

  deleteInstrumentUsageStepAnnotation(id: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/instrument-usage-step-annotations/${id}/`);
  }

  linkStepAnnotationToBooking(stepAnnotationId: number, instrumentUsageId: number): Observable<InstrumentUsageStepAnnotation> {
    return this.createInstrumentUsageStepAnnotation({
      stepAnnotation: stepAnnotationId,
      instrumentUsage: instrumentUsageId
    });
  }

  unlinkStepAnnotationFromBooking(linkId: number): Observable<void> {
    return this.deleteInstrumentUsageStepAnnotation(linkId);
  }
}
