import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WebSocketService as BaseWebSocketService, WebSocketMessage, AuthService, WEBSOCKET_ENDPOINT } from '@noatgnu/cupcake-core';

export type { WebSocketMessage };

@Injectable({
  providedIn: 'root'
})
export class Websocket extends BaseWebSocketService {

  constructor(authService: AuthService) {
    super(authService);
    this.endpoint = 'ccc/notifications';
    this.config.endpoint = 'ccc/notifications';
    this.config.url = this.getWebSocketUrl();
  }


  getMetadataTableUpdates(): Observable<WebSocketMessage> {
    return this.filterMessages('metadata_table.update');
  }

  getLabGroupUpdates(): Observable<WebSocketMessage> {
    return this.filterMessages('lab_group.update');
  }
}
