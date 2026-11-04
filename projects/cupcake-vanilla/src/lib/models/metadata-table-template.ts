import { ResourceVisibility } from '@noatgnu/cupcake-core';
import { BaseTimestampedModel } from './base';
import { MetadataColumn } from './metadata-column';

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

export interface MetadataTableTemplateSyncRequest {
  add_new?: boolean;
  update_existing?: boolean;
  remove_orphans?: boolean;
}

export interface MetadataTableTemplateSyncResponse {
  message: string;
  added: number;
  updated: number;
  removed: number;
  errors: string[];
  schemas: string[];
}

export interface TemplateAddColumnRequest {
  columnData: Partial<MetadataColumn>;
  position?: number;
}

export interface TemplateColumnResponse {
  message: string;
  column: MetadataColumn;
}

export interface TemplateDuplicateColumnRequest {
  columnId: number;
  newName?: string;
}

export interface TemplateApplyResponse {
  message: string;
  createdColumns: MetadataColumn[];
}

export interface TemplateFieldMaskUpdateResponse {
  message: string;
  fieldMaskMapping: Record<string, string>;
}

export interface TemplateFieldMask {
  fieldMaskMapping: Record<string, string>;
  templateName: string;
  templateId: number;
}

export interface TemplateMaskedColumn {
  id: number;
  name: string;
  type: string;
  displayName: string;
  hasFieldMask: boolean;
  columnPosition: number | null;
  mandatory: boolean;
  hidden: boolean;
}

export interface TemplateColumnsWithFieldMasks extends TemplateFieldMask {
  columns: TemplateMaskedColumn[];
}

export interface TemplateFromSchemaRequest {
  name: string;
  schemaIds: number[];
  description?: string;
  labGroupId?: number | null;
  visibility?: ResourceVisibility;
  isDefault?: boolean;
}

export interface TableFromTemplateRequest {
  templateId: number;
  name: string;
  description?: string;
  sampleCount: number;
  labGroupId?: number | null;
}

export interface TableFromSchemasRequest {
  schemaIds: number[];
  name: string;
  description?: string;
  sampleCount: number;
  labGroupId?: number | null;
}
