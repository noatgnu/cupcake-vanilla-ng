export interface ProtocolsIOAccountStatus {
  connected: boolean;
  username?: string;
  name?: string;
  connectedAt?: string;
  lastUsedAt?: string | null;
}

export interface ProtocolsIOConnectRequest {
  accessToken: string;
}

export interface ProtocolsIOExportRequest {
  target: string;
  scalingFactor?: number;
}

export interface ProtocolsIOExportQueued {
  taskId: string;
  message: string;
}

export interface ProtocolsIOExportResult {
  success: boolean;
  protocolUri: string;
  protocolUrl: string;
  stepsSaved: number;
  stepsDeleted: string[];
  imagesUploaded: number;
  warnings: string[];
  unresolvedTemplates: string[];
}

export type ProtocolsIOProtocolType = 'protocol' | 'collection' | 'document';

export interface ProtocolsIOPage<T> {
  items: T[];
  page: number;
  totalPages: number;
  totalResults: number;
  hasNext: boolean;
}

export interface ProtocolsIOWorkspace {
  uri: string;
  title: string;
  description: string;
}

export interface ProtocolsIOWorkspaceRef {
  id: number | null;
  title: string;
}

export interface ProtocolsIOFolderEntry {
  kind: 'folder';
  title: string;
  guid: string;
  parentGuid: string | null;
  hasSubfolders: boolean;
  workspace: ProtocolsIOWorkspaceRef;
}

export interface ProtocolsIOProtocolEntry {
  kind: 'protocol';
  title: string;
  id: number;
  uri: string;
  protocolType: ProtocolsIOProtocolType;
  importable: boolean;
  lastModified: number | null;
  workspace: ProtocolsIOWorkspaceRef;
}

export type ProtocolsIOBrowseEntry = ProtocolsIOFolderEntry | ProtocolsIOProtocolEntry;

export interface ProtocolsIOImportRequest {
  protocol: string;
}
