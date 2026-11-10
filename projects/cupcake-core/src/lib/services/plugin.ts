import { Injectable } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import { expand, map, reduce } from 'rxjs/operators';

import { PaginatedResponse } from '../models/base';
import { Plugin, PluginBroadcastRequest, PluginRegisterRequest } from '../models/plugin';
import { BaseApiService } from './base-api';

export interface PluginWithToken extends Plugin {
  token: string;
}

export const PLUGIN_PAGE_SIZE = 10;

@Injectable({ providedIn: 'root' })
export class PluginService extends BaseApiService {

  private get base(): string {
    return `${this.apiUrl}/plugins`;
  }

  listPlugins(params: { limit?: number; offset?: number } = {}): Observable<PaginatedResponse<Plugin>> {
    return this.get<PaginatedResponse<Plugin>>(`${this.base}/`, {
      params: this.buildHttpParams({ limit: PLUGIN_PAGE_SIZE, offset: 0, ...params }),
    });
  }

  listAllPlugins(): Observable<Plugin[]> {
    return this.listPlugins().pipe(
      expand((page, index) =>
        page.next ? this.listPlugins({ offset: (index + 1) * PLUGIN_PAGE_SIZE }) : EMPTY
      ),
      map(page => page.results),
      reduce((all, results) => all.concat(results), [] as Plugin[]),
    );
  }

  getPlugin(id: number): Observable<Plugin> {
    return this.get<Plugin>(`${this.base}/${id}/`);
  }

  getManifest(id: number): Observable<Plugin['manifestCache']> {
    return this.get<Plugin['manifestCache']>(`${this.base}/${id}/manifest/`);
  }

  register(req: PluginRegisterRequest): Observable<PluginWithToken> {
    return this.post<PluginWithToken>(`${this.base}/register/`, req);
  }

  resetToken(id: number): Observable<PluginWithToken> {
    return this.post<PluginWithToken>(`${this.base}/${id}/reset-token/`, {});
  }

  checkConnection(id: number): Observable<Plugin> {
    return this.post<Plugin>(`${this.base}/${id}/check-connection/`, {});
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
