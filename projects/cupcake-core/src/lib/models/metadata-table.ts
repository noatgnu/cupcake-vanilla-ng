import { MetadataColumn } from './metadata-column';
import { SamplePool } from './sample-pool';
import { BaseResource } from './resource';

export interface MetadataTable extends BaseResource {
  id: number;
  name: string;
  description?: string;
  sample_count: number;
  version: string;
  is_published: boolean;
  columns: MetadataColumn[];
  sample_pools?: SamplePool[];
}

export interface MetadataTableQueryResponse {
  count: number;
  next?: string;
  previous?: string;
  results: MetadataTable[];
}

export interface MetadataTableCreateRequest {
  name: string;
  description?: string;
  sample_count?: number;
  lab_group?: number;
}