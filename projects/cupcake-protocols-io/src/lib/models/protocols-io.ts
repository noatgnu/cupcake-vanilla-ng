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
  protocolGuid: string;
  protocolId: number;
  stepIds: number[];
  stepsSaved: number;
  stepsDeleted: string[];
  imagesUploaded: number;
  warnings: string[];
  unresolvedTemplates: string[];
}

export interface ProtocolsIOProtocolExport {
  id: number;
  protocol: number;
  session: number | null;
  variationHash: string;
  exportedBy: number | null;
  exportedByUsername: string | null;
  protocolsIoId: number;
  protocolsIoGuid: string;
  protocolsIoUri: string;
  protocolsIoUrl: string;
  stepIds: number[];
  exportedAt: string;
}

export interface ProtocolsIOSessionExportRequest {
  protocols?: number[];
  newRuns?: boolean;
  folder?: string;
  sessionUrl?: string;
}

export interface ProtocolsIORun {
  id: number;
  session: number;
  protocol: number;
  protocolTitle: string;
  protocolExport: number | null;
  exportedBy: number | null;
  exportedByUsername: string | null;
  recordId: number;
  recordGuid: string;
  recordUrl: string;
  itemId: number;
  title: string;
  commentCount: number;
  createdAt: string;
  exportedAt: string;
}

export interface ProtocolsIORunExportResult {
  runId: number;
  protocolId: number;
  recordGuid: string;
  recordUrl: string;
  title: string;
  created: boolean;
  variationsUsed: number;
  protocolCopyUrl: string;
  commentsAdded: number;
  commentsUpdated: number;
  commentsDeleted: number;
  commentsUnchanged: number;
  filesUploaded: number;
  warnings: string[];
}

export interface ProtocolsIOSessionProtocolStatus {
  protocol: number;
  protocolTitle: string;
  protocolExport: ProtocolsIOProtocolExport | null;
  variedSteps: number;
  run: ProtocolsIORun | null;
  runIsCurrent: boolean;
}

export interface ProtocolsIOSessionExportResult {
  success: boolean;
  runs: ProtocolsIORunExportResult[];
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
