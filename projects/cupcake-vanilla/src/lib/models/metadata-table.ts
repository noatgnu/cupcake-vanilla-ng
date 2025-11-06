import { BaseTimestampedModel } from './base';
import { MetadataColumn } from './metadata-column';
import { SamplePool } from './sample-pool';

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
  columns?: MetadataColumn[];
  samplePools?: SamplePool[];
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

export interface VariationSpecRange {
  columnId: number;
  type: 'range';
  start: number;
  end: number;
  step?: number;
}

export interface VariationSpecList {
  columnId: number;
  type: 'list';
  values: any[];
}

export interface VariationSpecPattern {
  columnId: number;
  type: 'pattern';
  pattern: string;
  count: number;
}

export type VariationSpec = VariationSpecRange | VariationSpecList | VariationSpecPattern;

export interface AdvancedAutofillRequest {
  templateSamples: number[];
  targetSampleCount: number;
  variations: VariationSpec[];
  fillStrategy: 'cartesian_product' | 'sequential' | 'interleaved';
}

export interface AdvancedAutofillResponse {
  status: 'success';
  samplesModified: number;
  columnsModified: number;
  variationsCombinations: number;
  strategy: string;
}