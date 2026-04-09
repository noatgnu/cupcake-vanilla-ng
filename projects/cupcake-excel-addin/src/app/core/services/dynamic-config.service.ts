import { Injectable, inject } from '@angular/core';
import { ConnectionService } from './connection.service';

@Injectable({
  providedIn: 'root'
})
export class DynamicConfigService {
  private connectionService = inject(ConnectionService);

  get apiUrl(): string {
    return this.connectionService.baseUrl();
  }
}
