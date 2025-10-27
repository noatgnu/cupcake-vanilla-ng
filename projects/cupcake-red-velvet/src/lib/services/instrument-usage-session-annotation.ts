import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@noatgnu/cupcake-core';

import {
  InstrumentUsageSessionAnnotation,
  PaginatedResponse
} from '../models';

export interface InstrumentUsageSessionAnnotationQueryParams {
  sessionAnnotation?: number;
  instrumentUsage?: number;
  limit?: number;
  offset?: number;
  ordering?: string;
}

export interface InstrumentUsageSessionAnnotationCreateRequest {
  sessionAnnotation: number;
  instrumentUsage: number;
}

@Injectable({
  providedIn: 'root'
})
export class InstrumentUsageSessionAnnotationService extends BaseApiService {

  getInstrumentUsageSessionAnnotations(params?: InstrumentUsageSessionAnnotationQueryParams): Observable<PaginatedResponse<InstrumentUsageSessionAnnotation>> {
    const httpParams = this.buildHttpParams(params);
    return this.get<PaginatedResponse<InstrumentUsageSessionAnnotation>>(`${this.apiUrl}/instrument-usage-session-annotations/`, { params: httpParams });
  }

  getInstrumentUsageSessionAnnotation(id: number): Observable<InstrumentUsageSessionAnnotation> {
    return this.get<InstrumentUsageSessionAnnotation>(`${this.apiUrl}/instrument-usage-session-annotations/${id}/`);
  }

  getBySessionAnnotation(sessionAnnotationId: number): Observable<PaginatedResponse<InstrumentUsageSessionAnnotation>> {
    return this.getInstrumentUsageSessionAnnotations({ sessionAnnotation: sessionAnnotationId });
  }

  getByInstrumentUsage(instrumentUsageId: number): Observable<PaginatedResponse<InstrumentUsageSessionAnnotation>> {
    return this.getInstrumentUsageSessionAnnotations({ instrumentUsage: instrumentUsageId });
  }

  createInstrumentUsageSessionAnnotation(request: InstrumentUsageSessionAnnotationCreateRequest): Observable<InstrumentUsageSessionAnnotation> {
    return this.post<InstrumentUsageSessionAnnotation>(`${this.apiUrl}/instrument-usage-session-annotations/`, request);
  }

  deleteInstrumentUsageSessionAnnotation(id: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/instrument-usage-session-annotations/${id}/`);
  }

  linkSessionAnnotationToBooking(sessionAnnotationId: number, instrumentUsageId: number): Observable<InstrumentUsageSessionAnnotation> {
    return this.createInstrumentUsageSessionAnnotation({
      sessionAnnotation: sessionAnnotationId,
      instrumentUsage: instrumentUsageId
    });
  }

  unlinkSessionAnnotationFromBooking(linkId: number): Observable<void> {
    return this.deleteInstrumentUsageSessionAnnotation(linkId);
  }
}
