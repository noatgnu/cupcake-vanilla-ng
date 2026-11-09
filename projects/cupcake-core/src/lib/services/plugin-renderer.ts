import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseApiService } from './base-api';
import { PluginRecord } from '../models/plugin';

@Injectable({ providedIn: 'root' })
export class PluginRendererService extends BaseApiService {

  fetch<T>(pluginId: number, endpoint: string): Observable<T> {
    return this.get<T>(`${this.apiUrl}/plugins/${pluginId}/call/`, { params: this.buildHttpParams({ endpoint }) });
  }

  submit<T>(pluginId: number, endpoint: string, data: PluginRecord): Observable<T> {
    return this.post<T>(`${this.apiUrl}/plugins/${pluginId}/call/`, { endpoint, data });
  }
}
