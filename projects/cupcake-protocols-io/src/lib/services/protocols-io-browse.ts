import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@noatgnu/cupcake-core';

import {
  ProtocolsIOBrowseEntry,
  ProtocolsIOFolderEntry,
  ProtocolsIOPage,
  ProtocolsIOProtocolEntry,
  ProtocolsIOWorkspace
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class ProtocolsIOBrowseService extends BaseApiService {

  /**
   * List the workspaces the current user belongs to on protocols.io
   */
  getWorkspaces(page?: number): Observable<ProtocolsIOPage<ProtocolsIOWorkspace>> {
    const params = this.buildHttpParams({ page });
    return this.get<ProtocolsIOPage<ProtocolsIOWorkspace>>(`${this.apiUrl}/protocols-io/browse/workspaces/`, { params });
  }

  /**
   * List the top-level folders of a protocols.io workspace
   */
  getWorkspaceItems(workspaceUri: string, page?: number): Observable<ProtocolsIOPage<ProtocolsIOFolderEntry>> {
    const params = this.buildHttpParams({ workspace: workspaceUri, page });
    return this.get<ProtocolsIOPage<ProtocolsIOFolderEntry>>(`${this.apiUrl}/protocols-io/browse/workspace_items/`, { params });
  }

  /**
   * List the folders and protocols inside a protocols.io folder
   */
  getFolderItems(folderGuid: string, page?: number): Observable<ProtocolsIOPage<ProtocolsIOBrowseEntry>> {
    const params = this.buildHttpParams({ folder: folderGuid, page });
    return this.get<ProtocolsIOPage<ProtocolsIOBrowseEntry>>(`${this.apiUrl}/protocols-io/browse/folder_items/`, { params });
  }

  /**
   * Search protocols in every protocols.io workspace the current user can see
   */
  search(text: string, page?: number): Observable<ProtocolsIOPage<ProtocolsIOProtocolEntry>> {
    const params = this.buildHttpParams({ q: text, page });
    return this.get<ProtocolsIOPage<ProtocolsIOProtocolEntry>>(`${this.apiUrl}/protocols-io/browse/search/`, { params });
  }
}
