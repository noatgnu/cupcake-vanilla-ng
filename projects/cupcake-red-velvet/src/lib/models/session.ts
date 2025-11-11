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
  projects?: number[];
  protocolCount?: number;
  duration?: number;
  isRunning?: boolean;
  status?: string;
  importInfo?: any;
  remoteHostInfo?: any;
  webrtcSessions?: string[];
}

export interface SessionAnnotation extends BaseTimestampedModel {
  id: number;
  session: number;
  sessionName?: string;
  annotation?: number;
  annotationType?: string;
  annotationText?: string;
  fileUrl?: string;
  order: number;
  metadataTable?: number;
  metadataTableName?: string;
  metadataTableId?: number;
  metadataColumnsCount?: number;
  transcribed?: boolean;
  transcription?: string;
  language?: string;
  translation?: string;
  scratched?: boolean;
}

export interface StepAnnotation {
  id: number;
  session: number;
  sessionName?: string;
  step: number;
  stepDescription?: string;
  annotation?: number;
  annotationName?: string;
  annotationType?: string;
  annotationText?: string;
  transcribed?: boolean;
  transcription?: string;
  language?: string;
  translation?: string;
  scratched?: boolean;
  fileUrl?: string;
  instrumentUsageIds?: number[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface SessionAnnotationFolder {
  id: number;
  session: number;
  sessionName?: string;
  folder?: number;
  folderName?: string;
  createdAt: string;
}

export interface InstrumentUsageSessionAnnotation {
  id: number;
  sessionAnnotation: number;
  sessionAnnotationDetails?: any;
  instrumentUsage: number;
  instrumentName?: string;
  createdAt: string;
}

export interface InstrumentUsageStepAnnotation {
  id: number;
  stepAnnotation: number;
  stepAnnotationDetails?: any;
  instrumentUsage: number;
  instrumentName?: string;
  createdAt: string;
}

export interface SessionCreateRequest {
  uniqueId?: string;
  name: string;
  enabled?: boolean;
  protocols?: number[];
  projects?: number[];
  editors?: number[];
  viewers?: number[];
  remoteId?: number;
  remoteHost?: number;
  startedAt?: string;
  endedAt?: string;
}

export interface SessionUpdateRequest {
  name?: string;
  enabled?: boolean;
  processing?: boolean;
  protocols?: number[];
  projects?: number[];
  editors?: number[];
  viewers?: number[];
  status?: string;
  startedAt?: string;
  endedAt?: string;
}

export interface AnnotationDataRequest {
  annotation: string;
  annotationType?: string;
  transcription?: string;
  language?: string;
  translation?: string;
  scratched?: boolean;
  autoTranscribe?: boolean;
}

export interface SessionAnnotationCreateRequest {
  session: number;
  annotation?: number;
  annotationData?: AnnotationDataRequest;
  order?: number;
  metadataTable?: number;
}

export interface StepAnnotationCreateRequest {
  session: number;
  step: number;
  annotation?: number;
  annotationData?: AnnotationDataRequest;
  order?: number;
}

export interface StepAnnotationUpdateRequest {
  annotationData?: Partial<AnnotationDataRequest>;
  order?: number;
}

export interface SessionAnnotationUpdateRequest {
  annotationData?: Partial<AnnotationDataRequest>;
  order?: number;
  metadataTable?: number;
}