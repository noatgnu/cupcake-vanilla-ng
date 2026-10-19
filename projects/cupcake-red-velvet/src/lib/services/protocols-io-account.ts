import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@noatgnu/cupcake-core';

import { ProtocolsIOAccountStatus, ProtocolsIOConnectRequest } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ProtocolsIOAccountService extends BaseApiService {

  /**
   * Get whether the current user has a connected protocols.io account
   */
  getStatus(): Observable<ProtocolsIOAccountStatus> {
    return this.get<ProtocolsIOAccountStatus>(`${this.apiUrl}/protocols-io/account/`);
  }

  /**
   * Check a protocols.io access token and save it as the current user's account
   */
  connect(accessToken: string): Observable<ProtocolsIOAccountStatus> {
    const request: ProtocolsIOConnectRequest = { accessToken };
    return this.post<ProtocolsIOAccountStatus>(`${this.apiUrl}/protocols-io/account/`, request);
  }

  /**
   * Remove the current user's saved protocols.io account
   */
  disconnect(): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/protocols-io/account/disconnect/`);
  }
}
