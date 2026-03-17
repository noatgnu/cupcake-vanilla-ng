import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WebSocketService, WebSocketMessage } from './websocket';

@Injectable({
  providedIn: 'root'
})
export class AdminWebSocketService extends WebSocketService {

  constructor() {
    super();
    this.endpoint = 'ccc/admin';
    this.config.endpoint = 'ccc/admin';
    this.config.url = this.getWebSocketUrl();
  }

  getAdminNotifications(): Observable<WebSocketMessage> {
    return this.filterMessages('admin.notification');
  }

  override getSystemNotifications(): Observable<WebSocketMessage> {
    return this.filterMessages('system.notification');
  }
}
