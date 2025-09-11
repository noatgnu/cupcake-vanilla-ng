import { BaseTimestampedModel } from './base';
import { MetadataColumn } from './metadata-column';

export interface SamplePool extends BaseTimestampedModel {
  id: number;
  poolName: string;
  poolDescription?: string; // blank=True, null=True
  pooledOnlySamples: number[]; // default=list
  pooledAndIndependentSamples: number[]; // default=list
  isReference: boolean; // default=False
  sdrfValue?: string; // computed property, not stored
  metadataTable: number;
  metadataTableName?: string; // computed from relationship
  totalSamples?: number; // computed property
  allSampleIndices?: number[]; // computed property
  metadataColumns: MetadataColumn[]; // many-to-many relationship, always present
}

export interface SamplePoolCreateRequest {
  poolName: string;
  poolDescription?: string; // blank=True, null=True
  pooledOnlySamples?: number[]; // default=list, optional in create
  pooledAndIndependentSamples?: number[]; // default=list, optional in create
  isReference?: boolean; // default=False, optional in create
  sdrfValue?: string; // optional field for SDRF compliance
  metadataTable: number;
}

export interface SamplePoolUpdateRequest {
  poolName?: string;
  poolDescription?: string;
  pooledOnlySamples?: number[];
  pooledAndIndependentSamples?: number[];
  isReference?: boolean;
  sdrfValue?: string;
}