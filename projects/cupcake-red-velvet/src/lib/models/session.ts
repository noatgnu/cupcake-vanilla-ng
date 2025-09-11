import { BaseTimestampedModel, RemoteSystemModel, OwnedModel } from './base';

export interface Session extends BaseTimestampedModel, RemoteSystemModel, OwnedModel {
  id: number;
  uniqueId?: string;
  name: string;
  enabled: boolean;
  processing: boolean;
  startedAt?: string;
  endedAt?: string;
  editorsUsernames?: string[];
  viewersUsernames?: string[];
  protocols?: number[];
  protocolCount?: number;
  duration?: number;
  isRunning?: boolean;
  status?: string;
  importInfo?: any;
  remoteHostInfo?: any;
}

export interface SessionAnnotation extends BaseTimestampedModel {
  id: number;
  session: number;
  sessionName?: string;
  annotation?: number;
  annotationType?: string;
  annotationText?: string;
  order: number;
  metadataTable?: number;
  metadataTableName?: string;
  metadataTableId?: number;
  metadataColumnsCount?: number;
}

export interface StepAnnotation extends BaseTimestampedModel {
  id: number;
  session: number;
  sessionName?: string;
  step: number;
  stepDescription?: string;
  annotation?: number;
  annotationName?: string;
  annotationType?: string;
}

export interface SessionAnnotationFolder extends BaseTimestampedModel {
  id: number;
  session: number;
  sessionName?: string;
  folder?: number;
  folderName?: string;
}

export interface InstrumentUsageSessionAnnotation extends BaseTimestampedModel {
  id: number;
  sessionAnnotation: number;
  sessionAnnotationDetails?: any;
  instrumentUsage: number;
  instrumentName?: string;
}

export interface SessionCreateRequest {
  uniqueId?: string;
  name: string;
  enabled?: boolean;
  protocols?: number[];
  editors?: number[];
  viewers?: number[];
  remoteId?: number;
  remoteHost?: number;
}

export interface SessionUpdateRequest {
  name?: string;
  enabled?: boolean;
  processing?: boolean;
  protocols?: number[];
  editors?: number[];
  viewers?: number[];
  status?: string;
}

export interface SessionAnnotationCreateRequest {
  session: number;
  annotation?: number;
  annotationType?: string;
  annotationText?: string;
  order?: number;
  metadataTable?: number;
}

export interface SessionAnnotationUpdateRequest {
  annotationType?: string;
  annotationText?: string;
  order?: number;
  metadataTable?: number;
}