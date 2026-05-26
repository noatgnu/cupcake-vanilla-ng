import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Plugin, PluginBroadcastRequest, PluginRegisterRequest } from '../models/plugin';
import { BaseApiService } from './base-api';

@Injectable({ providedIn: 'root' })
export class PluginService extends BaseApiService {

  private get base(): string {
    return `${this.apiUrl}/plugins`;
  }

  listPlugins(): Observable<Plugin[]> {
    return this.get<Plugin[]>(`${this.base}/`);
  }

  getPlugin(id: number): Observable<Plugin> {
    return this.get<Plugin>(`${this.base}/${id}/`);
  }

  getManifest(id: number): Observable<Plugin['manifestCache']> {
    return this.get<Plugin['manifestCache']>(`${this.base}/${id}/manifest/`);
  }

  register(req: PluginRegisterRequest): Observable<Plugin> {
    return this.post<Plugin>(`${this.base}/register/`, req);
  }

  broadcast(id: number, req: PluginBroadcastRequest): Observable<{ sent: boolean; group: string }> {
    return this.post<{ sent: boolean; group: string }>(`${this.base}/${id}/broadcast/`, req);
  }

  deletePlugin(id: number): Observable<void> {
    return this.delete<void>(`${this.base}/${id}/`);
  }

  patchPlugin(id: number, data: Partial<Plugin>): Observable<Plugin> {
    return this.patch<Plugin>(`${this.base}/${id}/`, data);
  }
}
