import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@noatgnu/cupcake-core';

import {
  InstrumentUsageJobAnnotation,
  PaginatedResponse
} from '../models';

export interface InstrumentUsageJobAnnotationQueryParams {
  instrumentJobAnnotation?: number;
  instrumentUsage?: number;
  limit?: number;
  offset?: number;
  ordering?: string;
}

export interface InstrumentUsageJobAnnotationCreateRequest {
  instrumentJobAnnotation: number;
  instrumentUsage: number;
  order?: number;
}

@Injectable({
  providedIn: 'root'
})
export class InstrumentUsageJobAnnotationService extends BaseApiService {

  getInstrumentUsageJobAnnotations(params?: InstrumentUsageJobAnnotationQueryParams): Observable<PaginatedResponse<InstrumentUsageJobAnnotation>> {
    const httpParams = this.buildHttpParams(params);
    return this.get<PaginatedResponse<InstrumentUsageJobAnnotation>>(`${this.apiUrl}/instrument-usage-job-annotations/`, { params: httpParams });
  }

  getInstrumentUsageJobAnnotation(id: number): Observable<InstrumentUsageJobAnnotation> {
    return this.get<InstrumentUsageJobAnnotation>(`${this.apiUrl}/instrument-usage-job-annotations/${id}/`);
  }

  getByInstrumentJobAnnotation(instrumentJobAnnotationId: number): Observable<PaginatedResponse<InstrumentUsageJobAnnotation>> {
    return this.getInstrumentUsageJobAnnotations({ instrumentJobAnnotation: instrumentJobAnnotationId });
  }

  getByInstrumentUsage(instrumentUsageId: number): Observable<PaginatedResponse<InstrumentUsageJobAnnotation>> {
    return this.getInstrumentUsageJobAnnotations({ instrumentUsage: instrumentUsageId });
  }

  createInstrumentUsageJobAnnotation(request: InstrumentUsageJobAnnotationCreateRequest): Observable<InstrumentUsageJobAnnotation> {
    return this.post<InstrumentUsageJobAnnotation>(`${this.apiUrl}/instrument-usage-job-annotations/`, request);
  }

  updateInstrumentUsageJobAnnotation(id: number, request: Partial<InstrumentUsageJobAnnotationCreateRequest>): Observable<InstrumentUsageJobAnnotation> {
    return this.patch<InstrumentUsageJobAnnotation>(`${this.apiUrl}/instrument-usage-job-annotations/${id}/`, request);
  }

  deleteInstrumentUsageJobAnnotation(id: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/instrument-usage-job-annotations/${id}/`);
  }

  linkJobAnnotationToBooking(instrumentJobAnnotationId: number, instrumentUsageId: number): Observable<InstrumentUsageJobAnnotation> {
    return this.createInstrumentUsageJobAnnotation({
      instrumentJobAnnotation: instrumentJobAnnotationId,
      instrumentUsage: instrumentUsageId
    });
  }

  unlinkJobAnnotationFromBooking(linkId: number): Observable<void> {
    return this.deleteInstrumentUsageJobAnnotation(linkId);
  }
}
