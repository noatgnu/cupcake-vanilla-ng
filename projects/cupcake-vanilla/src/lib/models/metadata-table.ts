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
  version?: string;
  isLocked?: boolean;
  isPublished?: boolean;
}

export interface MetadataTableQueryResponse {
  count: number;
  next?: string;
  previous?: string;
  results: MetadataTable[];
}