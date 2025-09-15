import { BaseTimestampedModel } from './base';

export interface MetadataTable extends BaseTimestampedModel {
  id: number;
  name: string;
  description?: string;
  sampleCount: number;
  version: string;
  owner?: number;
  ownerUsername?: string;
  labGroup?: number;
  labGroupName?: string;
  isLocked: boolean;
  isPublished: boolean;
  visibility: 'private' | 'group' | 'public';
  contentType?: number;
  objectId?: number;
  columns?: any[];
  samplePools?: any[];
  columnCount?: number;
  sampleRange?: string;
  canEdit?: boolean;
  sourceApp?: string;
}

export interface MetadataTableCreateRequest {
  name: string;
  description?: string;
  sampleCount: number;
  version?: string;
  labGroup?: number;
  isPublished?: boolean;
  sourceApp?: string;
}

export interface MetadataTableUpdateRequest {
  name?: string;
  description?: string;
  sampleCount?: number;
  sampleCountConfirmed?: boolean;
  version?: string;
  labGroup?: number;
  isLocked?: boolean;
  isPublished?: boolean;
}

export interface SampleCountValidationRequest {
  newSampleCount: number;
}

export interface SampleCountValidationResult {
  valid: boolean;
  warnings: string[];
  affectedModifiers: Array<{
    modifierIndex: number;
    columnName: string;
    samples: string;
    invalidIndices: number[];
    value: string;
  }>;
  affectedPools: Array<{
    poolName: string;
    invalidPooledOnly: number[];
    invalidPooledAndIndependent: number[];
  }>;
  samplesToRemove: number[];
}

export interface SampleCountValidationResponse {
  currentSampleCount: number;
  newSampleCount: number;
  validationResult: SampleCountValidationResult;
}

export interface SampleCountConfirmationError {
  sampleCount: string[];
  sampleCountConfirmationDetails: {
    currentSampleCount: number;
    newSampleCount: number;
    requiresConfirmation: true;
    validationResult: SampleCountValidationResult;
  };
}

export interface MetadataTableQueryResponse {
  count: number;
  next?: string;
  previous?: string;
  results: MetadataTable[];
}