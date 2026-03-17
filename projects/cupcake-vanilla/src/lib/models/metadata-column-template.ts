import { BaseTimestampedModel } from './base';

export type ColumnInputType = 'text' | 'select' | 'number_with_unit' | 'pattern' | 'ontology' | 'semver' | 'accession' | 'identifier';

export interface ColumnValidator {
  type: string;
  params: {
    values?: string[];
    units?: string[];
    pattern?: string;
    ontologies?: string[];
    examples?: (string | number)[];
    description?: string;
    error_level?: string;
    format?: string;
    special_values?: string[];
    [key: string]: unknown;
  };
}

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
  notApplicable: boolean;
  notAvailable: boolean;
  excelValidation?: any;
  customValidationRules?: any;
  apiEnhancements?: any;
  visibility: string;
  owner?: number;
  ownerUsername?: string;
  labGroup?: number;
  labGroupName?: string;
  schema?: number;
  schemaName?: string;
  sourceSchema?: string;
  isSystemTemplate: boolean;
  isActive: boolean;
  usageCount?: number;
  tags?: string[];
  category?: string;
  lastUsedAt?: string;
  canEdit?: boolean;
  canDelete?: boolean;
  validators?: ColumnValidator[];
  inputType?: ColumnInputType;
  units?: string[];
  possibleDefaultValues?: (string | number)[];
  ontologyOptions?: string[];
  baseColumn?: boolean;
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
  notApplicable?: boolean;
  notAvailable?: boolean;
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
  notApplicable?: boolean;
  notAvailable?: boolean;
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