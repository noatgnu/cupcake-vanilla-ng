import { BaseTimestampedModel, RemoteSystemModel, OwnedModel } from './base';

export interface ProtocolRating extends BaseTimestampedModel, RemoteSystemModel {
  id: number;
  protocol: number;
  user: number;
  userUsername?: string;
  userDisplayName?: string;
  complexityRating: number;
  durationRating: number;
}

export interface ProtocolStep extends BaseTimestampedModel, RemoteSystemModel {
  id: number;
  protocol: number;
  stepId?: string;
  stepDescription?: string;
  stepSection?: string;
  sectionDescription?: string;
  stepDuration?: number;
  order: number;
  previousStep?: number;
  nextSteps?: number[];
  hasNext: boolean;
  hasPrevious: boolean;
  original?: number;
  branchFrom?: number;
}

export interface ProtocolSection extends BaseTimestampedModel, RemoteSystemModel {
  id: number;
  protocol: number;
  sectionDescription?: string;
  sectionDuration?: number;
  order: number;
  steps?: ProtocolStep[];
  stepsInOrder?: ProtocolStep[];
  firstStep?: number;
  lastStep?: number;
}

export interface ProtocolModel extends BaseTimestampedModel, RemoteSystemModel, OwnedModel {
  id: number;
  protocolId?: string;
  protocolCreatedOn?: string;
  protocolDoi?: string;
  protocolTitle?: string;
  protocolUrl?: string;
  protocolVersionUri?: string;
  protocolDescription?: string;
  enabled: boolean;
  modelHash?: string;
  editorsUsernames?: string[];
  viewersUsernames?: string[];
  sections?: ProtocolSection[];
  ratings?: ProtocolRating[];
  remoteHostInfo?: any;
  stepsCount?: number;
  averageComplexity?: number;
  averageDuration?: number;
  isVaulted: boolean;
}

export interface Project extends BaseTimestampedModel, RemoteSystemModel, OwnedModel {
  id: number;
  projectName: string;
  projectDescription?: string;
  sessions?: number[];
  sessionCount?: number;
  activeSessionCount?: number;
  remoteHostInfo?: any;
  isVaulted: boolean;
}

export interface ProtocolReagent extends BaseTimestampedModel {
  id: number;
  protocol: number;
  reagent: number;
  reagentId?: number;
  reagentName?: string;
  reagentUnit?: string;
  quantity: number;
  remoteId?: number;
}

export interface StepReagent extends BaseTimestampedModel {
  id: number;
  step: number;
  reagent: number;
  reagentId?: number;
  reagentName?: string;
  reagentUnit?: string;
  quantity: number;
  scalable: boolean;
  scalableFactor: number;
  scaledQuantity?: number;
  remoteId?: number;
}

export interface StepVariation extends BaseTimestampedModel, RemoteSystemModel {
  id: number;
  step: number;
  stepDescription?: string;
  variationDescription?: string;
  variationDuration?: number;
}

export interface ProtocolCreateRequest {
  protocolId?: string;
  protocolCreatedOn?: string;
  protocolDoi?: string;
  protocolTitle?: string;
  protocolUrl?: string;
  protocolVersionUri?: string;
  protocolDescription?: string;
  enabled?: boolean;
  modelHash?: string;
  editors?: number[];
  viewers?: number[];
  remoteId?: number;
  remoteHost?: number;
  isVaulted?: boolean;
}

export interface ProtocolUpdateRequest {
  protocolTitle?: string;
  protocolDescription?: string;
  enabled?: boolean;
  editors?: number[];
  viewers?: number[];
  isVaulted?: boolean;
}

export interface ProjectCreateRequest {
  projectName: string;
  projectDescription?: string;
  sessions?: number[];
  remoteId?: number;
  remoteHost?: number;
  isVaulted?: boolean;
}

export interface ProjectUpdateRequest {
  projectName?: string;
  projectDescription?: string;
  sessions?: number[];
  isVaulted?: boolean;
}

export interface ProtocolRatingRequest {
  protocol: number;
  complexityRating: number;
  durationRating: number;
}