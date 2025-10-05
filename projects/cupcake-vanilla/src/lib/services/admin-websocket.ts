import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WebSocketService as BaseWebSocketService, WebSocketMessage, AuthService } from '@noatgnu/cupcake-core';

@Injectable({
  providedIn: 'root'
})
export class AdminWebSocketService extends BaseWebSocketService {

  constructor(authService: AuthService) {
    super(authService);
    this.endpoint = 'ccv/admin';
    this.config.endpoint = 'ccv/admin';
    this.config.url = this.getWebSocketUrl();
  }

  getAdminNotifications(): Observable<WebSocketMessage> {
    return this.filterMessages('admin.notification');
  }

  override getSystemNotifications(): Observable<WebSocketMessage> {
    return this.filterMessages('system.notification');
  }
}