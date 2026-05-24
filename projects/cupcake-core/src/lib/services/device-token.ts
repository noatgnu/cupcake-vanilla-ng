import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { DeviceToken, DeviceTokenCreate, DeviceSummary } from '../models/device-token';
import { BaseApiService } from './base-api';

export interface PaginatedDeviceTokens {
  count: number;
  results: DeviceToken[];
}

@Injectable({ providedIn: 'root' })
export class DeviceTokenService extends BaseApiService {

  private get base(): string {
    return `${this.apiUrl}/ccc/device-tokens`;
  }

  list(): Observable<PaginatedDeviceTokens> {
    return this.get<PaginatedDeviceTokens>(`${this.base}/?limit=10`);
  }

  create(payload: DeviceTokenCreate): Observable<DeviceToken> {
    return this.post<DeviceToken>(`${this.base}/`, payload);
  }

  update(id: number, payload: Partial<DeviceTokenCreate>): Observable<DeviceToken> {
    return this.patch<DeviceToken>(`${this.base}/${id}/`, payload);
  }

  toggle(id: number): Observable<{ enabled: boolean }> {
    return this.post<{ enabled: boolean }>(`${this.base}/${id}/toggle/`, {});
  }

  rotate(id: number): Observable<{ token: string }> {
    return this.post<{ token: string }>(`${this.base}/${id}/rotate/`, {});
  }

  remove(id: number): Observable<void> {
    return this.delete<void>(`${this.base}/${id}/`);
  }

  getSummary(): Observable<DeviceSummary> {
    return this.get<DeviceSummary>(`${this.apiUrl}/ccc/device/summary/`);
  }
}
