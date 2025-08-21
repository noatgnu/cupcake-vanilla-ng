import { MetadataColumn } from './metadata-column';

export interface SamplePool {
  id: number;
  pool_name: string;
  pool_description?: string;
  pooled_only_samples: number[];
  pooled_and_independent_samples: number[];
  template_sample?: number;
  is_reference: boolean;
  metadata_columns: MetadataColumn[];
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export interface SamplePoolCreateRequest {
  pool_name: string;
  pool_description?: string;
  pooled_only_samples: number[];
  pooled_and_independent_samples: number[];
  template_sample?: number;
  is_reference?: boolean;
  metadata_table: number;
}