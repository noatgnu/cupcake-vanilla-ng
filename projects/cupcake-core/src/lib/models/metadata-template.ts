import { MetadataColumn } from './metadata-column';
import { BaseResource } from './resource';

export interface MetadataTableTemplate extends BaseResource {
  id: number;
  name: string;
  description?: string;
  user_columns: MetadataColumn[];
  field_mask_mapping: { [key: string]: any };
  is_default?: boolean;
  column_count?: number;
}

export interface FieldMaskMapping {
  id?: number;
  original_field: string;
  display_field: string;
}

export interface MetadataTableTemplateQueryResponse {
  count: number;
  next?: string;
  previous?: string;
  results: MetadataTableTemplate[];
}

export interface MetadataTemplate {
  userMetadataTemplate: {name: string; type: string}[];
  staffMetadataSpecific: string[];
}
