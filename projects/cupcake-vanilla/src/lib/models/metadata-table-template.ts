import { BaseTimestampedModel } from './base';

export interface MetadataTableTemplate extends BaseTimestampedModel {
  id: number;
  name: string;
  description?: string;
  owner?: number;
  ownerUsername?: string;
  labGroup?: number;
  userColumns?: any[];
  userColumnIds?: number[];
  fieldMaskMapping?: any;
  visibility?: string;
  isDefault: boolean;
  columnCount?: number;
}

export interface MetadataTableTemplateCreateRequest {
  name: string;
  description?: string;
  labGroup?: number;
  userColumnIds?: number[];
  fieldMaskMapping?: any;
  visibility?: string;
  isDefault?: boolean;
}

export interface MetadataTableTemplateUpdateRequest {
  name?: string;
  description?: string;
  userColumnIds?: number[];
  fieldMaskMapping?: any;
  visibility?: string;
  isDefault?: boolean;
}

export interface MetadataTableTemplateQueryResponse {
  count: number;
  next?: string;
  previous?: string;
  results: MetadataTableTemplate[];
}