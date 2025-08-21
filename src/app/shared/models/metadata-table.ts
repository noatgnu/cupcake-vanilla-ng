import { MetadataColumn } from './metadata-column';
import { SamplePool } from './sample-pool';

export interface MetadataTable {
  id: number;
  name: string;
  description?: string;
  sample_count: number;
  version: string;
  creator?: number;
  creator_username?: string;
  lab_group?: number;
  lab_group_name?: string;
  is_locked: boolean;
  is_published: boolean;
  can_edit: boolean;
  columns: MetadataColumn[];
  sample_pools?: SamplePool[];
  created_at: string;
  updated_at: string;
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