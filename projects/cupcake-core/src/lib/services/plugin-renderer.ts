import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseApiService } from './base-api';
import { PluginRecord } from '../models/plugin';

@Injectable({ providedIn: 'root' })
export class PluginRendererService extends BaseApiService {

  fetch<T>(baseUrl: string, endpoint: string): Observable<T> {
    return this.get<T>(`${baseUrl}${endpoint}`);
  }

  submit<T>(baseUrl: string, endpoint: string, body: PluginRecord): Observable<T> {
    return this.post<T>(`${baseUrl}${endpoint}`, body);
  }
}
