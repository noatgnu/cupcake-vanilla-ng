import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@noatgnu/cupcake-core';

import {
  MaintenanceLogAnnotation,
  MaintenanceLogAnnotationQueryParams,
  MaintenanceLogAnnotationCreateRequest,
  MaintenanceLogAnnotationUpdateRequest,
  PaginatedResponse
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class MaintenanceLogAnnotationService extends BaseApiService {

  getMaintenanceLogAnnotations(params?: MaintenanceLogAnnotationQueryParams): Observable<PaginatedResponse<MaintenanceLogAnnotation>> {
    const httpParams = this.buildHttpParams(params);
    return this.get<PaginatedResponse<MaintenanceLogAnnotation>>(`${this.apiUrl}/maintenance-log-annotations/`, { params: httpParams });
  }

  getMaintenanceLogAnnotation(id: number): Observable<MaintenanceLogAnnotation> {
    return this.get<MaintenanceLogAnnotation>(`${this.apiUrl}/maintenance-log-annotations/${id}/`);
  }

  getAnnotationsForMaintenanceLog(maintenanceLogId: number, params?: Omit<MaintenanceLogAnnotationQueryParams, 'maintenanceLog'>): Observable<PaginatedResponse<MaintenanceLogAnnotation>> {
    return this.getMaintenanceLogAnnotations({ maintenanceLog: maintenanceLogId, ...params });
  }

  createMaintenanceLogAnnotation(annotation: MaintenanceLogAnnotationCreateRequest): Observable<MaintenanceLogAnnotation> {
    return this.post<MaintenanceLogAnnotation>(`${this.apiUrl}/maintenance-log-annotations/`, annotation);
  }

  updateMaintenanceLogAnnotation(id: number, annotation: MaintenanceLogAnnotationUpdateRequest): Observable<MaintenanceLogAnnotation> {
    return this.put<MaintenanceLogAnnotation>(`${this.apiUrl}/maintenance-log-annotations/${id}/`, annotation);
  }

  patchMaintenanceLogAnnotation(id: number, annotation: Partial<MaintenanceLogAnnotationUpdateRequest>): Observable<MaintenanceLogAnnotation> {
    return this.patch<MaintenanceLogAnnotation>(`${this.apiUrl}/maintenance-log-annotations/${id}/`, annotation);
  }

  deleteMaintenanceLogAnnotation(id: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/maintenance-log-annotations/${id}/`);
  }
}
