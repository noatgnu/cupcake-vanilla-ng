import { BaseTimestampedModel } from './base';

export interface MetadataColumnTemplate extends BaseTimestampedModel {
  id: number;
  name: string;
  description?: string;
  columnName: string;
  columnType: string;
  defaultValue?: string;
  defaultPosition?: number;
  ontologyType?: string;
  customOntologyFilters?: any;
  enableTypeahead: boolean;
  excelValidation?: any;
  customValidationRules?: any;
  apiEnhancements?: any;
  visibility: string;
  owner?: number;
  ownerUsername?: string;
  labGroup?: number;
  labGroupName?: string;
  isSystemTemplate: boolean;
  isActive: boolean;
  usageCount?: number;
  tags?: string[];
  category?: string;
  lastUsedAt?: string;
  canEdit?: boolean;
  canDelete?: boolean;
}

export interface MetadataColumnTemplateShare extends BaseTimestampedModel {
  id: number;
  template: number;
  templateName?: string;
  sharedWith: number;
  sharedWithUsername?: string;
  sharedBy: number;
  sharedByUsername?: string;
  canEdit: boolean;
}

export interface MetadataColumnTemplateCreateRequest {
  name: string;
  description?: string;
  columnName: string;
  columnType: string;
  defaultValue?: string;
  defaultPosition?: number;
  ontologyType?: string;
  customOntologyFilters?: any;
  enableTypeahead?: boolean;
  excelValidation?: any;
  customValidationRules?: any;
  apiEnhancements?: any;
  visibility?: string;
  labGroup?: number;
  tags?: string[];
  category?: string;
}

export interface MetadataColumnTemplateUpdateRequest {
  name?: string;
  description?: string;
  columnName?: string;
  columnType?: string;
  defaultValue?: string;
  defaultPosition?: number;
  ontologyType?: string;
  customOntologyFilters?: any;
  enableTypeahead?: boolean;
  excelValidation?: any;
  customValidationRules?: any;
  apiEnhancements?: any;
  visibility?: string;
  isActive?: boolean;
  tags?: string[];
  category?: string;
}

export interface MetadataColumnTemplateShareCreateRequest {
  template: number;
  sharedWith: number;
  canEdit?: boolean;
}