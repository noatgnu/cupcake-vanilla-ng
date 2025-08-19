import { MetadataColumn } from './metadata-column';

export interface MetadataTableTemplate {
  id: number;
  name: string;
  description?: string;
  user_columns: MetadataColumn[];
  field_mask_mapping: { [key: string]: any };
  is_public?: boolean;
  is_default?: boolean;
  column_count?: number;
  user?: string | { id: number; username: string };
  lab_group?: number | { id: number; name: string };
  created_at?: string;
  updated_at?: string;
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
