import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@noatgnu/cupcake-core';

import {
  AsyncTaskStatus,
  AsyncTaskQueryParams,
  AsyncTaskCreateResponse,
  DownloadUrlResponse,
  PaginatedResponse
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class AsyncTaskService extends BaseApiService {

  /**
   * Get all async tasks for the current user with optional filtering
   */
  getAsyncTasks(params?: AsyncTaskQueryParams): Observable<PaginatedResponse<AsyncTaskStatus>> {
    const httpParams = this.buildHttpParams(params);
    return this.get<PaginatedResponse<AsyncTaskStatus>>(`${this.apiUrl}/async-tasks/`, { params: httpParams });
  }

  /**
   * Get a specific async task by ID
   */
  getAsyncTask(id: string): Observable<AsyncTaskStatus> {
    return this.get<AsyncTaskStatus>(`${this.apiUrl}/async-tasks/${id}/`);
  }

  /**
   * Cancel a queued or running task
   */
  cancelTask(id: string): Observable<{ message: string }> {
    return this.delete<{ message: string }>(`${this.apiUrl}/async-tasks/${id}/cancel/`);
  }

  /**
   * Generate a signed download URL for task result file
   */
  getDownloadUrl(id: string): Observable<DownloadUrlResponse> {
    return this.get<DownloadUrlResponse>(`${this.apiUrl}/async-tasks/${id}/download_url/`);
  }

  /**
   * Direct download endpoint (returns blob for file download)
   */
  downloadTaskFile(id: string, token: string): Observable<Blob> {
    const httpParams = this.buildHttpParams({ token });
    return this.get(`${this.apiUrl}/async-tasks/${id}/download/`, { params: httpParams, responseType: 'blob' });
  }
}