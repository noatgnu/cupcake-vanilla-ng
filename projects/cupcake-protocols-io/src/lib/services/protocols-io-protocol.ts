import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@noatgnu/cupcake-core';
import { ProtocolModel } from '@noatgnu/cupcake-red-velvet';

import {
  ProtocolsIOExportQueued,
  ProtocolsIOExportRequest,
  ProtocolsIOImportRequest,
  ProtocolsIOProtocolExport
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class ProtocolsIOProtocolService extends BaseApiService {

  /**
   * Import a protocol from a protocols.io address or DOI link, with the current user's account when one is connected
   * @param url Address or DOI link of a protocols.io protocol
   * @returns Observable with the created protocol
   */
  importFromUrl(url: string): Observable<ProtocolModel> {
    return this.post<ProtocolModel>(`${this.apiUrl}/protocols-io/protocols/import/`, { url });
  }

  /**
   * Import a protocol from protocols.io with the current user's own account
   * @param protocol Address, URI or id of a protocols.io protocol the user can open
   * @returns Observable with the created protocol
   */
  importFromAccount(protocol: string): Observable<ProtocolModel> {
    const request: ProtocolsIOImportRequest = { protocol };
    return this.post<ProtocolModel>(`${this.apiUrl}/protocols-io/protocols/import_from_account/`, request);
  }

  /**
   * Queue an export of a protocol into an existing protocols.io protocol with the current user's account
   * @param id Protocol ID
   * @param request Address, URI, id or GUID of the protocols.io protocol, and an optional scaling factor
   * @returns Observable with the ID of the task tracking the export
   */
  exportProtocol(id: number, request: ProtocolsIOExportRequest): Observable<ProtocolsIOExportQueued> {
    return this.post<ProtocolsIOExportQueued>(`${this.apiUrl}/protocols-io/protocols/${id}/export/`, request);
  }

  /**
   * List the protocols.io protocols a protocol was exported into, most recent first
   * @param id Protocol ID
   * @returns Observable with the exports
   */
  getExports(id: number): Observable<ProtocolsIOProtocolExport[]> {
    return this.get<ProtocolsIOProtocolExport[]>(`${this.apiUrl}/protocols-io/protocols/${id}/exports/`);
  }
}
