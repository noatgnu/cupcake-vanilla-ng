import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@noatgnu/cupcake-core';

import {
  ProtocolsIOExportQueued,
  ProtocolsIORun,
  ProtocolsIOSessionExportRequest,
  ProtocolsIOSessionProtocolStatus
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class ProtocolsIOSessionService extends BaseApiService {

  /**
   * Queue an export of a session into protocols.io runs, one for each protocol, with the current user's account
   * @param id Session ID
   * @param request Protocols to export, whether to start new runs, the folder for new runs and the session address
   * @returns Observable with the ID of the task tracking the export
   */
  exportSession(id: number, request: ProtocolsIOSessionExportRequest = {}): Observable<ProtocolsIOExportQueued> {
    return this.post<ProtocolsIOExportQueued>(`${this.apiUrl}/protocols-io/sessions/${id}/export/`, request);
  }

  /**
   * Describe how each protocol of a session would be exported to protocols.io by the current user
   * @param id Session ID
   * @returns Observable with the latest protocol export, the number of varied steps and the latest run of each protocol
   */
  getStatus(id: number): Observable<ProtocolsIOSessionProtocolStatus[]> {
    return this.get<ProtocolsIOSessionProtocolStatus[]>(`${this.apiUrl}/protocols-io/sessions/${id}/status/`);
  }

  /**
   * List the protocols.io runs a session was exported into, most recent first
   * @param id Session ID
   * @returns Observable with the runs
   */
  getRuns(id: number): Observable<ProtocolsIORun[]> {
    return this.get<ProtocolsIORun[]>(`${this.apiUrl}/protocols-io/sessions/${id}/runs/`);
  }
}
